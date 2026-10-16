"""Container tests use an isolated database, never the collection database."""
import io
import json
import os
from types import SimpleNamespace
from uuid import uuid4

import pytest
from docx import Document as WordDocument
from fastapi.testclient import TestClient

assert os.environ.get('APP_TESTING') == '1', 'Run via docker compose --profile test run --rm tests'
from app.db import Base, Session, STORAGE, User, engine
from app.domain import matches
from app.main import app, attempts, hasher
from app.worker import process_next


@pytest.fixture(autouse=True)
def database():
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)
    attempts.clear()
    STORAGE.mkdir(parents=True, exist_ok=True)
    with Session() as db:
        for role in ['admin', 'collector']:
            db.add(User(id=str(uuid4()), email=f'{role}@example.test', name=f'Test {role}',
                        role=role, password_hash=hasher.hash('OnlyForContainerTests123')))
        db.commit()
    yield
    for path in STORAGE.iterdir():
        if path.is_file():
            path.unlink()


@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c


def sign_in(client, role='admin'):
    response = client.post('/api/v1/auth/login', json={'email': f'{role}@example.test', 'password': 'OnlyForContainerTests123'})
    assert response.status_code == 200
    return response


def metadata(**overrides):
    return dict(title='Dokumen sintetis untuk pengujian perangkat lunak', category='CP',
                year=None, year_unknown=True, publisher='Tim pengujian', internal_source=True,
                curriculum='Acuan sintetis uji; bukan CP resmi',
                scopes=[dict(subject='Matematika', phase='A', grades=[1, 2], variant='', region='')], **overrides)


def word_bytes():
    document = WordDocument()
    document.add_paragraph('Dokumen sintetis pengujian perangkat lunak. Tidak berisi CP resmi atau materi pembelajaran. ' * 4)
    stream = io.BytesIO()
    document.save(stream)
    return stream.getvalue()


def upload(client, content=None, name='uji.docx', meta=None, process=True):
    result = client.post('/api/v1/documents', data={'metadata': json.dumps(meta or metadata())},
                         files={'file': (name, content if content is not None else word_bytes())})
    if result.status_code == 201 and process:
        assert result.json()['processing_status'] == 'queued'
        assert process_next()
        detail = client.get('/api/v1/documents/' + result.json()['id'])
        result._content = detail.content
    return result


def approval(revision, external=True):
    return dict(expected_revision=revision, content='approved', rights='approved', extraction='approved',
                evidence='Dokumen sintetis milik penguji', note='Hanya memeriksa alur perangkat lunak.', external_processing_allowed=external)


def test_auth_roles_csrf_and_logout(client):
    assert client.get('/api/v1/documents').status_code == 401
    response = sign_in(client, 'collector')
    assert 'HttpOnly' in response.headers['set-cookie']
    assert client.post('/api/v1/requirements/template').status_code == 403
    assert client.post('/api/v1/auth/logout', headers={'origin': 'https://invalid.example'}).status_code == 403
    assert client.post('/api/v1/auth/logout').status_code == 200
    assert client.get('/api/v1/me').status_code == 401


def test_upload_duplicate_download_and_scope_preserved(client):
    sign_in(client)
    content = word_bytes()
    response = upload(client, content)
    assert response.status_code == 201, response.text
    d = response.json()
    assert d['auto_status'] == 'passed'
    assert d['pipeline'] == 'awaiting_review'
    assert d['vector_status'] == 'not_indexed'
    assert d['extraction']['sections'][0]['locator']
    assert client.get(f'/api/v1/documents/{d["id"]}/file').content == content
    assert upload(client, content, 'renamed.docx').status_code == 409
    assert len(list(STORAGE.iterdir())) == 1
    assert len(client.get('/api/v1/documents').json()['items']) == 1


def test_review_edit_invalidates_and_conflicts(client):
    sign_in(client)
    d = upload(client).json()
    route = f'/api/v1/documents/{d["id"]}'
    response = client.post(route + '/review', json=approval(1, external=False))
    assert response.json()['pipeline'] == 'awaiting_external_permission'
    assert client.post(route + '/review', json=approval(1)).status_code == 409
    response = client.post(route + '/review', json=approval(2))
    assert response.json()['pipeline'] == 'eligible_for_indexing'
    assert response.json()['vector_status'] == 'not_indexed'
    changed = client.patch(route, json={'expected_revision': 3, 'metadata': metadata(notes='Perubahan cakupan harus ditinjau ulang')})
    assert changed.status_code == 200
    assert changed.json()['review'] == {}
    assert changed.json()['pipeline'] == 'blocked'
    assert process_next()
    assert client.get(route).json()['pipeline'] == 'awaiting_review'
    assert client.patch(route, json={'expected_revision': 3, 'metadata': metadata()}).status_code == 409
    assert len(client.get(route).json()['history']) == 6


def test_collector_cannot_approve(client):
    sign_in(client, 'collector')
    d = upload(client).json()
    assert client.post(f'/api/v1/documents/{d["id"]}/review', json=approval(1)).status_code == 403


def test_bad_formats_and_failed_extraction(client):
    sign_in(client)
    assert upload(client, b'not a pdf', 'bad.pdf').status_code == 415
    assert upload(client, b'executable', 'bad.exe').status_code == 415
    response = upload(client, b'%PDF-1.7\nthis is broken', 'broken.pdf')
    assert response.status_code == 201
    d = response.json()
    assert d['extraction']['status'] == 'failed'
    assert d['pipeline'] == 'blocked'
    assert client.get(f'/api/v1/documents/{d["id"]}/file').status_code == 200
    assert client.post(f'/api/v1/documents/{d["id"]}/review', json=approval(1)).status_code == 409


def test_requirements_seed_idempotent_unconfirmed(client):
    sign_in(client)
    assert client.post('/api/v1/requirements/template').json()['added'] == 60
    assert client.post('/api/v1/requirements/template').json()['added'] == 0
    needs = client.get('/api/v1/requirements').json()['items']
    assert len(needs) == 60
    assert all(n['applicability'] == 'unconfirmed' and n['state'] == 'missing' for n in needs)


def test_requirement_counts_only_reviewed_matching_documents(client):
    sign_in(client)
    body = dict(label='Kebutuhan uji Matematika A', category='CP', scope=metadata()['scopes'][0],
                curriculum=metadata()['curriculum'], minimum=1, applicability='applicable', note='Konteks pengujian saja')
    assert client.post('/api/v1/requirements', json=body).status_code == 201
    assert client.get('/api/v1/requirements').json()['items'][0]['state'] == 'missing'
    d = upload(client).json()
    assert client.get('/api/v1/requirements').json()['items'][0]['state'] == 'review'
    client.post(f'/api/v1/documents/{d["id"]}/review', json=approval(1))
    n = client.get('/api/v1/requirements').json()['items'][0]
    assert n['state'] == 'complete' and n['reviewed'] == 1
    assert n['document_ids'] == [d['id']]


def test_metadata_validation_and_csv_formula_escape(client):
    sign_in(client)
    invalid = metadata()
    invalid['year'] = 2025
    assert upload(client, meta=invalid).status_code == 422
    invalid = metadata(source_url='javascript:alert(1)')
    assert upload(client, meta=invalid).status_code == 422
    m = metadata()
    m['title'] = '=HYPERLINK("https://example.test")'
    assert upload(client, meta=m).status_code == 201
    assert "'=HYPERLINK" in client.get('/api/v1/inventory.csv').text


def test_scopes_never_cross_subject_phase_or_variant():
    m = metadata()
    m['scopes'].append(dict(subject='Bahasa Indonesia', phase='B', grades=[3], variant='', region=''))
    document = SimpleNamespace(metadata_json=m)
    criteria = dict(category='CP', scope=dict(subject='Matematika', phase='B', grades=[], variant='', region=''))
    assert not matches(document, criteria)
    criteria['scope']['phase'] = 'A'
    assert matches(document, criteria)
    criteria['scope']['grades'] = [3]
    assert not matches(document, criteria)


def test_approval_requires_evidence(client):
    sign_in(client)
    d = upload(client).json()
    body = approval(1)
    body['evidence'] = ''
    assert client.post(f'/api/v1/documents/{d["id"]}/review', json=body).status_code == 422


def test_minimal_upload_does_not_invent_coverage_or_pass_review(client):
    sign_in(client)
    response = upload(client, meta={'title':'Unggahan sederhana', 'category':'CP'})
    assert response.status_code == 201
    d = response.json()
    assert d['extraction']['status'] == 'readable'
    assert d['metadata']['scopes'] == []
    assert d['metadata']['year'] is None and d['metadata']['publisher'] == ''
    assert d['auto_status'] == 'needs_review' and d['pipeline'] == 'blocked'
    route = f'/api/v1/documents/{d["id"]}'
    approved = client.post(route + '/review', json=approval(1))
    assert approved.status_code == 200 and approved.json()['pipeline'] == 'blocked'
    # Adding legitimate metadata later restores the normal review workflow.
    edited = client.patch(route, json={'metadata':metadata(), 'expected_revision':2})
    assert edited.status_code == 200 and edited.json()['review'] == {}
    assert process_next()
    assert client.get(route).json()['pipeline'] == 'awaiting_review'
