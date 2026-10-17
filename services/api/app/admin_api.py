"""Operational admin: real accounts, audit events, and draft model selection.

Model IDs are supplied by an administrator, not asserted to exist by this service.
No external inference or billing integration is performed here.
"""
import os
from typing import Literal
from uuid import uuid4

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import func, select

from .db import AdminSetting, Audit, Document, ModelProfile, Session, Teacher, User

PROVIDERS = {'openai': ('OpenAI', 'OPENAI_API_KEY'), 'deepseek': ('DeepSeek', 'DEEPSEEK_API_KEY'),
             'other': ('Penyedia lain', 'CUSTOM_LLM_API_KEY')}

SUGGESTED_MODELS = {
    'openai': [
        {'id': 'gpt-4o-mini', 'label': 'gpt-4o-mini', 'desc': 'Rekomendasi RPP (Cerdas, cepat & paling hemat)'},
        {'id': 'gpt-4o', 'label': 'gpt-4o', 'desc': 'Flagship komprehensif'},
        {'id': 'o3-mini', 'label': 'o3-mini', 'desc': 'Model penalaran terbaru'},
        {'id': 'o1-mini', 'label': 'o1-mini', 'desc': 'Model penalaran matematika & sains'},
    ],
    'deepseek': [
        {'id': 'deepseek-chat', 'label': 'deepseek-chat', 'desc': 'DeepSeek V3 (Sangat cepat & super hemat)'},
        {'id': 'deepseek-reasoner', 'label': 'deepseek-reasoner', 'desc': 'DeepSeek R1 (Penalaran bertingkat)'},
    ],
}


SUGGESTED_EMBEDDING_MODELS = {
    'openai': [
        {'id': 'text-embedding-3-small', 'label': 'text-embedding-3-small', 'dimensions': 1536, 'desc': 'Rekomendasi (1536 dim · Hemat & Cepat)'},
        {'id': 'text-embedding-3-large', 'label': 'text-embedding-3-large', 'dimensions': 3072, 'desc': 'Akurasi tinggi (3072 dim)'},
        {'id': 'text-embedding-ada-002', 'label': 'text-embedding-ada-002', 'dimensions': 1536, 'desc': 'Model generasi sebelumnya (1536 dim)'},
    ]
}


def test_embedding_connection(provider: str, model: str = ''):
    if provider == 'openai':
        key = os.getenv('OPENAI_API_KEY', '').strip()
        if not key:
            return {'status': 'no_key', 'ok': False, 'message': 'Kunci OPENAI_API_KEY belum dikonfigurasi di server (.env).'}
        try:
            test_model = model or 'text-embedding-3-small'
            payload = {'model': test_model, 'input': 'Uji coba embedding kurikulum merdeka'}
            rc = httpx.post('https://api.openai.com/v1/embeddings', json=payload,
                            headers={'Authorization': f'Bearer {key}', 'Content-Type': 'application/json'}, timeout=8.0)
            if rc.status_code == 200:
                data = rc.json()
                dim = len(data['data'][0]['embedding']) if data.get('data') else 1536
                return {'status': 'connected', 'ok': True, 'message': f'Embedding aktif! Vektor {dim} dimensi berhasil dibuat.', 'dimensions': dim}
            elif rc.status_code == 429:
                return {'status': 'quota_exhausted', 'ok': False, 'message': 'API Key valid, namun saldo kredit $0. Harap top-up di billing OpenAI.'}
            return {'status': 'warning', 'ok': False, 'message': f'Server merespons status {rc.status_code}.'}
        except Exception as e:
            return {'status': 'error', 'ok': False, 'message': f'Gagal menghubungi OpenAI Embedding: {str(e)}'}
    return {'status': 'unsupported', 'ok': False, 'message': f'Penyedia {provider} belum mendukung uji embedding otomatis.'}


def test_provider_connection(provider: str, model: str = ''):
    if provider == 'openai':
        key = os.getenv('OPENAI_API_KEY', '').strip()
        if not key:
            return {'status': 'no_key', 'ok': False, 'message': 'Kunci OPENAI_API_KEY belum dikonfigurasi di server (.env).'}
        try:
            r = httpx.get('https://api.openai.com/v1/models', headers={'Authorization': f'Bearer {key}'}, timeout=8.0)
            if r.status_code == 401:
                return {'status': 'invalid_key', 'ok': False, 'message': 'API Key OpenAI tidak valid atau salah.'}
            if r.status_code != 200:
                return {'status': 'error', 'ok': False, 'message': f'Server OpenAI merespons status {r.status_code}.'}
            test_model = model or 'gpt-4o-mini'
            payload = {'model': test_model, 'messages': [{'role': 'user', 'content': 'hi'}], 'max_tokens': 1}
            rc = httpx.post('https://api.openai.com/v1/chat/completions', json=payload,
                            headers={'Authorization': f'Bearer {key}', 'Content-Type': 'application/json'}, timeout=8.0)
            if rc.status_code == 200:
                return {'status': 'connected', 'ok': True, 'message': f'Koneksi aktif & saldo tersedia! Model {test_model} siap digunakan.'}
            elif rc.status_code == 429:
                return {'status': 'quota_exhausted', 'ok': False, 'message': f'API Key valid, namun saldo kredit $0. Harap top-up di billing OpenAI.'}
            return {'status': 'warning', 'ok': False, 'message': f'Panggilan model merespons status {rc.status_code}.'}
        except Exception as e:
            return {'status': 'error', 'ok': False, 'message': f'Gagal menghubungi server OpenAI: {str(e)}'}
    elif provider == 'deepseek':
        key = os.getenv('DEEPSEEK_API_KEY', '').strip()
        if not key:
            return {'status': 'no_key', 'ok': False, 'message': 'Kunci DEEPSEEK_API_KEY belum dikonfigurasi di server (.env).'}
        try:
            r = httpx.get('https://api.deepseek.com/models', headers={'Authorization': f'Bearer {key}'}, timeout=8.0)
            if r.status_code == 200:
                return {'status': 'connected', 'ok': True, 'message': 'Koneksi aktif ke DeepSeek API!'}
            return {'status': 'error', 'ok': False, 'message': f'DeepSeek merespons status {r.status_code}'}
        except Exception as e:
            return {'status': 'error', 'ok': False, 'message': f'Gagal menghubungi DeepSeek: {str(e)}'}
    return {'status': 'unsupported', 'ok': False, 'message': f'Penyedia {provider} belum mendukung uji otomatis.'}



class ProfileInput(BaseModel):
    model_config = ConfigDict(extra='forbid', str_strip_whitespace=True)
    provider: Literal['openai', 'deepseek', 'other']
    model: str = Field(min_length=1, max_length=150, pattern=r'^[A-Za-z0-9][A-Za-z0-9._:/-]*$')


class EmbeddingInput(BaseModel):
    model_config = ConfigDict(extra='forbid', str_strip_whitespace=True)
    provider: Literal['openai', 'other']
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
                    'teacher_accounts_available': True,
                    'teacher_count': db.scalar(select(func.count()).select_from(Teacher))}

    @router.get('/teachers')
    def teachers(q: str = Query('', max_length=150), page: int = Query(1, ge=1), limit: int = Query(25, ge=1, le=100)):
        with Session() as db:
            filters = [(Teacher.name.icontains(q, autoescape=True) | Teacher.email.icontains(q, autoescape=True))] if q else []
            total = db.scalar(select(func.count()).select_from(Teacher).where(*filters))
            rows = db.scalars(select(Teacher).where(*filters).order_by(Teacher.created_at.desc(), Teacher.id)
                              .offset((page - 1) * limit).limit(limit))
            return {'items': [{'id': t.id, 'name': t.name, 'email': t.email,
                               'created_at': t.created_at.isoformat(), 'last_login': t.last_login.isoformat()}
                              for t in rows], 'total': total, 'page': page, 'limit': limit}

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
                                .offset((page - 1) * limit).limit(limit)).all()
            teacher_ids = set(db.scalars(select(Teacher.id).where(Teacher.id.in_([e.actor_id for e in events if e.actor_id]))))
            return {'items': [{'id': e.id, 'actor': e.actor_name, 'actor_id': e.actor_id,
                               'actor_kind': 'teacher' if e.actor_id in teacher_ids else 'internal' if e.actor_id else 'unknown',
                               'action': e.action, 'at': e.created_at.isoformat(), 'document_id': e.document_id}
                              for e in events], 'total': total, 'page': page, 'limit': limit,
                    'generation_history_available': False}

    @router.get('/models')
    def models():
        with Session() as db:
            default = db.get(AdminSetting, 'default_model')
            embed_model = db.get(AdminSetting, 'default_embedding_model')
            embed_prov = db.get(AdminSetting, 'default_embedding_provider')
            embedding_info = {
                'provider': embed_prov.value if embed_prov and embed_prov.value else 'openai',
                'model': embed_model.value if embed_model and embed_model.value else 'text-embedding-3-small',
                'suggested': SUGGESTED_EMBEDDING_MODELS,
            }
            return {'items': [{'id': p.id, 'provider': p.provider, 'model': p.model,
                               'updated_at': p.updated_at.isoformat(), 'connection_status': 'not_tested'}
                              for p in db.scalars(select(ModelProfile).order_by(ModelProfile.updated_at.desc()))],
                    'default_id': default.value if default else None, 'generation_available': False,
                    'suggested_models': SUGGESTED_MODELS,
                    'embedding': embedding_info,
                    'providers': [{'id': key, 'label': label, 'credential_configured': bool(os.getenv(env))}
                                  for key, (label, env) in PROVIDERS.items()]}

    @router.put('/embedding/default')
    def set_default_embedding(body: EmbeddingInput, user=Depends(admin)):
        with Session() as db:
            setting_model = db.get(AdminSetting, 'default_embedding_model')
            if not setting_model:
                setting_model = AdminSetting(key='default_embedding_model', value=body.model)
                db.add(setting_model)
            else:
                setting_model.value = body.model

            setting_prov = db.get(AdminSetting, 'default_embedding_provider')
            if not setting_prov:
                setting_prov = AdminSetting(key='default_embedding_provider', value=body.provider)
                db.add(setting_prov)
            else:
                setting_prov.value = body.provider

            audit(db, user, f'Memilih default embedding: {body.provider} / {body.model}')
            db.commit()
            return {'provider': body.provider, 'model': body.model}

    @router.post('/embedding/test')
    def test_embedding(body: EmbeddingInput, user=Depends(admin)):
        res = test_embedding_connection(body.provider, body.model)
        with Session() as db:
            audit(db, user, f'Uji koneksi embedding {body.provider}/{body.model}: {res["status"]}')
            db.commit()
        return res

    @router.post('/models/{profile_id}/test')
    def test_model(profile_id: str, user=Depends(admin)):
        with Session() as db:
            p = db.get(ModelProfile, profile_id)
            if not p:
                raise HTTPException(404, 'Profil model tidak ditemukan.')
            result = test_provider_connection(p.provider, p.model)
            audit(db, user, f'Uji koneksi LLM {p.provider}/{p.model}: {result["status"]}')
            db.commit()
            return result



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
