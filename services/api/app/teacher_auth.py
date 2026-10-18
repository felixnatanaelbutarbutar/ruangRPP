"""Google Identity Services login, distinct from privileged admin authentication."""
import hashlib
import os
import re
import secrets
from datetime import timedelta, timezone
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from google.auth.exceptions import GoogleAuthError
from google.auth.transport.requests import Request as GoogleRequest
from google.oauth2 import id_token
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import delete, select
from sqlalchemy.exc import IntegrityError

from .db import Audit, GoogleChallenge, Session, Teacher, TeacherSession, now

router = APIRouter(prefix='/api/v1/teacher')
COOKIE = 'rr_teacher_session'
CHALLENGE_COOKIE = 'rr_teacher_login'
CHALLENGE_PATH = '/api/v1/teacher/auth'


def digest(value):
    return hashlib.sha256(value.encode()).hexdigest()


def client_id():
    value = os.getenv('GOOGLE_CLIENT_ID', '').strip()
    return value if re.fullmatch(r'[A-Za-z0-9-]+\.apps\.googleusercontent\.com', value) else ''


def same_origin(request: Request):
    allowed = set(os.getenv('ALLOWED_ORIGINS', 'http://localhost:3000,http://127.0.0.1:3000').split(','))
    if request.headers.get('origin') not in allowed:
        raise HTTPException(403, 'Permintaan masuk harus berasal dari situs RuangRPP.')


def secure_cookie():
    return os.getenv('COOKIE_SECURE') == '1'


def record(db, teacher, action):
    db.add(Audit(id=str(uuid4()), actor_id=teacher.id, actor_name=teacher.name, action=action))


def current_teacher(request: Request):
    token = request.cookies.get(COOKIE, '')
    with Session() as db:
        session = db.get(TeacherSession, digest(token)) if token else None
        if not session or session.expires_at.replace(tzinfo=timezone.utc) <= now():
            raise HTTPException(401, 'Silakan masuk ke akun guru.')
        teacher = db.get(Teacher, session.teacher_id)
        if not teacher:
            raise HTTPException(401, 'Akun guru tidak tersedia.')
        return teacher


def teacher_payload(teacher):
    from .billing import configuration
    return {'id': teacher.id, 'name': teacher.name, 'email': teacher.email, 'role': 'teacher',
            'generation_available': os.getenv('RAG_ENABLED', 'true').lower() == 'true', 'billing_available': configuration()['available']}


@router.get('/auth/config')
def config():
    return {'google_enabled': bool(client_id()), 'client_id': client_id() or None}


@router.post('/auth/challenge', dependencies=[Depends(same_origin)])
def challenge(request: Request, response: Response):
    if not client_id():
        raise HTTPException(503, 'Login Google belum dikonfigurasi oleh pengelola.')
    binding, nonce = secrets.token_urlsafe(32), secrets.token_urlsafe(32)
    with Session() as db:
        old_binding = request.cookies.get(CHALLENGE_COOKIE, '')
        db.execute(delete(GoogleChallenge).where(GoogleChallenge.expires_at <= now()))
        if old_binding:
            db.execute(delete(GoogleChallenge).where(GoogleChallenge.binding_hash == digest(old_binding)))
        db.add(GoogleChallenge(binding_hash=digest(binding), nonce_hash=digest(nonce), expires_at=now() + timedelta(minutes=10)))
        db.commit()
    response.set_cookie(CHALLENGE_COOKIE, binding, max_age=600, httponly=True, secure=secure_cookie(),
                        samesite='strict', path=CHALLENGE_PATH)
    return {'nonce': nonce, 'expires_in': 600}


class GoogleLogin(BaseModel):
    model_config = ConfigDict(extra='forbid')
    credential: str = Field(min_length=1, max_length=16384)


def verify_google_token(credential, audience):
    # Official library checks signature, expiration, issuer and expected audience.
    # Bound network time, do not expose token content or upstream exception text.
    transport = GoogleRequest()
    def request_with_timeout(*args, **kwargs):
        kwargs['timeout'] = 10
        return transport(*args, **kwargs)
    return id_token.verify_oauth2_token(credential, request_with_timeout, audience=audience)


@router.post('/auth/google', dependencies=[Depends(same_origin)])
def login(body: GoogleLogin, request: Request, response: Response):
    audience = client_id()
    if not audience:
        raise HTTPException(503, 'Login Google belum dikonfigurasi oleh pengelola.')
    binding = request.cookies.get(CHALLENGE_COOKIE, '')
    with Session() as db:
        attempt = db.get(GoogleChallenge, digest(binding)) if binding else None
        if not attempt or attempt.expires_at.replace(tzinfo=timezone.utc) <= now():
            raise HTTPException(401, 'Percobaan masuk berakhir. Muat ulang halaman login.')
    try:
        claims = verify_google_token(body.credential, audience)
    except (ValueError, GoogleAuthError):
        raise HTTPException(401, 'Identitas Google tidak dapat diverifikasi. Coba masuk kembali.')
    if (claims.get('email_verified') is not True or not isinstance(claims.get('sub'), str)
            or not 1 <= len(claims['sub']) <= 255 or not isinstance(claims.get('email'), str)
            or not 1 <= len(claims['email']) <= 254 or not isinstance(claims.get('nonce'), str)
            or claims.get('azp', audience) != audience):
        raise HTTPException(401, 'Identitas Google belum memenuhi pemeriksaan akun.')
    with Session() as db:
        # Atomic consume: a captured credential cannot be replayed or used from another browser.
        consumed = db.execute(delete(GoogleChallenge).where(
            GoogleChallenge.binding_hash == digest(binding),
            GoogleChallenge.nonce_hash == digest(claims['nonce']),
            GoogleChallenge.expires_at > now()).returning(GoogleChallenge.binding_hash)).scalar_one_or_none()
        db.commit()
        if not consumed:
            raise HTTPException(401, 'Percobaan masuk tidak cocok atau sudah digunakan. Muat ulang halaman login.')

        teacher = db.scalar(select(Teacher).where(Teacher.google_sub == claims['sub']))
        if not teacher:
            teacher = Teacher(id=str(uuid4()), google_sub=claims['sub'], email=claims['email'],
                              name=str(claims.get('name') or 'Guru')[:120])
            db.add(teacher)
            try:
                db.flush()
            except IntegrityError:
                db.rollback()
                teacher = db.scalar(select(Teacher).where(Teacher.google_sub == claims['sub']))
                if not teacher:
                    raise HTTPException(409, 'Akun sedang dibuat. Coba masuk kembali.')
        # Never merge with admin or another teacher based on email; Google sub is the identity.
        teacher.email = claims['email']
        teacher.name = str(claims.get('name') or 'Guru')[:120]
        teacher.last_login = now()
        old_token = request.cookies.get(COOKIE, '')
        db.execute(delete(TeacherSession).where(TeacherSession.expires_at <= now()))
        if old_token:
            db.execute(delete(TeacherSession).where(TeacherSession.token_hash == digest(old_token)))
        token = secrets.token_urlsafe(48)
        db.add(TeacherSession(token_hash=digest(token), teacher_id=teacher.id, expires_at=now() + timedelta(hours=12)))
        record(db, teacher, 'Guru masuk melalui Google')
        db.commit()
        result = teacher_payload(teacher)
    response.set_cookie(COOKIE, token, max_age=43200, httponly=True, secure=secure_cookie(), samesite='strict', path='/')
    response.delete_cookie(CHALLENGE_COOKIE, path=CHALLENGE_PATH)
    return result


@router.get('/me')
def me(teacher=Depends(current_teacher)):
    return teacher_payload(teacher)


@router.post('/auth/logout', dependencies=[Depends(same_origin)])
def logout(request: Request, response: Response, teacher=Depends(current_teacher)):
    with Session() as db:
        db.execute(delete(TeacherSession).where(TeacherSession.token_hash == digest(request.cookies.get(COOKIE, ''))))
        record(db, teacher, 'Guru keluar dari akun')
        db.commit()
    response.delete_cookie(COOKIE, path='/')
    return {'ok': True}
