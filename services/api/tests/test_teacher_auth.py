"""Isolated auth tests. Valid Google claims are simulated, never bypassed in the app."""
from datetime import timedelta
from types import SimpleNamespace
import json
import time

import pytest
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.primitives import serialization
from google.auth import crypt, jwt
from fastapi.testclient import TestClient
from sqlalchemy import func, select

from app import teacher_auth
from app.db import GoogleChallenge, Session, Teacher, TeacherSession, now
from app.main import app
from test_admin import database, client, sign_in

ORIGIN = {'origin': 'http://localhost:3000'}
CLIENT_ID = '123-synthetic.apps.googleusercontent.com'


@pytest.fixture
def google_config(monkeypatch):
    monkeypatch.setenv('GOOGLE_CLIENT_ID', CLIENT_ID)
    monkeypatch.setenv('ALLOWED_ORIGINS', 'http://localhost:3000')


def prepare(client, monkeypatch, **overrides):
    response = client.post('/api/v1/teacher/auth/challenge', json={}, headers=ORIGIN)
    assert response.status_code == 200
    claims = {'sub': 'synthetic-google-sub', 'email': 'teacher@example.test', 'name': 'Guru Uji',
              'email_verified': True, 'nonce': response.json()['nonce'], 'azp': CLIENT_ID, **overrides}
    def verified(credential, audience):
        assert credential == 'synthetic-id-token' and audience == CLIENT_ID
        return claims
    monkeypatch.setattr(teacher_auth, 'verify_google_token', verified)
    return claims


def google_login(client):
    return client.post('/api/v1/teacher/auth/google', json={'credential': 'synthetic-id-token'}, headers=ORIGIN)


def test_unconfigured_login_is_explicit_and_does_not_create_accounts(client, monkeypatch):
    monkeypatch.delenv('GOOGLE_CLIENT_ID', raising=False)
    assert client.get('/api/v1/teacher/auth/config').json() == {'google_enabled': False, 'client_id': None}
    assert client.post('/api/v1/teacher/auth/challenge', json={}, headers=ORIGIN).status_code == 503
    assert google_login(client).status_code == 503
    with Session() as db:
        assert db.scalar(select(func.count()).select_from(Teacher)) == 0


def test_challenge_cookie_is_bound_http_only_and_replaced(client, google_config):
    r = client.post('/api/v1/teacher/auth/challenge', json={}, headers=ORIGIN)
    assert r.status_code == 200
    header = r.headers['set-cookie']
    assert 'HttpOnly' in header and 'SameSite=strict' in header and 'Max-Age=600' in header
    assert r.json()['nonce'] not in header
    client.post('/api/v1/teacher/auth/challenge', json={}, headers=ORIGIN)
    with Session() as db:
        assert db.scalar(select(func.count()).select_from(GoogleChallenge)) == 1


def test_origin_and_browser_binding_required(client, google_config, monkeypatch):
    for headers in [{}, {'origin': 'https://evil.example'}]:
        assert client.post('/api/v1/teacher/auth/challenge', json={}, headers=headers).status_code == 403
        assert client.post('/api/v1/teacher/auth/google', json={'credential': 'synthetic-id-token'}, headers=headers).status_code == 403
    prepare(client, monkeypatch)
    with TestClient(app) as other_browser:
        assert google_login(other_browser).status_code == 401


def test_teacher_login_isolated_from_admin_and_token_replay_blocked(client, google_config, monkeypatch):
    prepare(client, monkeypatch, email='admin@example.test')
    response = google_login(client)
    assert response.status_code == 200
    assert response.json()['role'] == 'teacher'
    assert response.json()['generation_available'] is False
    assert 'HttpOnly' in response.headers['set-cookie']
    assert 'synthetic-id-token' not in response.text
    assert client.get('/api/v1/teacher/me').status_code == 200
    assert client.get('/api/v1/me').status_code == 401
    assert client.get('/api/v1/admin/users').status_code == 401
    assert client.get('/api/v1/documents').status_code == 401
    assert google_login(client).status_code == 401
    assert client.post('/api/v1/teacher/auth/logout', headers=ORIGIN).status_code == 200
    assert client.get('/api/v1/teacher/me').status_code == 401


@pytest.mark.parametrize('claims', [{'nonce': 'wrong'}, {'email_verified': False}, {'email_verified': 'true'},
                                  {'azp': 'other-client'}, {'sub': ''}, {'email': None}])
def test_invalid_google_claims_rejected(client, google_config, monkeypatch, claims):
    prepare(client, monkeypatch, **claims)
    assert google_login(client).status_code == 401
    with Session() as db:
        assert db.scalar(select(func.count()).select_from(Teacher)) == 0


def test_invalid_signature_and_expired_challenge(client, google_config, monkeypatch):
    prepare(client, monkeypatch)
    monkeypatch.setattr(teacher_auth, 'verify_google_token', lambda *args: (_ for _ in ()).throw(ValueError('bad signature')))
    result = google_login(client)
    assert result.status_code == 401 and 'bad signature' not in result.text
    with Session() as db:
        for row in db.scalars(select(GoogleChallenge)):
            row.expires_at = now() - timedelta(seconds=1)
        db.commit()
    assert google_login(client).status_code == 401


def test_google_sub_is_identity_and_session_rotation(client, google_config, monkeypatch):
    prepare(client, monkeypatch)
    first = google_login(client).json()
    old_cookie = client.cookies.get(teacher_auth.COOKIE)
    prepare(client, monkeypatch, email='updated@example.test')
    second = google_login(client).json()
    assert second['id'] == first['id'] and second['email'] == 'updated@example.test'
    with TestClient(app) as old_session:
        old_session.cookies.set(teacher_auth.COOKIE, old_cookie)
        assert old_session.get('/api/v1/teacher/me').status_code == 401
    prepare(client, monkeypatch, sub='different-google-sub', email='updated@example.test')
    third = google_login(client).json()
    assert third['id'] != first['id']
    with Session() as db:
        for row in db.scalars(select(TeacherSession)):
            row.expires_at = now() - timedelta(seconds=1)
        db.commit()
    assert client.get('/api/v1/teacher/me').status_code == 401


def test_admin_can_find_teacher_and_their_actual_history(client, google_config, monkeypatch):
    prepare(client, monkeypatch)
    teacher = google_login(client).json()
    sign_in(client)
    data = client.get('/api/v1/admin/teachers?q=teacher%40example.test').json()
    assert data['total'] == 1 and data['items'][0]['id'] == teacher['id']
    assert 'google_sub' not in str(data) and 'token_hash' not in str(data)
    activity = client.get('/api/v1/admin/activity', params={'actor_id': teacher['id']}).json()
    assert activity['total'] == 1
    assert activity['items'][0]['action'] == 'Guru masuk melalui Google'
    assert activity['items'][0]['actor_kind'] == 'teacher'
    assert client.get('/api/v1/admin/teachers?limit=101').status_code == 422


def test_official_verifier_rejects_malformed_token_without_network(monkeypatch):
    monkeypatch.setattr(teacher_auth, 'GoogleRequest', lambda: lambda *a, **k: SimpleNamespace(status=200, data=b'{}'))
    with pytest.raises(ValueError):
        teacher_auth.verify_google_token('not-a-valid-jwt', CLIENT_ID)


def test_real_signature_audience_issuer_and_expiry_checks(monkeypatch):
    key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    private = key.private_bytes(serialization.Encoding.PEM, serialization.PrivateFormat.PKCS8, serialization.NoEncryption())
    public = key.public_key().public_bytes(serialization.Encoding.PEM, serialization.PublicFormat.SubjectPublicKeyInfo).decode()
    certs = json.dumps({'synthetic-key': public}).encode()
    monkeypatch.setattr(teacher_auth, 'GoogleRequest', lambda: lambda *a, **k: SimpleNamespace(status=200, data=certs))
    signer = crypt.RSASigner.from_string(private, key_id='synthetic-key')
    claims = {'iss': 'https://accounts.google.com', 'aud': CLIENT_ID, 'sub': 'synthetic-sub',
              'iat': int(time.time()) - 10, 'exp': int(time.time()) + 60}
    token = jwt.encode(signer, claims).decode()
    assert teacher_auth.verify_google_token(token, CLIENT_ID)['sub'] == 'synthetic-sub'
    for changes in [{'aud': 'wrong-audience'}, {'iss': 'https://evil.example'}, {'exp': int(time.time()) - 1}]:
        with pytest.raises((ValueError, teacher_auth.GoogleAuthError)):
            teacher_auth.verify_google_token(jwt.encode(signer, {**claims, **changes}).decode(), CLIENT_ID)
    parts = token.split('.')
    # Keep a syntactically valid signature with different bytes.
    parts[2] = ('A' if parts[2][0] != 'A' else 'B') + parts[2][1:]
    with pytest.raises(ValueError):
        teacher_auth.verify_google_token('.'.join(parts), CLIENT_ID)
