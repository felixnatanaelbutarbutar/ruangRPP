import os
from datetime import datetime, timezone
from pathlib import Path

from sqlalchemy import JSON, DateTime, Integer, String, Text, create_engine
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, sessionmaker


def now():
    return datetime.now(timezone.utc)


DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql+psycopg://ruangrpp:ruangrpp@127.0.0.1:5432/ruangrpp')
if DATABASE_URL.startswith('sqlite') and os.getenv('APP_TESTING') != '1':
    raise RuntimeError('SQLite hanya untuk pengujian terisolasi. Gunakan PostgreSQL.')
engine = create_engine(DATABASE_URL, pool_pre_ping=True)
Session = sessionmaker(engine, expire_on_commit=False)
STORAGE = Path(os.getenv('STORAGE_DIR', './var/uploads')).resolve()


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = 'admin_users'
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    email: Mapped[str] = mapped_column(String(254), unique=True)
    name: Mapped[str] = mapped_column(String(120))
    password_hash: Mapped[str] = mapped_column(Text)
    role: Mapped[str] = mapped_column(String(20), default='collector')


class LoginSession(Base):
    __tablename__ = 'admin_sessions'
    token_hash: Mapped[str] = mapped_column(String(64), primary_key=True)
    user_id: Mapped[str] = mapped_column(String(36))
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))


class Document(Base):
    __tablename__ = 'source_documents'
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    sha256: Mapped[str] = mapped_column(String(64), unique=True)
    filename: Mapped[str] = mapped_column(String(255))
    extension: Mapped[str] = mapped_column(String(10))
    size_bytes: Mapped[int] = mapped_column(Integer)
    metadata_json: Mapped[dict] = mapped_column(JSON)
    extraction: Mapped[dict] = mapped_column(JSON)
    auto_status: Mapped[str] = mapped_column(String(30))
    auto_issues: Mapped[list] = mapped_column(JSON)
    review: Mapped[dict] = mapped_column(JSON, default=dict)
    revision: Mapped[int] = mapped_column(Integer, default=1)
    uploaded_by: Mapped[str] = mapped_column(String(36))
    uploader_name: Mapped[str] = mapped_column(String(120))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)


class Requirement(Base):
    __tablename__ = 'source_requirements'
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    label: Mapped[str] = mapped_column(String(200))
    criteria: Mapped[dict] = mapped_column(JSON)
    note: Mapped[str] = mapped_column(Text, default='')
    applicability: Mapped[str] = mapped_column(String(30), default='unconfirmed')
    created_by: Mapped[str] = mapped_column(String(36))


class Audit(Base):
    __tablename__ = 'source_audit'
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    document_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    actor_name: Mapped[str] = mapped_column(String(120))
    actor_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    action: Mapped[str] = mapped_column(String(200))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)


class ProcessingJob(Base):
    __tablename__ = 'source_processing_jobs'
    document_id: Mapped[str] = mapped_column(String(36), primary_key=True)
    revision: Mapped[int] = mapped_column(Integer)
    status: Mapped[str] = mapped_column(String(20), default='queued', index=True)
    token: Mapped[str] = mapped_column(String(36), default='')
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)


class ModelProfile(Base):
    __tablename__ = 'llm_profiles'
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    provider: Mapped[str] = mapped_column(String(20))
    model: Mapped[str] = mapped_column(String(150))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)


class AdminSetting(Base):
    __tablename__ = 'admin_settings'
    key: Mapped[str] = mapped_column(String(40), primary_key=True)
    value: Mapped[str] = mapped_column(String(150), default='')


class Teacher(Base):
    __tablename__ = 'teacher_accounts'
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    google_sub: Mapped[str] = mapped_column(String(255), unique=True)
    email: Mapped[str] = mapped_column(String(254))
    name: Mapped[str] = mapped_column(String(120))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
    last_login: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)


class TeacherSession(Base):
    __tablename__ = 'teacher_sessions'
    token_hash: Mapped[str] = mapped_column(String(64), primary_key=True)
    teacher_id: Mapped[str] = mapped_column(String(36), index=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))


class GoogleChallenge(Base):
    __tablename__ = 'google_login_challenges'
    binding_hash: Mapped[str] = mapped_column(String(64), primary_key=True)
    nonce_hash: Mapped[str] = mapped_column(String(64))
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)


class PaymentOrder(Base):
    __tablename__ = 'payment_orders'
    id: Mapped[str] = mapped_column(String(50), primary_key=True)
    teacher_id: Mapped[str] = mapped_column(String(36), index=True)
    environment: Mapped[str] = mapped_column(String(15), index=True)
    plan_id: Mapped[str] = mapped_column(String(30))
    plan_name: Mapped[str] = mapped_column(String(80))
    amount: Mapped[int] = mapped_column(Integer)
    credits: Mapped[int] = mapped_column(Integer)
    status: Mapped[str] = mapped_column(String(30), default='creating', index=True)
    provider_status: Mapped[str] = mapped_column(String(40), default='')
    checkout_url: Mapped[str] = mapped_column(Text, default='')
    transaction_id: Mapped[str] = mapped_column(String(100), default='')
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
    checked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class QuotaGrant(Base):
    __tablename__ = 'quota_grants'
    # One immutable grant per order. Refunds suspend it; never create a second grant.
    order_id: Mapped[str] = mapped_column(String(50), primary_key=True)
    teacher_id: Mapped[str] = mapped_column(String(36), index=True)
    environment: Mapped[str] = mapped_column(String(15), index=True)
    credits: Mapped[int] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
    suspended_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class RagIndex(Base):
    __tablename__ = 'rag_indexes'
    document_id: Mapped[str] = mapped_column(String(36), primary_key=True)
    id: Mapped[str] = mapped_column(String(36), unique=True)
    revision: Mapped[int] = mapped_column(Integer)
    status: Mapped[str] = mapped_column(String(20), default='preview', index=True)
    embedding: Mapped[dict] = mapped_column(JSON)
    collection: Mapped[str] = mapped_column(String(100), default='')
    chunk_count: Mapped[int] = mapped_column(Integer)
    error: Mapped[str] = mapped_column(Text, default='')
    retrieval_check: Mapped[dict] = mapped_column(JSON, default=dict)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)


class RagChunk(Base):
    __tablename__ = 'rag_chunks'
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    index_id: Mapped[str] = mapped_column(String(36), index=True)
    ordinal: Mapped[int] = mapped_column(Integer)
    content: Mapped[dict] = mapped_column(JSON)


class LessonDraft(Base):
    __tablename__ = 'lesson_drafts'
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    teacher_id: Mapped[str] = mapped_column(String(36), index=True)
    input_data: Mapped[dict] = mapped_column(JSON)
    result: Mapped[dict] = mapped_column(JSON)
    references: Mapped[list] = mapped_column(JSON)
    model_info: Mapped[dict] = mapped_column(JSON)
    usage: Mapped[dict] = mapped_column(JSON)
    environment: Mapped[str] = mapped_column(String(15))
    credits_used: Mapped[int] = mapped_column(Integer, default=1)
    revision: Mapped[int] = mapped_column(Integer, default=1)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
