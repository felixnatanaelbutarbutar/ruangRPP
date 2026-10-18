"""Page-aware chunks, revision-gated Qdrant retrieval, and a durable indexing queue."""
import hashlib
import json
import os
import re
from datetime import timedelta
from uuid import uuid4

import httpx
from fastapi import HTTPException
from sqlalchemy import delete, select
from .ai_client import embed, embedding_config
from .db import Audit, Document, RagChunk, RagIndex, Session, now
from .domain import pipeline

ROLES = ('CP', 'Panduan', 'Modul_Ajar', 'Template', 'Checklist')
CHUNK_CHARS = 2200


def qdrant(method, path, body=None, missing_ok=False):
    try:
        response = httpx.request(method, os.getenv('QDRANT_URL', 'http://qdrant:6333').rstrip('/') + path,
            headers={'api-key': os.getenv('QDRANT_API_KEY', '')}, json=body, timeout=30, follow_redirects=False)
        if response.status_code == 404 and missing_ok:
            return None
        if not response.is_success:
            raise HTTPException(503, f'Qdrant merespons HTTP {response.status_code}. Periksa layanan indeks.')
        return response.json()['result']
    except (httpx.HTTPError, ValueError, KeyError):
        raise HTTPException(503, 'Qdrant belum dapat dihubungi. File sumber tetap tersimpan.')


def log(db, doc_id, message, actor=None):
    db.add(Audit(id=str(uuid4()), document_id=doc_id, actor_id=actor.id if actor else None,
                 actor_name=actor.name if actor else 'Sistem RAG', action=message[:200]))


def split_text(text):
    # Keep page/paragraph boundaries; prefer line/sentence endings over arbitrary cuts.
    text = re.sub(r'[ \t]+', ' ', text.replace('\x00', '')).strip()
    while text:
        end = min(len(text), CHUNK_CHARS)
        if end < len(text):
            boundary = max(text.rfind('\n', 0, end), text.rfind('. ', 0, end))
            if boundary > CHUNK_CHARS // 2:
                end = boundary + 1
        yield text[:end].strip()
        text = text[end:].lstrip()


def chunk_document(document):
    if pipeline(document) != 'eligible_for_indexing':
        raise HTTPException(409, 'Selesaikan tinjauan isi, izin, ekstraksi, dan izin pemrosesan eksternal dahulu.')
    meta = document.metadata_json
    scopes = meta['scopes']
    if len(scopes) > 1 and (document.extension != '.pdf' or any(not s.get('page_ranges') for s in scopes)):
        raise HTTPException(409, 'Dokumen multi-cakupan memerlukan batas halaman PDF tiap bagian. Untuk DOCX, gunakan satu cakupan yang telah diperiksa.')
    chunks, seen = [], set()
    for section in document.extraction.get('sections', []):
        for scope in scopes:
            ranges = scope.get('page_ranges', [])
            if ranges and not any(r['start'] <= section.get('page', 0) <= r['end'] for r in ranges):
                continue
            # One explicit scope per chunk prevents a mapel × phase cross-product leak.
            for part, content in enumerate(split_text(section['text']), 1):
                if len(content) < 25:
                    continue
                signature = (content, json.dumps(scope, sort_keys=True))
                if signature in seen:
                    continue
                seen.add(signature)
                chunks.append({'text': content, 'locator': section['locator'], 'part': part,
                    'scope': scope, 'category': meta['category'], 'curriculum': meta['curriculum'],
                    'document_id': document.id, 'revision': document.revision,
                    'title': meta['title'], 'source_url': meta.get('source_url', '')})
                if len(chunks) > 2000:
                    raise HTTPException(409, 'Lebih dari 2.000 potongan. Pilih bagian yang diperlukan pilot dahulu.')
    if not chunks:
        raise HTTPException(409, 'Tidak ada teks relevan pada rentang pilihan. Periksa ekstraksi dan halaman.')
    return chunks


def valid_index(index, document, states=('active',)):
    return bool(index and document and index.status in states and index.revision == document.revision
                and pipeline(document) == 'eligible_for_indexing')


def active_rows(db, config=None, states=('active',)):
    pairs = db.execute(select(RagIndex, Document).join(Document, Document.id == RagIndex.document_id)
                       .where(RagIndex.status.in_(states))).all()
    return [(i, d) for i, d in pairs if valid_index(i, d, states) and (config is None or i.embedding == config)]


def matches_scope(content, target, grade=None):
    s = content['scope']
    if content['curriculum'] != target['curriculum']:
        return False
    exact = all(s.get(k, '') == target.get(k, '') for k in ('subject', 'phase', 'variant', 'region'))
    general = (content['category'] in ('Panduan', 'Template', 'Checklist')
               and s['subject'] == 'Lintas mapel' and s['phase'] == 'Umum'
               and not s.get('variant') and not s.get('region'))
    return (exact or general) and (grade is None or not s.get('grades') or grade in s['grades'])


def scope_key(scope):
    return hashlib.sha256(json.dumps(scope, sort_keys=True).encode()).hexdigest()[:24]


def support_catalog(db):
    config = embedding_config(db)
    ids = [i.id for i, _ in active_rows(db, config)]
    chunks = db.scalars(select(RagChunk).where(RagChunk.index_id.in_(ids))).all() if ids else []
    candidates = {}
    for chunk in chunks:
        c, s = chunk.content, chunk.content['scope']
        if c['category'] != 'CP' or s['phase'] not in ('A', 'B', 'C') or s['subject'] == 'Lintas mapel':
            continue
        target = {k: s.get(k, '') for k in ('subject', 'phase', 'variant', 'region')}
        target['curriculum'] = c['curriculum']
        phase_grades = {'A': [1, 2], 'B': [3, 4], 'C': [5, 6]}[s['phase']]
        for grade in (s['grades'] or phase_grades):
            if grade not in phase_grades:
                continue
            item = dict(target, grade=grade)
            roles = {x.content['category'] for x in chunks if matches_scope(x.content, target, grade)}
            candidates[scope_key(item)] = {'id': scope_key(item), **item,
                'ready': all(r in roles for r in ROLES), 'missing': [r for r in ROLES if r not in roles]}
    return list(candidates.values())


def retrieve(db, target, query):
    config = embedding_config(db)
    pairs = active_rows(db, config)
    allowed = {i.id: i for i, _ in pairs}
    if not allowed:
        raise HTTPException(409, 'Belum ada sumber aktif untuk model embedding ini.')
    candidates = [c for c in db.scalars(select(RagChunk).where(RagChunk.index_id.in_(list(allowed))))
                  if matches_scope(c.content, target, target['grade'])]
    vector = embed(config, [query])[0]
    found = []
    threshold = float(os.getenv('RAG_MIN_SCORE', '0.35'))
    for role in ROLES:
        role_chunks = [c for c in candidates if c.content['category'] == role]
        if not role_chunks:
            raise HTTPException(409, f'Sumber {role} untuk pilihan ini belum aktif. Lengkapi sumber dahulu.')
        # Include a small reviewed template/checklist in full, not just its closest fragment.
        if role in ('Template', 'Checklist'):
            chosen_index = sorted({c.index_id for c in role_chunks})[0]
            small = sorted([c for c in role_chunks if c.index_id == chosen_index], key=lambda c: c.ordinal)
            if sum(len(c.content['text']) for c in small) > 14000:
                raise HTTPException(409, f'{role} terlalu panjang untuk pilot. Gunakan versi ringkas yang ditinjau guru.')
            found.extend({'id': c.id, 'index_id': c.index_id, **c.content, 'score': None} for c in small)
            continue
        # Filter exact chunk IDs already checked in SQL, including grade and document revision.
        for collection in sorted({allowed[c.index_id].collection for c in role_chunks}):
            subset = {c.id: c for c in role_chunks if allowed[c.index_id].collection == collection}
            result = qdrant('POST', f'/collections/{collection}/points/query', {
                'query': vector, 'filter': {'must': [{'has_id': list(subset)}]},
                'limit': 3, 'score_threshold': threshold, 'with_payload': False})
            for point in result.get('points', []):
                c = subset.get(str(point['id']))
                if c:
                    found.append({'id': c.id, 'index_id': c.index_id, **c.content, 'score': point['score']})
        if not any(c['category'] == role for c in found):
            raise HTTPException(409, f'Pencarian {role} belum menemukan konteks yang cukup relevan. Perjelas topik atau tambahkan sumber.')
    assert_sources(db, found)
    if sum(len(c['text']) for c in found) > 50000:
        raise HTTPException(409, 'Konteks terlalu panjang. Ringkas template/checklist dan pilih bagian sumber yang lebih spesifik.')
    return found


def assert_sources(db, chunks, lock=False):
    db.expire_all()
    for doc_id in sorted({c['document_id'] for c in chunks}):
        if lock:
            index = db.scalar(select(RagIndex).where(RagIndex.document_id == doc_id).with_for_update(read=True))
            doc = db.scalar(select(Document).where(Document.id == doc_id).with_for_update(read=True))
        else:
            index, doc = db.get(RagIndex, doc_id), db.get(Document, doc_id)
        related = [c for c in chunks if c['document_id'] == doc_id]
        if not valid_index(index, doc) or any(c['index_id'] != index.id or c['revision'] != doc.revision for c in related):
            raise HTTPException(409, 'Sumber berubah atau dinonaktifkan selama proses. Ulangi setelah sumber diperiksa.')


def index_next():
    with Session() as db:
        for stale in db.scalars(select(RagIndex).where(RagIndex.status == 'processing', RagIndex.updated_at < now() - timedelta(minutes=5)).with_for_update(skip_locked=True)):
            stale.status, stale.error = 'failed', 'Worker terhenti. Siapkan ulang indeks; tidak ada pengulangan biaya otomatis.'
        row = db.scalar(select(RagIndex).where(RagIndex.status == 'queued').order_by(RagIndex.updated_at).with_for_update(skip_locked=True).limit(1))
        if not row:
            db.commit()
            return False
        doc = db.get(Document, row.document_id)
        if not valid_index(row, doc, ('queued',)):
            row.status, row.error = 'failed', 'Sumber berubah atau persetujuan dicabut.'
            db.commit()
            return True
        row.status, row.updated_at = 'processing', now()
        run_id, doc_id, config = row.id, row.document_id, row.embedding
        chunks = db.scalars(select(RagChunk).where(RagChunk.index_id == run_id).order_by(RagChunk.ordinal)).all()
        db.commit()
    collection = ''
    published = False
    try:
        for start in range(0, len(chunks), 16):
            with Session() as db:
                current = db.get(RagIndex, doc_id)
                if not current or current.id != run_id or not valid_index(current, db.get(Document, doc_id), ('processing',)):
                    raise HTTPException(409, 'Sumber berubah selama embedding. Indeks tidak diaktifkan.')
                current.updated_at = now()
                db.commit()
            batch = chunks[start:start + 16]
            vectors = embed(config, [c.content['text'] for c in batch])
            name = 'rr_' + hashlib.sha256(json.dumps(config, sort_keys=True).encode()).hexdigest()[:16] + '_' + str(len(vectors[0]))
            if collection and name != collection:
                raise HTTPException(502, 'Dimensi embedding berubah di tengah proses.')
            if not collection:
                collection = name
                if qdrant('GET', f'/collections/{collection}', missing_ok=True) is None:
                    qdrant('PUT', f'/collections/{collection}', {'vectors': {'size': len(vectors[0]), 'distance': 'Cosine'}})
                with Session() as db:
                    current = db.get(RagIndex, doc_id)
                    if current and current.id == run_id:
                        current.collection = collection
                        db.commit()
            qdrant('PUT', f'/collections/{collection}/points?wait=true', {'points': [
                {'id': c.id, 'vector': vector, 'payload': {'index_id': run_id, 'document_id': doc_id}}
                for c, vector in zip(batch, vectors)]})
        with Session() as db:
            row = db.scalar(select(RagIndex).where(RagIndex.document_id == doc_id).with_for_update())
            if row and row.id == run_id and valid_index(row, db.get(Document, doc_id), ('processing',)):
                row.status, row.collection, row.updated_at = 'ready', collection, now()
                log(db, doc_id, f'Indeks siap ditinjau: {len(chunks)} potongan')
                db.commit()
                published = True
    except Exception as exc:
        with Session() as db:
            row = db.scalar(select(RagIndex).where(RagIndex.document_id == doc_id).with_for_update())
            if row and row.id == run_id and row.status == 'processing':
                row.status = 'failed'
                row.error = str(exc.detail) if isinstance(exc, HTTPException) else 'Pemrosesan indeks gagal. Periksa konfigurasi penyedia dan Qdrant.'
                row.updated_at = now()
                log(db, doc_id, 'Pengindeksan gagal; sumber tidak diaktifkan')
                db.commit()
    finally:
        if collection and not published:
            try:
                qdrant('POST', f'/collections/{collection}/points/delete?wait=true',
                       {'filter': {'must': [{'key': 'index_id', 'match': {'value': run_id}}]}})
            except HTTPException:
                pass  # Current failed indexes remain eligible for cleanup_next; SQL blocks retrieval.
    return True


def cleanup_next():
    # Remove obsolete vectors after SQL has already blocked retrieval; outages cannot reactivate them.
    with Session() as db:
        row = db.scalar(select(RagIndex).where(RagIndex.status.in_(('active', 'ready', 'inactive', 'failed')),
                                              RagIndex.collection != '').order_by(RagIndex.updated_at).with_for_update(skip_locked=True))
        if not row:
            return
        if valid_index(row, db.get(Document, row.document_id), ('active', 'ready')):
            row.updated_at = now()
            db.commit()
            return
        if row.status in ('active', 'ready'):
            row.status = 'inactive'
        qdrant('POST', f'/collections/{row.collection}/points/delete?wait=true', {'filter': {'must': [{'key': 'index_id', 'match': {'value': row.id}}]}})
        row.collection = ''
        db.commit()
