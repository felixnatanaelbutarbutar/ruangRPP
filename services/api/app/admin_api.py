"""Operational admin: real accounts, audit events, and draft model selection.

Model IDs are supplied by an administrator, not asserted to exist by this service.
No external inference or billing integration is performed here.
"""
import os
from typing import Literal
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import func, select

from .db import AdminSetting, Audit, Document, ModelProfile, Session, User

PROVIDERS = {'openai': ('OpenAI', 'OPENAI_API_KEY'), 'deepseek': ('DeepSeek', 'DEEPSEEK_API_KEY'),
             'other': ('Penyedia lain', 'CUSTOM_LLM_API_KEY')}


class ProfileInput(BaseModel):
    model_config = ConfigDict(extra='forbid', str_strip_whitespace=True)
    provider: Literal['openai', 'deepseek', 'other']
    model: str = Field(min_length=1, max_length=150, pattern=r'^[A-Za-z0-9][A-Za-z0-9._:/-]*$')


def build_admin_router(admin, audit):
    router = APIRouter(prefix='/api/v1/admin', dependencies=[Depends(admin)])

    @router.get('/users')
    def users():
        with Session() as db:
            uploads = dict(db.execute(select(Document.uploaded_by, func.count()).group_by(Document.uploaded_by)).all())
            logins = dict(db.execute(select(Audit.actor_id, func.max(Audit.created_at))
                .where(Audit.action == 'Masuk ke dashboard', Audit.actor_id.is_not(None)).group_by(Audit.actor_id)).all())
            return {'items': [{'id': u.id, 'name': u.name, 'email': u.email, 'role': u.role,
                               'uploads': uploads.get(u.id, 0),
                               'last_login': logins[u.id].isoformat() if logins.get(u.id) else None}
                              for u in db.scalars(select(User).order_by(User.name, User.id))],
                    'teacher_accounts_available': False}

    @router.get('/activity')
    def activity(q: str = Query('', max_length=150), actor_id: str = Query('', max_length=36),
                 page: int = Query(1, ge=1), limit: int = Query(25, ge=1, le=100)):
        with Session() as db:
            filters = []
            if q.strip():
                filters.append(Audit.action.icontains(q.strip(), autoescape=True))
            if actor_id:
                filters.append(Audit.actor_id == actor_id)
            total = db.scalar(select(func.count()).select_from(Audit).where(*filters))
            events = db.scalars(select(Audit).where(*filters).order_by(Audit.created_at.desc(), Audit.id.desc())
                                .offset((page - 1) * limit).limit(limit))
            return {'items': [{'id': e.id, 'actor': e.actor_name, 'actor_id': e.actor_id,
                               'action': e.action, 'at': e.created_at.isoformat(), 'document_id': e.document_id}
                              for e in events], 'total': total, 'page': page, 'limit': limit,
                    'generation_history_available': False}

    @router.get('/finance')
    def finance():
        return {'status': 'not_connected', 'currency': 'IDR', 'revenue': None,
                'transactions': [], 'llm_cost': None}

    @router.get('/models')
    def models():
        with Session() as db:
            default = db.get(AdminSetting, 'default_model')
            return {'items': [{'id': p.id, 'provider': p.provider, 'model': p.model,
                               'updated_at': p.updated_at.isoformat(), 'connection_status': 'not_tested'}
                              for p in db.scalars(select(ModelProfile).order_by(ModelProfile.updated_at.desc()))],
                    'default_id': default.value if default else None, 'generation_available': False,
                    'providers': [{'id': key, 'label': label, 'credential_configured': bool(os.getenv(env))}
                                  for key, (label, env) in PROVIDERS.items()]}

    @router.post('/models', status_code=201)
    def add_model(body: ProfileInput, user=Depends(admin)):
        with Session() as db:
            # One fixed settings row serializes all model mutations, including deletion.
            lock_models(db)
            if db.scalar(select(ModelProfile).where(ModelProfile.provider == body.provider, ModelProfile.model == body.model)):
                raise HTTPException(409, 'Profil penyedia dan model ini sudah ada.')
            p = ModelProfile(id=str(uuid4()), provider=body.provider, model=body.model)
            db.add(p)
            audit(db, user, f'Menambahkan profil LLM: {body.provider} / {body.model}')
            db.commit()
            return {'id': p.id}

    def lock_models(db):
        # Seeded at initialization; also create lazily using a conflict-safe insert.
        from sqlalchemy import text
        db.execute(text("INSERT INTO admin_settings (key, value) VALUES ('default_model', '') ON CONFLICT (key) DO NOTHING"))
        return db.scalar(select(AdminSetting).where(AdminSetting.key == 'default_model').with_for_update())

    @router.put('/models/{profile_id}/default')
    def choose_model(profile_id: str, user=Depends(admin)):
        with Session() as db:
            setting = lock_models(db)
            p = db.get(ModelProfile, profile_id)
            if not p:
                raise HTTPException(404, 'Profil model tidak ditemukan.')
            setting.value = p.id
            audit(db, user, f'Memilih default LLM: {p.provider} / {p.model}')
            db.commit()
            return {'default_id': p.id, 'generation_available': False}

    @router.delete('/models/{profile_id}')
    def remove_model(profile_id: str, user=Depends(admin)):
        with Session() as db:
            setting = lock_models(db)
            p = db.get(ModelProfile, profile_id)
            if not p:
                raise HTTPException(404, 'Profil model tidak ditemukan.')
            if setting.value == p.id:
                raise HTTPException(409, 'Pilih default lain sebelum menghapus profil ini.')
            audit(db, user, f'Menghapus profil LLM: {p.provider} / {p.model}')
            db.delete(p)
            db.commit()
            return {'ok': True}

    return router
