from datetime import timedelta
from fastapi.testclient import TestClient
from test_admin import database, client
from app.billing import check_webhook_rate_limit, _webhook_rate_limit
from app.rag_api import _active_teacher_generations, _active_gen_lock
from app.db import Session, Teacher, TeacherSession, now
from app.teacher_auth import COOKIE, digest


def test_api_security_headers(client: TestClient):
    resp = client.get('/health/live')
    assert resp.status_code == 200
    headers = resp.headers
    assert headers.get('x-frame-options') == 'DENY'
    assert 'nosniff' in headers.get('x-content-type-options', '')
    assert 'max-age=31536000' in headers.get('strict-transport-security', '')
    assert headers.get('referrer-policy') == 'strict-origin-when-cross-origin'
    assert 'camera=()' in headers.get('permissions-policy', '')


def test_midtrans_webhook_rate_limiting():
    test_ip = '198.51.100.42'
    _webhook_rate_limit.pop(test_ip, None)
    
    # 60 requests within window should be allowed
    for _ in range(60):
        assert check_webhook_rate_limit(test_ip, max_requests=60, window_seconds=60) is True
    
    # 61st request should be rejected
    assert check_webhook_rate_limit(test_ip, max_requests=60, window_seconds=60) is False
    _webhook_rate_limit.pop(test_ip, None)


def test_teacher_generation_concurrency_lock(client: TestClient):
    token = 'test-concurrency-token-abc'
    with Session() as db:
        teacher = Teacher(id='teacher-sec-concurrency', google_sub='test-sub-concurrency', email='teacher-concurrency@example.com', name='Concurrency Test')
        db.add(teacher)
        db.add(TeacherSession(token_hash=digest(token), teacher_id=teacher.id, expires_at=now() + timedelta(hours=12)))
        db.commit()

    client.cookies.set(COOKIE, token)

    # Simulate ongoing generation for this teacher
    with _active_gen_lock:
        _active_teacher_generations.add('teacher-sec-concurrency')

    try:
        # A second concurrent generation attempt should return 429
        resp = client.post(
            '/api/v1/teacher/drafts',
            json={
                'request_id': '11111111-1111-1111-1111-111111111111',
                'mode': 'ai',
                'topic': 'Pengenalan Bilangan',
                'minutes': 70,
                'subject': 'Matematika',
                'grade': 1,
            },
            headers={'Origin': 'http://localhost:3000'},
        )
        assert resp.status_code == 429
        assert 'sedang berjalan' in resp.json().get('detail', '')
    finally:
        with _active_gen_lock:
            _active_teacher_generations.discard('teacher-sec-concurrency')
