"""Durable PostgreSQL queue. No source is sent to an external service."""
import json
import subprocess
import sys
import time
from datetime import timedelta
from uuid import uuid4

from sqlalchemy import select

from .db import Audit, Document, ProcessingJob, Session, STORAGE, now
from .domain import automatic_checks


def queue(db, document):
    job = db.get(ProcessingJob, document.id)
    if job is None:
        job = ProcessingJob(document_id=document.id, revision=document.revision or 1)
        db.add(job)
    job.revision = document.revision or 1
    job.status, job.token, job.updated_at = 'queued', '', now()
    document.extraction = {'status': 'queued', 'characters': 0, 'sections': [], 'message': 'Menunggu pemrosesan di latar belakang.'}
    document.auto_status, document.auto_issues = automatic_checks(document.metadata_json, document.extraction)


def process_next():
    with Session() as db:
        # A killed worker cannot leave jobs permanently processing. No automatic retry loop.
        stale = db.scalars(select(ProcessingJob).where(ProcessingJob.status == 'running',
            ProcessingJob.updated_at < now() - timedelta(minutes=5)).with_for_update(skip_locked=True)).all()
        for job in stale:
            job.status = 'failed'
            d = db.get(Document, job.document_id)
            if d and d.revision == job.revision:
                d.extraction = {'status': 'failed', 'characters': 0, 'sections': [], 'message': 'Worker terhenti. Gunakan Proses ulang.'}
                d.auto_status, d.auto_issues = automatic_checks(d.metadata_json, d.extraction)
        job = db.scalar(select(ProcessingJob).where(ProcessingJob.status == 'queued')
                        .order_by(ProcessingJob.updated_at).with_for_update(skip_locked=True).limit(1))
        if not job:
            db.commit()
            return False
        document = db.get(Document, job.document_id)
        if not document:
            job.status = 'failed'
            db.commit()
            return True
        token = str(uuid4())
        job.status, job.token, job.updated_at = 'running', token, now()
        document.extraction = {'status': 'processing', 'characters': 0, 'sections': [], 'message': 'Teks sedang diekstrak.'}
        doc_id, revision, extension = document.id, job.revision, document.extension
        ranges = [r for scope in document.metadata_json['scopes'] for r in scope.get('page_ranges', [])]
        db.commit()
    try:
        result = subprocess.run([sys.executable, '-m', 'app.extract', str(STORAGE / f'{doc_id}{extension}'),
                                 extension, json.dumps(ranges)], capture_output=True, timeout=180, check=True)
        extraction = json.loads(result.stdout)
    except (subprocess.SubprocessError, ValueError, OSError):
        extraction = {'status': 'failed', 'characters': 0, 'sections': [],
                      'message': 'Ekstraksi gagal atau melewati batas 180 detik/memori. Pilih rentang halaman lebih kecil lalu proses ulang.'}
    with Session() as db:
        job = db.scalar(select(ProcessingJob).where(ProcessingJob.document_id == doc_id).with_for_update())
        document = db.scalar(select(Document).where(Document.id == doc_id).with_for_update())
        # Metadata may have changed while extraction was running.
        if job and document and job.token == token and job.status == 'running' and document.revision == revision:
            document.extraction = extraction
            document.auto_status, document.auto_issues = automatic_checks(document.metadata_json, extraction)
            job.status = 'failed' if extraction['status'] == 'failed' else 'completed'
            job.updated_at = now()
            db.add(Audit(id=str(uuid4()), document_id=doc_id, actor_name='Sistem', action=f'Ekstraksi revisi {revision}: {extraction["status"]}'))
            db.commit()
    return True


if __name__ == '__main__':
    while True:
        try:
            if not process_next():
                time.sleep(2)
        except Exception as exc:
            print(f'Worker belum dapat memproses antrean: {type(exc).__name__}', flush=True)
            time.sleep(5)
