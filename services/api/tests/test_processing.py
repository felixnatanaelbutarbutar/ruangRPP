import io
from datetime import timedelta

from pypdf import PdfWriter

from app.db import Document, ProcessingJob, Session, now
from app.domain import matches, pipeline
from app.worker import process_next
from test_admin import database, client, sign_in, upload, metadata, approval


def test_twenty_guides_are_separate_candidates(client):
    sign_in(client)
    assert client.post('/api/v1/requirements/guides-sd').json()['added'] == 20
    assert client.post('/api/v1/requirements/guides-sd').json()['added'] == 0
    needs = client.get('/api/v1/requirements').json()['items']
    assert len(needs) == 20
    assert all(n['criteria']['category'] == 'Panduan_Mapel' and n['state'] == 'missing' and n['applicability'] == 'unconfirmed' for n in needs)
    by_name = {n['label']: n['criteria'] for n in needs}
    assert by_name['Bahasa Inggris']['required_phases'] == ['B', 'C']
    assert by_name['IPAS']['required_phases'] == ['B', 'C']
    assert by_name['Koding dan Kecerdasan Artifisial']['required_phases'] == ['C']
    assert len([n for n in needs if n['criteria']['scope']['subject'] == 'Seni']) == 4
    assert len([n for n in needs if n['criteria']['scope']['subject'] == 'Pendidikan Agama dan Budi Pekerti']) == 6


def test_large_pdf_queue_selected_pages_and_original(client):
    sign_in(client)
    writer = PdfWriter()
    for _ in range(260):
        writer.add_blank_page(width=72, height=72)
    writer.add_attachment('synthetic-padding.bin', b'x' * (33 * 1024 * 1024))
    buffer = io.BytesIO()
    writer.write(buffer)
    content = buffer.getvalue()
    m = metadata()
    m.update(category='Panduan_Mapel', original_phases=['A','B','C','D','E','F'], original_level='Lintas jenjang (sintetis)')
    m['scopes'][0]['page_ranges'] = [{'start':250, 'end':252}]
    result = upload(client, content, 'large-synthetic.pdf', m, process=False)
    assert result.status_code == 201
    d = result.json()
    assert d['size_bytes'] > 30 * 1024 * 1024
    assert d['processing_status'] == 'queued' and d['extraction']['sections'] == []
    route = '/api/v1/documents/' + d['id']
    assert client.post(route + '/review', json=approval(1)).status_code == 409
    assert client.post(route + '/process').status_code == 409
    assert process_next()
    d = client.get(route).json()
    assert d['extraction']['total_pages'] == 260
    assert d['extraction']['selected_pages'] == 3
    assert [s['page'] for s in d['extraction']['sections']] == [250,251,252]
    assert d['extraction']['status'] == 'needs_review'  # blank pages must not pass
    assert client.get(route + '/file').content == content
    m['scopes'][0]['page_ranges'] = [{'start':261, 'end':262}]
    assert client.patch(route, json={'metadata':m, 'expected_revision':1}).status_code == 200
    assert process_next()
    assert client.get(route).json()['processing_status'] == 'failed'


def test_stale_worker_can_be_retried(client):
    sign_in(client)
    d = upload(client, process=False).json()
    with Session() as db:
        job = db.get(ProcessingJob, d['id'])
        job.status = 'running'
        job.updated_at = now() - timedelta(minutes=6)
        db.commit()
    assert not process_next()
    route = '/api/v1/documents/' + d['id']
    assert client.get(route).json()['processing_status'] == 'failed'
    assert client.post(route + '/process').status_code == 202
    assert process_next()
    assert client.get(route).json()['extraction']['status'] == 'readable'


def test_old_worker_cannot_overwrite_new_metadata(client, monkeypatch):
    from app import worker
    original_run = worker.subprocess.run
    sign_in(client)
    d = upload(client, process=False).json()
    route = '/api/v1/documents/' + d['id']
    def change_during_extraction(*args, **kwargs):
        assert client.patch(route, json={'metadata':metadata(notes='new revision'), 'expected_revision':1}).status_code == 200
        return original_run(*args, **kwargs)
    monkeypatch.setattr(worker.subprocess, 'run', change_during_extraction)
    assert process_next()
    d = client.get(route).json()
    assert d['revision'] == 2 and d['processing_status'] == 'queued'
    assert d['extraction']['status'] == 'queued'
    monkeypatch.setattr(worker.subprocess, 'run', original_run)
    assert process_next()
    assert client.get(route).json()['extraction']['status'] == 'readable'


def test_full_coverage_and_page_gate():
    from types import SimpleNamespace
    m = metadata()
    m.update(original_phases=['A','B','C','D','E','F'])
    d = SimpleNamespace(metadata_json=m, auto_status='passed', review=approval(1))
    assert pipeline(d) == 'awaiting_page_selection'
    m['scopes'][0]['page_ranges'] = [{'start':2,'end':3}]
    assert pipeline(d) == 'eligible_for_indexing'
    criteria = dict(category='CP', scope=dict(m['scopes'][0], grades=[]), required_phases=['A','B','C'])
    assert not matches(d, criteria)
    m['scopes'] += [dict(m['scopes'][0], phase=p) for p in ['B','C']]
    assert matches(d, criteria)
    m['original_phases'] = ['F']
    assert not matches(d, criteria)
    assert pipeline(d) == 'outside_sd_scope'


def test_docx_cannot_claim_pdf_pages(client):
    sign_in(client)
    m = metadata()
    m['scopes'][0]['page_ranges'] = [{'start':1,'end':2}]
    assert upload(client, meta=m).status_code == 422
