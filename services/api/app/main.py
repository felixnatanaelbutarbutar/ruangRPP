import csv
import hashlib
import io
import json
import os
import secrets
import threading
import time
from collections import defaultdict, deque
from datetime import timedelta, timezone
from pathlib import Path
from uuid import NAMESPACE_URL, uuid4, uuid5

from fastapi import Depends, FastAPI, File, Form, HTTPException, Request, Response, UploadFile
from fastapi.responses import FileResponse, JSONResponse
from pwdlib import PasswordHash
from sqlalchemy import delete, select, text, update
from sqlalchemy.exc import IntegrityError

from .db import Audit, Document, LoginSession, ProcessingJob, Requirement, Session, STORAGE, User, engine, now
from .domain import automatic_checks, matches, pipeline
from .schemas import CATEGORIES, SUBJECTS, Login, Metadata, MetadataUpdate, RequirementInput, Review
from .worker import queue

app = FastAPI(title='RuangRPP Admin', version='0.1.0', docs_url=None, redoc_url=None, openapi_url=None)
MAX_BYTES = 128 * 1024 * 1024
COOKIE = 'rr_session'
ORIGINS = set(os.getenv('ALLOWED_ORIGINS', 'http://localhost:3000,http://127.0.0.1:3000').split(','))
hasher = PasswordHash.recommended()
DUMMY_HASH = hasher.hash(secrets.token_urlsafe(32))
attempts = defaultdict(deque)
login_lock = threading.Lock()


@app.middleware('http')
async def guards(request: Request, call_next):
    if request.method not in ('GET', 'HEAD', 'OPTIONS'):
        origin = request.headers.get('origin')
        if origin and origin not in ORIGINS:
            return JSONResponse({'detail': 'Origin tidak diizinkan.'}, status_code=403)
        length = request.headers.get('content-length')
        if length and (not length.isdigit() or int(length) > MAX_BYTES + 1024 * 1024):
            return JSONResponse({'detail': 'Berkas maksimal 128 MiB.'}, status_code=413)
    response = await call_next(request)
    response.headers['Cache-Control'] = 'no-store'
    response.headers['X-Content-Type-Options'] = 'nosniff'
    return response


def current_user(request: Request):
    token = request.cookies.get(COOKIE, '')
    if not token:
        raise HTTPException(401, 'Silakan masuk terlebih dahulu.')
    digest = hashlib.sha256(token.encode()).hexdigest()
    with Session() as db:
        session = db.get(LoginSession, digest)
        if not session or session.expires_at.replace(tzinfo=timezone.utc) <= now():
            raise HTTPException(401, 'Sesi berakhir. Silakan masuk kembali.')
        user = db.get(User, session.user_id)
        if not user:
            raise HTTPException(401, 'Akun tidak tersedia.')
        return user


def admin(user=Depends(current_user)):
    if user.role != 'admin':
        raise HTTPException(403, 'Tindakan ini memerlukan peninjau admin.')
    return user


def audit(db, user, action, document_id=None):
    db.add(Audit(id=str(uuid4()), actor_name=user.name, actor_id=user.id, action=action, document_id=document_id))


from .admin_api import build_admin_router
app.include_router(build_admin_router(admin, audit))


def payload(d, detail=False):
    value = {'id': d.id, 'filename': d.filename, 'size_bytes': d.size_bytes, 'metadata': d.metadata_json,
             'auto_status': d.auto_status, 'auto_issues': d.auto_issues, 'review': d.review,
             'revision': d.revision, 'uploaded_by': d.uploader_name, 'created_at': d.created_at.isoformat(),
             'pipeline': pipeline(d), 'vector_status': 'not_indexed',
             'extraction': {k: v for k, v in d.extraction.items() if k != 'sections'}}
    if detail:
        value['extraction'] = d.extraction
        value['sha256'] = d.sha256
    with Session() as db:
        job = db.get(ProcessingJob, d.id)
        value['processing_status'] = job.status if job else 'completed'
    return value


def find_document(db, document_id):
    d = db.get(Document, document_id)
    if not d:
        raise HTTPException(404, 'Dokumen tidak ditemukan.')
    return d


@app.get('/health/live')
def live():
    return {'status': 'ok'}


@app.get('/health/ready')
def ready():
    try:
        with engine.connect() as connection:
            connection.execute(text('SELECT id FROM source_documents LIMIT 1'))
        return {'status': 'ready'}
    except Exception:
        return JSONResponse({'status': 'not_ready', 'message': 'Database atau skema belum siap.'}, status_code=503)


@app.post('/api/v1/auth/login')
def login(body: Login, response: Response):
    email = body.email.lower()
    stamp = time.monotonic()
    with login_lock:
        window = attempts[email]
        while window and stamp - window[0] > 300:
            window.popleft()
        if len(window) >= 10:
            raise HTTPException(429, 'Terlalu banyak percobaan. Tunggu 5 menit.')
        window.append(stamp)
    with Session() as db:
        user = db.scalar(select(User).where(User.email == email))
        correct = hasher.verify(body.password, user.password_hash if user else DUMMY_HASH)
        if not user or not correct:
            raise HTTPException(401, 'Email atau kata sandi tidak sesuai.')
        token = secrets.token_urlsafe(48)
        db.execute(delete(LoginSession).where(LoginSession.expires_at < now()))
        db.add(LoginSession(token_hash=hashlib.sha256(token.encode()).hexdigest(), user_id=user.id, expires_at=now() + timedelta(hours=12)))
        audit(db, user, 'Masuk ke dashboard')
        db.commit()
        response.set_cookie(COOKIE, token, httponly=True, samesite='strict', secure=os.getenv('COOKIE_SECURE') == '1', max_age=43200, path='/')
        return {'id': user.id, 'name': user.name, 'role': user.role}


@app.post('/api/v1/auth/logout')
def logout(request: Request, response: Response, user=Depends(current_user)):
    with Session() as db:
        audit(db, user, 'Keluar dari dashboard')
        db.execute(delete(LoginSession).where(LoginSession.token_hash == hashlib.sha256(request.cookies.get(COOKIE, '').encode()).hexdigest()))
        db.commit()
    response.delete_cookie(COOKIE, path='/')
    return {'ok': True}


@app.get('/api/v1/me')
def me(user=Depends(current_user)):
    return {'id': user.id, 'name': user.name, 'role': user.role}


@app.get('/api/v1/catalog')
def catalog(user=Depends(current_user)):
    return {'categories': CATEGORIES, 'subjects': SUBJECTS, 'phases': ['A', 'B', 'C', 'Umum'], 'indexing_available': False, 'max_upload_mib': 128}


@app.get('/api/v1/documents')
def documents(user=Depends(current_user)):
    with Session() as db:
        docs = db.scalars(select(Document).order_by(Document.created_at.desc())).all()
        return {'items': [payload(d) for d in docs]}


@app.post('/api/v1/documents', status_code=201)
def upload(metadata: str = Form(...), file: UploadFile = File(...), user=Depends(current_user)):
    try:
        m = Metadata.model_validate_json(metadata).model_dump()
    except ValueError:
        raise HTTPException(422, 'Metadata tidak valid. Periksa kategori, cakupan, URL, dan tahun.')
    original = (file.filename or '').replace('\\', '/').split('/')[-1][:255]
    extension = Path(original).suffix.lower()
    if extension not in ('.pdf', '.docx'):
        raise HTTPException(415, 'Format yang diterima: PDF atau DOCX.')
    if extension != '.pdf' and any(s['page_ranges'] for s in m['scopes']):
        raise HTTPException(422, 'Rentang halaman hanya berlaku untuk PDF. DOCX memakai lokasi paragraf/tabel.')
    STORAGE.mkdir(parents=True, exist_ok=True)
    doc_id = str(uuid4())
    path = STORAGE / f'{doc_id}{extension}'
    digest = hashlib.sha256()
    size = 0
    try:
        with path.open('xb') as out:
            while block := file.file.read(1024 * 1024):
                size += len(block)
                if size > MAX_BYTES:
                    raise HTTPException(413, 'Berkas maksimal 128 MiB.')
                digest.update(block)
                out.write(block)
        with path.open('rb') as source:
            signature = source.read(8)
        if size == 0 or (extension == '.pdf' and not signature.startswith(b'%PDF-')) or (extension == '.docx' and not signature.startswith(b'PK')):
            raise HTTPException(415, 'Isi berkas tidak sesuai dengan formatnya.')
        with Session() as db:
            duplicate = db.scalar(select(Document).where(Document.sha256 == digest.hexdigest()))
            if duplicate:
                raise HTTPException(409, {'message': 'File yang sama sudah diunggah.', 'document_id': duplicate.id})
        extraction = {'status': 'queued', 'characters': 0, 'sections': [], 'message': 'Menunggu pemrosesan di latar belakang.'}
        auto_status, issues = automatic_checks(m, extraction)
        with Session() as db:
            document = Document(id=doc_id, sha256=digest.hexdigest(), filename=original, extension=extension,
                                size_bytes=size, metadata_json=m, extraction=extraction, auto_status=auto_status,
                                auto_issues=issues, review={}, uploaded_by=user.id, uploader_name=user.name)
            db.add(document)
            queue(db, document)
            audit(db, user, 'Unggah asli; ekstraksi masuk antrean', doc_id)
            try:
                db.commit()
            except IntegrityError:
                db.rollback()
                raise HTTPException(409, 'File identik sudah masuk melalui unggahan lain.')
            return payload(document, True)
    except Exception:
        path.unlink(missing_ok=True)
        raise
    finally:
        file.file.close()


@app.get('/api/v1/documents/{document_id}')
def detail(document_id: str, user=Depends(current_user)):
    with Session() as db:
        d = find_document(db, document_id)
        data = payload(d, True)
        data['history'] = [{'action': a.action, 'actor': a.actor_name, 'at': a.created_at.isoformat()} for a in db.scalars(select(Audit).where(Audit.document_id == d.id).order_by(Audit.created_at.desc())).all()]
        return data


@app.get('/api/v1/documents/{document_id}/file')
def original(document_id: str, user=Depends(current_user)):
    with Session() as db:
        d = find_document(db, document_id)
        path = STORAGE / f'{d.id}{d.extension}'
        if not path.is_file():
            raise HTTPException(404, 'File asli tidak tersedia. Hubungi pengelola.')
        return FileResponse(path, filename=d.filename, media_type='application/octet-stream')


@app.patch('/api/v1/documents/{document_id}')
def edit(document_id: str, body: MetadataUpdate, user=Depends(current_user)):
    with Session() as db:
        db.scalar(select(ProcessingJob).where(ProcessingJob.document_id == document_id).with_for_update())
        d = find_document(db, document_id)
        m = body.metadata.model_dump()
        if d.extension != '.pdf' and any(s['page_ranges'] for s in m['scopes']):
            raise HTTPException(422, 'Rentang halaman hanya berlaku untuk PDF.')
        status, issues = automatic_checks(m, d.extraction)
        result = db.execute(update(Document).where(Document.id == document_id, Document.revision == body.expected_revision).values(
            metadata_json=m, auto_status=status, auto_issues=issues, review={}, revision=body.expected_revision + 1))
        if result.rowcount != 1:
            raise HTTPException(409, 'Dokumen berubah di sesi lain. Muat ulang sebelum menyimpan.')
        db.expire_all()
        queue(db, find_document(db, document_id))
        audit(db, user, 'Metadata diubah; persetujuan sebelumnya perlu ditinjau ulang', document_id)
        db.commit()
        db.expire_all()
        return payload(find_document(db, document_id), True)


@app.post('/api/v1/documents/{document_id}/process', status_code=202)
def reprocess(document_id: str, user=Depends(current_user)):
    with Session() as db:
        job = db.scalar(select(ProcessingJob).where(ProcessingJob.document_id == document_id).with_for_update())
        document = find_document(db, document_id)
        if job and job.status in ('queued', 'running'):
            raise HTTPException(409, 'Dokumen masih berada dalam antrean pemrosesan.')
        document.revision += 1
        document.review = {}
        queue(db, document)
        audit(db, user, 'Proses ulang; persetujuan perlu ditinjau kembali', document_id)
        db.commit()
        return payload(document, True)


@app.post('/api/v1/documents/{document_id}/review')
def review(document_id: str, body: Review, user=Depends(admin)):
    with Session() as db:
        job = db.scalar(select(ProcessingJob).where(ProcessingJob.document_id == document_id).with_for_update())
        if job and job.status in ('queued', 'running'):
            raise HTTPException(409, 'Tunggu pemrosesan selesai sebelum menyimpan tinjauan.')
        d = find_document(db, document_id)
        if body.extraction == 'approved' and d.extraction.get('status') != 'readable':
            raise HTTPException(409, 'Teks belum terbaca dengan baik; kualitas ekstraksi belum dapat disetujui.')
        r = body.model_dump(exclude={'expected_revision'}) | {'reviewer': user.name, 'reviewed_at': now().isoformat()}
        result = db.execute(update(Document).where(Document.id == document_id, Document.revision == body.expected_revision).values(review=r, revision=body.expected_revision + 1))
        if result.rowcount != 1:
            raise HTTPException(409, 'Versi dokumen berubah. Muat ulang sebelum meninjau.')
        audit(db, user, f'Tinjauan: isi {body.content}, izin {body.rights}, ekstraksi {body.extraction}', document_id)
        db.commit()
        db.expire_all()
        return payload(find_document(db, document_id), True)


@app.get('/api/v1/requirements')
def requirements(user=Depends(current_user)):
    with Session() as db:
        docs = db.scalars(select(Document)).all()
        items = []
        for r in db.scalars(select(Requirement).order_by(Requirement.label)).all():
            matching = [d for d in docs if matches(d, r.criteria)]
            reviewed = [d for d in matching if pipeline(d) == 'eligible_for_indexing']
            minimum = r.criteria['minimum']
            state = 'not_applicable' if r.applicability == 'not_applicable' else 'missing' if not matching else 'complete' if len(reviewed) >= minimum and r.applicability == 'applicable' else 'review'
            items.append({'id': r.id, 'label': r.label, 'criteria': r.criteria, 'note': r.note, 'applicability': r.applicability,
                          'uploaded': len(matching), 'reviewed': len(reviewed), 'state': state, 'document_ids': [d.id for d in matching]})
        return {'items': items}


@app.post('/api/v1/requirements', status_code=201)
def add_requirement(body: RequirementInput, user=Depends(admin)):
    with Session() as db:
        value = Requirement(id=str(uuid4()), label=body.label, criteria=body.model_dump(exclude={'label', 'note', 'applicability'}), note=body.note, applicability=body.applicability, created_by=user.id)
        db.add(value)
        audit(db, user, f'Tambah kebutuhan: {body.label}')
        db.commit()
        return {'id': value.id}


@app.put('/api/v1/requirements/{requirement_id}')
def edit_requirement(requirement_id: str, body: RequirementInput, user=Depends(admin)):
    with Session() as db:
        r = db.get(Requirement, requirement_id)
        if not r:
            raise HTTPException(404, 'Kebutuhan tidak ditemukan.')
        r.label, r.note, r.applicability = body.label, body.note, body.applicability
        r.criteria = body.model_dump(exclude={'label', 'note', 'applicability'})
        audit(db, user, f'Ubah kebutuhan: {body.label}')
        db.commit()
        return {'id': r.id}


@app.post('/api/v1/requirements/template')
def seed_requirements(user=Depends(admin)):
    # Collection candidates, not a claim that every subject applies in every phase.
    added = 0
    with Session() as db:
        for subject in SUBJECTS[:10]:
            for phase in ['A', 'B', 'C']:
                for category in ['CP', 'Modul_Ajar']:
                    key = str(uuid5(NAMESPACE_URL, f'ruangrpp:requirements:v1:{subject}:{phase}:{category}'))
                    if db.get(Requirement, key):
                        continue
                    value = RequirementInput(
                        label=f'{CATEGORIES[category]} · {subject} · Fase {phase}',
                        category=category, scope={'subject': subject, 'phase': phase},
                        note='Calon kebutuhan. Konfirmasi penerapan dan acuan; isi varian agama/seni/bahasa serta wilayah bila relevan. Bukan pernyataan cakupan kurikulum resmi.',
                    )
                    db.add(Requirement(id=key, label=value.label,
                        criteria=value.model_dump(exclude={'label', 'note', 'applicability'}),
                        note=value.note, applicability='unconfirmed', created_by=user.id))
                    added += 1
        audit(db, user, f'Buat daftar calon kebutuhan: {added} ditambahkan')
        try:
            db.commit()
        except IntegrityError:
            db.rollback()
            raise HTTPException(409, 'Daftar sedang dibuat oleh sesi lain. Muat ulang lalu coba lagi.')
    return {'added': added}


@app.post('/api/v1/requirements/guides-sd')
def seed_guides(user=Depends(admin)):
    targets = json.loads(Path(__file__).with_name('guide_targets.json').read_text(encoding='utf-8'))
    added = 0
    with Session() as db:
        for target in targets:
            key = str(uuid5(NAMESPACE_URL, 'ruangrpp:guides:v1:' + target['id']))
            if db.get(Requirement, key):
                continue
            phases = [p for p in target['original_phases'] if p in ('A', 'B', 'C')]
            value = RequirementInput(label=target['title'], category='Panduan_Mapel',
                scope={'subject': target['subject'], 'variant': target['variant'], 'phase': phases[0]},
                required_phases=phases, original_phases=target['original_phases'],
                source_url=target['source_url'], note=target['note'])
            db.add(Requirement(id=key, label=value.label,
                criteria=value.model_dump(exclude={'label', 'note', 'applicability'}),
                note=value.note, applicability='unconfirmed', created_by=user.id))
            added += 1
        audit(db, user, f'Daftar 20 panduan mapel SD: {added} target ditambahkan; belum ada persetujuan sumber')
        try:
            db.commit()
        except IntegrityError:
            db.rollback()
            raise HTTPException(409, 'Daftar sedang dibuat sesi lain. Muat ulang.')
    return {'added': added}


@app.get('/api/v1/inventory.csv')
def inventory(user=Depends(current_user)):
    stream = io.StringIO()
    writer = csv.writer(stream)
    writer.writerow(['ID', 'Judul', 'Kategori', 'Cakupan SD dan halaman PDF', 'Tahun terbit', 'Penerbit', 'URL', 'File asli', 'SHA256', 'Otomatis', 'Isi', 'Izin', 'Vektor', 'Pengumpul', 'Jenjang asli', 'Fase asli', 'Ekstraksi'])
    def safe(value):
        s = str(value or '')
        return "'" + s if s.lstrip().startswith(('=', '+', '-', '@')) else s
    with Session() as db:
        for d in db.scalars(select(Document)).all():
            m = d.metadata_json
            writer.writerow([safe(v) for v in [d.id, m['title'], m['category'], json.dumps(m['scopes'], ensure_ascii=False), m['year'], m['publisher'], m['source_url'], d.filename, d.sha256, d.auto_status, d.review.get('content', 'unreviewed'), d.review.get('rights', 'unreviewed'), 'not_indexed', d.uploader_name, m.get('original_level', ''), ', '.join(m.get('original_phases', [])), d.extraction.get('status', '')]])
    return Response('\ufeff' + stream.getvalue(), media_type='text/csv; charset=utf-8', headers={'Content-Disposition': 'attachment; filename="Inventaris_RuangRPP.csv"'})
