from sqlalchemy import select, text

from app.db import Audit, Session, User, engine
from app.migrations import initialize
from test_admin import database, client, sign_in


def test_operations_require_admin(client):
    for path in ['users', 'teachers', 'activity', 'finance', 'models']:
        assert client.get('/api/v1/admin/' + path).status_code == 401
    sign_in(client, 'collector')
    for path in ['users', 'teachers', 'activity', 'finance', 'models']:
        assert client.get('/api/v1/admin/' + path).status_code == 403
    assert client.post('/api/v1/admin/models', json={'provider': 'openai', 'model': 'synthetic'}).status_code == 403
    assert client.put('/api/v1/admin/models/unknown/default').status_code == 403
    assert client.delete('/api/v1/admin/models/unknown').status_code == 403


def test_model_selection_persists_without_claiming_connection(client, monkeypatch):
    sign_in(client)
    monkeypatch.setenv('OPENAI_API_KEY', 'secret-only-for-isolated-test')
    first = client.post('/api/v1/admin/models', json={'provider': 'openai', 'model': 'synthetic-test-model'})
    assert first.status_code == 201
    id1 = first.json()['id']
    assert client.post('/api/v1/admin/models', json={'provider': 'openai', 'model': 'synthetic-test-model'}).status_code == 409
    assert client.put('/api/v1/admin/models/missing/default').status_code == 404
    assert client.put(f'/api/v1/admin/models/{id1}/default').status_code == 200
    data = client.get('/api/v1/admin/models').json()
    assert data['default_id'] == id1
    assert data['generation_available'] is False
    assert data['items'][0]['connection_status'] == 'not_tested'
    assert data['providers'][0]['credential_configured'] is True
    assert 'secret-only-for-isolated-test' not in str(data)
    assert client.delete(f'/api/v1/admin/models/{id1}').status_code == 409
    id2 = client.post('/api/v1/admin/models', json={'provider': 'deepseek', 'model': 'another-synthetic-model'}).json()['id']
    assert client.put(f'/api/v1/admin/models/{id2}/default').status_code == 200
    assert client.delete(f'/api/v1/admin/models/{id1}').status_code == 200
    assert len(client.get('/api/v1/admin/models').json()['items']) == 1
    assert 'secret-only-for-isolated-test' not in client.get('/api/v1/admin/activity').text


def test_model_configuration_rejects_unknown_and_secret_fields(client):
    sign_in(client)
    for body in [{'provider': 'unsupported', 'model': 'x'}, {'provider': 'openai', 'model': ' '},
                 {'provider': 'openai', 'model': 'x', 'api_key': 'must-not-store'},
                 {'provider': 'openai', 'model': 'x\nforged log'}, {'provider': 'openai', 'model': 'x' * 151}]:
        assert client.post('/api/v1/admin/models', json=body).status_code == 422
    assert client.get('/api/v1/admin/models').json()['items'] == []


def test_activity_uses_actor_id_not_duplicate_names_and_paginates(client):
    with Session() as db:
        for user in db.scalars(select(User)):
            user.name = 'Same display name'
        db.commit()
    admin = sign_in(client).json()
    sign_in(client, 'collector')
    sign_in(client)
    data = client.get('/api/v1/admin/activity', params={'actor_id': admin['id'], 'limit': 1}).json()
    assert data['total'] == 2 and len(data['items']) == 1
    assert data['items'][0]['actor_id'] == admin['id']
    second = client.get('/api/v1/admin/activity', params={'actor_id': admin['id'], 'limit': 1, 'page': 2}).json()
    assert data['items'][0]['id'] != second['items'][0]['id']
    assert client.get('/api/v1/admin/activity', params={'q': '%'}).json()['total'] == 0
    assert client.get('/api/v1/admin/activity?limit=101').status_code == 422
    users = client.get('/api/v1/admin/users').json()
    assert len(users['items']) == 2
    assert all(u['last_login'] for u in users['items'])
    assert 'password_hash' not in str(users) and 'token_hash' not in str(users)
    assert users['teacher_accounts_available'] is True


def test_finance_unavailable_is_not_zero_revenue(client):
    sign_in(client)
    data = client.get('/api/v1/admin/finance').json()
    assert data['status'] == 'not_connected'
    assert data['revenue'] is None and data['llm_cost'] is None
    assert data['transactions'] == []


def test_existing_audit_schema_migration_preserves_events(client):
    sign_in(client)
    with engine.begin() as connection:
        connection.execute(text('ALTER TABLE source_audit DROP COLUMN actor_id'))
    initialize(engine)
    initialize(engine)
    with Session() as db:
        entry = db.scalar(select(Audit))
        assert entry.action == 'Masuk ke dashboard'
        assert entry.actor_id is None  # Never guess identity from a historical display name.
    sign_in(client)
    assert client.get('/api/v1/admin/activity').json()['total'] == 2
