import collections
import hashlib
import hmac
import json
import os
import threading
import time
from datetime import timedelta, timezone
from decimal import Decimal, InvalidOperation
from typing import Literal
from urllib.parse import urlparse
from uuid import NAMESPACE_URL, UUID, uuid4, uuid5

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from pydantic import BaseModel, ConfigDict
from sqlalchemy import func, select
from starlette.concurrency import run_in_threadpool

from .db import Audit, LessonDraft, PaymentOrder, QuotaGrant, Session, Teacher, now
from .teacher_auth import current_teacher, same_origin

router = APIRouter(prefix='/api/v1')
PLANS = {
    'mandiri': {'id': 'mandiri', 'name': 'Mandiri', 'amount': 25000, 'credits': 15},
    'semester': {'id': 'semester', 'name': 'Semester', 'amount': 65000, 'credits': 50},
}
OPEN = ('creating', 'creation_unknown', 'pending', 'review')
REVERSED = ('refund', 'partial_refund', 'chargeback', 'partial_chargeback')

_webhook_rate_limit: dict[str, list[float]] = collections.defaultdict(list)
_webhook_rate_lock = threading.Lock()


def check_webhook_rate_limit(client_ip: str, max_requests: int = 60, window_seconds: int = 60) -> bool:
    now_ts = time.monotonic()
    with _webhook_rate_lock:
        timestamps = _webhook_rate_limit[client_ip]
        cutoff = now_ts - window_seconds
        valid = [t for t in timestamps if t > cutoff]
        if len(valid) >= max_requests:
            _webhook_rate_limit[client_ip] = valid
            return False
        valid.append(now_ts)
        _webhook_rate_limit[client_ip] = valid
        if len(_webhook_rate_limit) > 1000:
            for ip in list(_webhook_rate_limit.keys()):
                _webhook_rate_limit[ip] = [t for t in _webhook_rate_limit[ip] if t > cutoff]
                if not _webhook_rate_limit[ip]:
                    del _webhook_rate_limit[ip]
        return True


class GatewayRejected(HTTPException):
    """Authentication/validation rejection: the gateway did not create a checkout."""


def environment():
    return 'production' if os.getenv('MIDTRANS_IS_PRODUCTION', '').lower() == 'true' else 'sandbox'


def server_key(env):
    # Keep the previous environment's key to reconcile orders after switching modes.
    value = os.getenv(f'MIDTRANS_{env.upper()}_SERVER_KEY', '').strip()
    if not value and env == environment():
        value = os.getenv('MIDTRANS_SERVER_KEY', '').strip()
    return value


def app_url():
    return os.getenv('PUBLIC_APP_URL', 'http://localhost:3001').rstrip('/')


def configuration():
    env = environment()
    url = urlparse(app_url())
    valid_url = bool(url.hostname and not url.username and not url.password and not url.query
                     and not url.fragment and url.path in ('', '/')
                     and (url.scheme == 'https' or (env == 'sandbox' and url.scheme == 'http'
                          and url.hostname in ('localhost', '127.0.0.1'))))
    enabled = os.getenv('PAYMENTS_ENABLED', '').lower() == 'true'
    return {'environment': env, 'enabled': enabled, 'server_key_configured': bool(server_key(env)),
            'app_url_valid': valid_url, 'available': enabled and valid_url and bool(server_key(env)),
            'notification_path': '/api/v1/payments/midtrans/notification'}


def provider_call(env, method, path, payload=None, snap=False):
    key = server_key(env)
    if not key:
        raise HTTPException(503, 'Server key untuk lingkungan transaksi ini belum diisi.')
    host = ('app' if snap else 'api') + ('.sandbox' if env == 'sandbox' else '') + '.midtrans.com'
    try:
        response = httpx.request(method, f'https://{host}{path}', json=payload,
                                 auth=(key, ''), timeout=10, follow_redirects=False)
        data = response.json()
        if not isinstance(data, dict):
            raise ValueError()
    except (httpx.HTTPError, ValueError):
        raise HTTPException(502, 'Midtrans belum dapat dihubungi. Status pembayaran belum berubah; coba periksa kembali.')
    if not snap and (response.status_code == 404 or str(data.get('status_code')) == '404'):
        return None  # Snap orders do not exist in Core API until a payment method is selected.
    if snap and response.status_code in (401, 403, 422):
        raise GatewayRejected(502, 'Checkout ditolak Midtrans. Pengelola perlu memeriksa server key dan konfigurasi.')
    if response.status_code not in (200, 201):
        raise HTTPException(502, 'Midtrans belum dapat memproses permintaan. Pengelola perlu memeriksa konfigurasi pembayaran.')
    return data


def safe_checkout(url, env):
    parsed = urlparse(url)
    return (parsed.scheme == 'https' and parsed.netloc == (
        'app.sandbox.midtrans.com' if env == 'sandbox' else 'app.midtrans.com')
        and parsed.path.startswith('/snap/'))


def order_payload(order):
    return {'id': order.id, 'plan_name': order.plan_name, 'amount': order.amount,
            'credits': order.credits, 'status': order.status, 'provider_status': order.provider_status,
            'environment': order.environment, 'created_at': order.created_at.isoformat(),
            'checked_at': order.checked_at.isoformat() if order.checked_at else None,
            'checkout_url': order.checkout_url if order.status == 'pending' else None}


def event(db, order, message):
    db.add(Audit(id=str(uuid4()), actor_id=order.teacher_id, actor_name='Sistem pembayaran',
                 action=f'{message}: {order.id}'[:200]))


def quota(db, teacher_id, env):
    granted = db.scalar(select(func.coalesce(func.sum(QuotaGrant.credits), 0)).where(
        QuotaGrant.teacher_id == teacher_id, QuotaGrant.environment == env,
        QuotaGrant.suspended_at.is_(None)))
    used = db.scalar(select(func.coalesce(func.sum(LessonDraft.credits_used), 0)).where(
        LessonDraft.teacher_id == teacher_id, LessonDraft.environment == env))
    return max(0, granted - used)


def trial_id(teacher_id, env):
    return 'TR-' + uuid5(NAMESPACE_URL, f'rr:trial:{env}:{teacher_id}').hex


@router.post('/teacher/billing/trial', dependencies=[Depends(same_origin)])
def claim_trial(teacher=Depends(current_teacher)):
    env = environment()
    with Session() as db:
        db.scalar(select(Teacher).where(Teacher.id == teacher.id).with_for_update())
        identifier = trial_id(teacher.id, env)
        if not db.get(QuotaGrant, identifier):
            db.add(QuotaGrant(order_id=identifier, teacher_id=teacher.id, environment=env, credits=3))
            db.add(Audit(id=str(uuid4()), actor_id=teacher.id, actor_name=teacher.name,
                         action=f'Mengaktifkan 3 kuota percobaan satu kali ({env})'))
            db.commit()
        return {'environment': env, 'quota': quota(db, teacher.id, env), 'claimed': True}


@router.get('/teacher/billing')
def billing(page: int = Query(1, ge=1), teacher=Depends(current_teacher)):
    with Session() as db:
        query = select(PaymentOrder).where(PaymentOrder.teacher_id == teacher.id)
        rows = db.scalars(query.order_by(PaymentOrder.created_at.desc(), PaymentOrder.id).offset((page - 1) * 20).limit(20))
        return {'setup': configuration(), 'plans': list(PLANS.values()),
                'trial': {'credits': 3, 'claimed': db.get(QuotaGrant, trial_id(teacher.id, environment())) is not None},
                'quota': {env: quota(db, teacher.id, env) for env in ('sandbox', 'production')},
                'orders': [order_payload(o) for o in rows], 'page': page,
                'total': db.scalar(select(func.count()).select_from(PaymentOrder).where(PaymentOrder.teacher_id == teacher.id)),
                'generation_available': os.getenv('RAG_ENABLED', 'true').lower() == 'true'}


class CheckoutInput(BaseModel):
    model_config = ConfigDict(extra='forbid')
    plan_id: Literal['mandiri', 'semester']
    request_id: UUID


@router.post('/teacher/billing/checkout', dependencies=[Depends(same_origin)])
def checkout(body: CheckoutInput, teacher=Depends(current_teacher)):
    setup = configuration()
    if not setup['available']:
        raise HTTPException(503, 'Pembelian paket belum dibuka oleh pengelola.')
    env, plan = setup['environment'], PLANS[body.plan_id]
    order_id = 'RR-' + uuid5(NAMESPACE_URL, f'{teacher.id}:{env}:{body.request_id}').hex
    with Session() as db:
        # Serialize creation per teacher; concurrent clicks reuse the pending order.
        db.scalar(select(Teacher).where(Teacher.id == teacher.id).with_for_update())
        existing = db.get(PaymentOrder, order_id)
        if not existing:
            existing = db.scalar(select(PaymentOrder).where(PaymentOrder.teacher_id == teacher.id,
                PaymentOrder.environment == env, PaymentOrder.status.in_(OPEN))
                .order_by(PaymentOrder.created_at.desc()).limit(1))
        if existing:
            if existing.plan_id != body.plan_id:
                raise HTTPException(409, 'Selesaikan atau periksa transaksi sebelumnya sebelum memilih paket lain.')
            if existing.status == 'pending' and existing.checkout_url:
                return order_payload(existing)
            if existing.status not in OPEN:
                return order_payload(existing)
            raise HTTPException(409, 'Transaksi sebelumnya masih diperiksa. Buka riwayat dan pilih Periksa pembayaran; jangan membayar dua kali.')
        order = PaymentOrder(id=order_id, teacher_id=teacher.id, environment=env,
                             plan_id=plan['id'], plan_name=plan['name'], amount=plan['amount'], credits=plan['credits'])
        db.add(order)
        event(db, order, 'Membuat pesanan')
        db.commit()  # Persist before network I/O; timeouts cannot cause another charge.
    try:
        data = provider_call(env, 'POST', '/snap/v1/transactions', {
            'transaction_details': {'order_id': order_id, 'gross_amount': plan['amount']},
            'item_details': [{'id': plan['id'], 'name': f"RuangRPP {plan['name']}", 'price': plan['amount'], 'quantity': 1}],
            'customer_details': {'first_name': teacher.name[:20], 'email': teacher.email},
            'credit_card': {'secure': True},
            'callbacks': {'finish': app_url() + '/dashboard#billing'},
            'expiry': {'start_time': now().astimezone(timezone(timedelta(hours=7))).strftime('%Y-%m-%d %H:%M:%S %z'),
                       'unit': 'hours', 'duration': 24},
            'page_expiry': {'unit': 'hours', 'duration': 24},
        }, snap=True)
        url = str(data.get('redirect_url', ''))
        if not safe_checkout(url, env):
            raise HTTPException(502, 'Alamat checkout tidak dapat diverifikasi.')
    except HTTPException as exc:
        with Session() as db:
            order = db.scalar(select(PaymentOrder).where(PaymentOrder.id == order_id).with_for_update())
            if order.status == 'creating':
                order.status = 'failed' if isinstance(exc, GatewayRejected) else 'creation_unknown'
                order.updated_at = now()
                db.commit()
        raise
    with Session() as db:
        order = db.scalar(select(PaymentOrder).where(PaymentOrder.id == order_id).with_for_update())
        order.checkout_url = url
        if order.status in ('creating', 'creation_unknown'):
            order.status = 'pending'
        order.updated_at = now()
        db.commit()
        return order_payload(order)


def verify_order(order_id, teacher_id=None, force=False, transaction_hint=None):
    with Session() as db:
        filters = [PaymentOrder.id == order_id]
        if teacher_id:
            filters.append(PaymentOrder.teacher_id == teacher_id)
        # Lock across status retrieval and grant: no stale parallel response can double-credit.
        order = db.scalar(select(PaymentOrder).where(*filters).with_for_update())
        if not order:
            raise HTTPException(404, 'Transaksi tidak ditemukan.')
        # Serialize grants/refunds with generation's quota check and deduction.
        db.scalar(select(Teacher).where(Teacher.id == order.teacher_id).with_for_update())
        if not force and order.checked_at and (now() - order.checked_at.replace(tzinfo=timezone.utc)).total_seconds() < 15:
            return order_payload(order)
        reference = transaction_hint or order.transaction_id or order.id
        data = provider_call(order.environment, 'GET', f'/v2/{reference}/status')
        order.checked_at = now()
        if data is None:
            # No payment method selected is NOT evidence of cancellation or failure.
            if force:
                raise HTTPException(503, 'Status transaksi belum tersedia. Notifikasi perlu dikirim ulang.')
            if order.status in ('creating', 'creation_unknown', 'pending') and now() - order.created_at.replace(tzinfo=timezone.utc) > timedelta(hours=25):
                # A successful 404 after the explicit 24h page/payment expiry allows a new order.
                order.status = 'expired'
                order.updated_at = now()
                event(db, order, 'Checkout tanpa transaksi melewati masa berlaku')
            db.commit()
            return order_payload(order)
        try:
            amount_matches = Decimal(str(data.get('gross_amount'))) == Decimal(order.amount)
        except InvalidOperation:
            amount_matches = False
        if data.get('order_id') != order.id or not amount_matches or data.get('currency', 'IDR') != 'IDR':
            raise HTTPException(409, 'Data pembayaran tidak cocok dengan pesanan. Kuota belum diubah.')
        transaction_id = str(data.get('transaction_id', ''))
        if order.status in ('paid', 'refunded', 'refund_review') and order.transaction_id and transaction_id != order.transaction_id:
            raise HTTPException(409, 'Identitas transaksi berbeda. Perlu pemeriksaan pengelola.')
        if transaction_id and len(transaction_id) <= 100 and all(c.isalnum() or c == '-' for c in transaction_id):
            order.transaction_id = transaction_id
        status = str(data.get('transaction_status', '')).lower()
        fraud = data.get('fraud_status')
        paid = str(data.get('status_code')) == '200' and (
            status == 'settlement' and fraud in (None, 'accept') or status == 'capture' and fraud == 'accept')
        old_status = order.status
        grant = db.get(QuotaGrant, order.id)
        if status in REVERSED:
            # Partial refunds/chargebacks need a human policy decision; suspend the entire grant.
            order.status = 'refunded' if status == 'refund' else 'refund_review'
            if grant and not grant.suspended_at:
                grant.suspended_at = now()
        elif order.status not in ('refunded', 'refund_review'):
            if paid:
                order.status = 'paid'
                if not grant:
                    db.add(QuotaGrant(order_id=order.id, teacher_id=order.teacher_id,
                                      environment=order.environment, credits=order.credits))
                    event(db, order, f'Kuota aktif +{order.credits} ({order.environment})')
            elif order.status != 'paid':
                order.status = ('pending' if status == 'pending' else 'expired' if status == 'expire'
                                else 'failed' if status in ('deny', 'cancel', 'failure') else 'review')
        # Do not regress a paid/refunded order on delayed pending/failed events.
        if order.status != old_status or order.status not in ('paid', 'refunded', 'refund_review'):
            order.provider_status = status[:40]
        order.updated_at = now()
        if order.status != old_status:
            event(db, order, f'Pembayaran {old_status} → {order.status}')
        db.commit()
        return order_payload(order)


@router.post('/teacher/billing/orders/{order_id}/verify', dependencies=[Depends(same_origin)])
def verify(order_id: str, teacher=Depends(current_teacher)):
    return verify_order(order_id, teacher.id)


@router.post('/payments/midtrans/notification')
async def notification(request: Request):
    client_ip = (
        request.headers.get('cf-connecting-ip')
        or request.headers.get('x-forwarded-for', '').split(',')[0].strip()
        or (request.client.host if request.client else 'unknown')
    )
    if not check_webhook_rate_limit(client_ip):
        raise HTTPException(429, 'Terlalu banyak permintaan notifikasi pembayaran.')
    raw = bytearray()
    async for chunk in request.stream():
        raw.extend(chunk)
        if len(raw) > 65536:
            raise HTTPException(413, 'Notifikasi terlalu besar.')
    try:
        data = json.loads(raw)
    except (ValueError, UnicodeError):
        raise HTTPException(400, 'Format notifikasi tidak valid.')
    required = ('order_id', 'status_code', 'gross_amount', 'signature_key')
    if not isinstance(data, dict) or any(not isinstance(data.get(k), str) or len(data[k]) > 200 for k in required):
        raise HTTPException(400, 'Notifikasi tidak lengkap.')
    # Run DB + outbound HTTP in the thread pool, not on the ASGI event loop.
    return await run_in_threadpool(process_notification, data)


def process_notification(data):
    with Session() as db:
        order = db.get(PaymentOrder, data['order_id'])
        if not order:
            raise HTTPException(404, 'Transaksi tidak ditemukan.')
        key = server_key(order.environment)
        if not key:
            raise HTTPException(503, 'Konfigurasi verifikasi belum tersedia.')
        expected = hashlib.sha512(''.join([data['order_id'], data['status_code'], data['gross_amount'], key]).encode()).hexdigest()
        if not hmac.compare_digest(expected, data['signature_key']):
            raise HTTPException(403, 'Tanda tangan notifikasi tidak valid.')
    hint = data.get('transaction_id', '')
    if not isinstance(hint, str) or len(hint) > 100 or not all(c.isalnum() or c == '-' for c in hint):
        hint = None
    verify_order(data['order_id'], force=True, transaction_hint=hint)
    return {'ok': True}


def finance_data(env, page):
    with Session() as db:
        base = [PaymentOrder.environment == env]
        orders = db.scalars(select(PaymentOrder).where(*base).order_by(PaymentOrder.created_at.desc(), PaymentOrder.id)
                            .offset((page - 1) * 25).limit(25)).all()
        names = {t.id: t.email for t in db.scalars(select(Teacher).where(Teacher.id.in_([o.teacher_id for o in orders])))}
        cfg = configuration()
        order_list = [{**order_payload(o), 'teacher_email': names.get(o.teacher_id, 'Akun tidak tersedia')} for o in orders]
        paid_amount = db.scalar(select(func.coalesce(func.sum(PaymentOrder.amount), 0)).where(*base, PaymentOrder.status == 'paid'))
        return {
            'setup': cfg,
            'environment': env,
            'page': page,
            'status': 'connected' if cfg['available'] else 'not_connected',
            'currency': 'IDR',
            'revenue': paid_amount if cfg['available'] else None,
            'llm_cost': None,
            'transactions': order_list if cfg['available'] else [],
            'total': db.scalar(select(func.count()).select_from(PaymentOrder).where(*base)),
            'paid_amount': paid_amount,
            'paid_count': db.scalar(select(func.count()).select_from(PaymentOrder).where(*base, PaymentOrder.status == 'paid')),
            'review_count': db.scalar(select(func.count()).select_from(PaymentOrder).where(*base, PaymentOrder.status.in_(('review', 'refund_review', 'creation_unknown')))),
            'orders': order_list,
        }



def build_admin_billing_router(admin):
    routes = APIRouter(prefix='/api/v1/admin', dependencies=[Depends(admin)])

    @routes.get('/finance')
    def finance(env: Literal['sandbox', 'production'] = 'sandbox', page: int = Query(1, ge=1)):
        return finance_data(env, page)

    @routes.post('/finance/orders/{order_id}/verify', dependencies=[Depends(same_origin)])
    def reconcile(order_id: str):
        return verify_order(order_id)

    return routes
