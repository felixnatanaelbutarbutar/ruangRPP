"""Explicit, bounded OpenAI-compatible adapters. No automatic paid retries."""
import math
import os
from urllib.parse import urlparse
import httpx
from fastapi import HTTPException
from .db import AdminSetting, ModelProfile


def setting(db, key, default=''):
    row = db.get(AdminSetting, key)
    return row.value if row and row.value else default


def endpoint(provider, embedding=False):
    if provider == 'openai':
        return 'https://api.openai.com/v1', os.getenv('OPENAI_API_KEY', '')
    if provider == 'deepseek' and not embedding:
        return 'https://api.deepseek.com', os.getenv('DEEPSEEK_API_KEY', '')
    if provider == 'other':
        prefix = 'CUSTOM_EMBEDDING' if embedding else 'CUSTOM_LLM'
        base = os.getenv(prefix + '_BASE_URL', '').rstrip('/')
        parsed = urlparse(base)
        if parsed.scheme != 'https' or not parsed.hostname or parsed.username or parsed.password or parsed.query or parsed.fragment:
            raise HTTPException(503, f'{prefix}_BASE_URL harus berupa endpoint HTTPS tanpa kredensial.')
        return base, os.getenv(prefix + '_API_KEY', '')
    raise HTTPException(503, 'Penyedia belum didukung oleh adapter ini.')


def embedding_config(db):
    provider = setting(db, 'default_embedding_provider', 'openai')
    base, _ = endpoint(provider, True)
    return {'provider': provider, 'model': setting(db, 'default_embedding_model', 'text-embedding-3-small'), 'base_url': base}


def model_config(db):
    profile = db.get(ModelProfile, setting(db, 'default_model'))
    if not profile:
        raise HTTPException(503, 'Pilih model default di menu Model LLM terlebih dahulu.')
    base, key = endpoint(profile.provider)
    if not key:
        raise HTTPException(503, 'Kunci penyedia model belum diisi di server.')
    return {'provider': profile.provider, 'model': profile.model, 'base_url': base}


def call(config, path, payload, embedding=False):
    base, key = endpoint(config['provider'], embedding)
    if base != config['base_url']:
        raise HTTPException(409, 'Endpoint penyedia berubah. Siapkan ulang indeks atau permintaan.')
    if not key:
        raise HTTPException(503, 'Kunci API penyedia belum dikonfigurasi.')
    try:
        response = httpx.post(base + path, headers={'Authorization': f'Bearer {key}'},
                              json=payload, timeout=90 if not embedding else 45, follow_redirects=False)
        if response.status_code >= 400:
            message = 'Periksa saldo, batas pemakaian, dan akses model.' if response.status_code == 429 else 'Periksa kunci, ID model, dan dukungan format API.'
            raise HTTPException(502, f'Penyedia AI merespons HTTP {response.status_code}. {message}')
        data = response.json()
        if not isinstance(data, dict):
            raise ValueError()
        return data
    except (httpx.HTTPError, ValueError):
        raise HTTPException(502, 'Penyedia AI tidak merespons dengan benar. Tidak ada percobaan berbayar otomatis.')


def embed(config, texts):
    data = call(config, '/embeddings', {'model': config['model'], 'input': texts, 'encoding_format': 'float'}, True)
    try:
        rows = sorted(data['data'], key=lambda row: row['index'])
        if [row['index'] for row in rows] != list(range(len(texts))):
            raise ValueError()
        vectors = [row['embedding'] for row in rows]
        dimension = len(vectors[0])
        if not 1 <= dimension <= 8192 or any(len(v) != dimension or any(not isinstance(x, (int, float)) or not math.isfinite(x) for x in v) for v in vectors):
            raise ValueError()
        return vectors
    except (KeyError, TypeError, ValueError, IndexError):
        raise HTTPException(502, 'Respons embedding tidak valid atau dimensi tidak konsisten.')


def complete(config, messages):
    payload = {'model': config['model'], 'messages': messages, 'response_format': {'type': 'json_object'}}
    payload['max_completion_tokens' if config['provider'] == 'openai' else 'max_tokens'] = 5000
    data = call(config, '/chat/completions', payload)
    try:
        choice = data['choices'][0]
        if choice.get('finish_reason') != 'stop' or not isinstance(choice['message'].get('content'), str):
            raise ValueError()
        return choice['message']['content'], data.get('usage', {})
    except (KeyError, TypeError, IndexError, ValueError):
        raise HTTPException(502, 'Draf tidak selesai atau model menolak permintaan. Kuota aplikasi tidak dipotong.')
