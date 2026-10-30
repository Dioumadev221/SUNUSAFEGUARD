"""Modèle de données (CDC §10).

Règle de conception : AUCUNE table ne stocke le contenu des conversations.
Les statistiques (UsageEvent) ne contiennent ni texte, ni identifiant de
session, ni horodatage précis (arrondi à l'heure).
"""
from datetime import datetime, timezone

from sqlalchemy import JSON, Boolean, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class Organization(TimestampMixin, Base):
    __tablename__ = "organizations"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(200), unique=True)
    org_type: Mapped[str] = mapped_column(String(100))
    description: Mapped[str] = mapped_column(Text, default="")
    address: Mapped[str] = mapped_column(String(300), default="")
    region: Mapped[str] = mapped_column(String(100), index=True)
    department: Mapped[str] = mapped_column(String(100), default="")
    phone: Mapped[str] = mapped_column(String(50), default="")
    email: Mapped[str] = mapped_column(String(200), default="")
    domains: Mapped[list] = mapped_column(JSON, default=list)
    publics: Mapped[list] = mapped_column(JSON, default=list)
    services: Mapped[list] = mapped_column(JSON, default=list)
    hours: Mapped[str] = mapped_column(String(200), default="")
    access: Mapped[str] = mapped_column(String(200), default="")
    capacity: Mapped[int] = mapped_column(Integer, default=0)
    availability: Mapped[str] = mapped_column(String(40), default="non_communique")
    validated: Mapped[bool] = mapped_column(Boolean, default=False)
    last_verified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)


class User(TimestampMixin, Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(200), unique=True, index=True)
    full_name: Mapped[str] = mapped_column(String(200))
    password_hash: Mapped[str] = mapped_column(String(300))
    role: Mapped[str] = mapped_column(String(50), index=True)
    organization_id: Mapped[int | None] = mapped_column(ForeignKey("organizations.id"), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    mfa_enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    failed_logins: Mapped[int] = mapped_column(Integer, default=0)
    locked_until: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    last_login_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    organization: Mapped[Organization | None] = relationship()


class ServiceAvailability(TimestampMixin, Base):
    """Historique des disponibilités déclarées (CDC §4.2)."""
    __tablename__ = "service_availability"
    id: Mapped[int] = mapped_column(primary_key=True)
    organization_id: Mapped[int] = mapped_column(ForeignKey("organizations.id"), index=True)
    status: Mapped[str] = mapped_column(String(40))
    capacity: Mapped[int] = mapped_column(Integer, default=0)
    note: Mapped[str] = mapped_column(String(300), default="")
    updated_by_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)


class ReferralRequest(TimestampMixin, Base):
    """Demande d'orientation minimisée (CDC §4.3). `public_code` est aléatoire et
    non corrélé à une identité ; les coordonnées éventuelles sont chiffrées."""
    __tablename__ = "referral_requests"
    id: Mapped[int] = mapped_column(primary_key=True)
    public_code: Mapped[str] = mapped_column(String(40), unique=True, index=True)
    organization_id: Mapped[int] = mapped_column(ForeignKey("organizations.id"), index=True)
    category: Mapped[str] = mapped_column(String(60))
    region: Mapped[str] = mapped_column(String(100), default="")
    status: Mapped[str] = mapped_column(String(40), default="en_attente_consentement")
    consent_given: Mapped[bool] = mapped_column(Boolean, default=False)
    contact_encrypted: Mapped[str] = mapped_column(Text, default="")
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)
    organization: Mapped[Organization] = relationship()
    events: Mapped[list["ReferralEvent"]] = relationship(back_populates="referral", order_by="ReferralEvent.id")


class ReferralEvent(TimestampMixin, Base):
    __tablename__ = "referral_events"
    id: Mapped[int] = mapped_column(primary_key=True)
    referral_id: Mapped[int] = mapped_column(ForeignKey("referral_requests.id"), index=True)
    status: Mapped[str] = mapped_column(String(40))
    actor_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    note: Mapped[str] = mapped_column(String(300), default="")
    referral: Mapped[ReferralRequest] = relationship(back_populates="events")


class KnowledgeDocument(TimestampMixin, Base):
    __tablename__ = "knowledge_documents"
    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(300))
    source: Mapped[str] = mapped_column(String(300), default="")
    doc_type: Mapped[str] = mapped_column(String(50), default="fiche")
    category: Mapped[str] = mapped_column(String(60), index=True)
    language: Mapped[str] = mapped_column(String(10), default="fr")
    status: Mapped[str] = mapped_column(String(30), default="importe", index=True)
    version: Mapped[int] = mapped_column(Integer, default=1)
    filename: Mapped[str] = mapped_column(String(300), default="")
    content: Mapped[str] = mapped_column(Text, default="")
    index_status: Mapped[str] = mapped_column(String(30), default="non_indexe")
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    verified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_by_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)
    chunks: Mapped[list["KnowledgeChunk"]] = relationship(back_populates="document", cascade="all, delete-orphan")


class KnowledgeVersion(TimestampMixin, Base):
    __tablename__ = "knowledge_versions"
    id: Mapped[int] = mapped_column(primary_key=True)
    document_id: Mapped[int] = mapped_column(ForeignKey("knowledge_documents.id"), index=True)
    version: Mapped[int] = mapped_column(Integer)
    content: Mapped[str] = mapped_column(Text)
    author_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)


class KnowledgeChunk(Base):
    """Segment indexé. `embedding` est stocké en JSON pour rester portable
    SQLite/PostgreSQL ; voir docs/database pour la migration pgvector."""
    __tablename__ = "knowledge_chunks"
    id: Mapped[int] = mapped_column(primary_key=True)
    document_id: Mapped[int] = mapped_column(ForeignKey("knowledge_documents.id"), index=True)
    position: Mapped[int] = mapped_column(Integer)
    section: Mapped[str] = mapped_column(String(300), default="")
    text: Mapped[str] = mapped_column(Text)
    embedding: Mapped[list] = mapped_column(JSON)
    embedder: Mapped[str] = mapped_column(String(80))
    document: Mapped[KnowledgeDocument] = relationship(back_populates="chunks")


class KnowledgeReview(TimestampMixin, Base):
    __tablename__ = "knowledge_reviews"
    id: Mapped[int] = mapped_column(primary_key=True)
    document_id: Mapped[int] = mapped_column(ForeignKey("knowledge_documents.id"), index=True)
    reviewer_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    decision: Mapped[str] = mapped_column(String(30))
    comment: Mapped[str] = mapped_column(Text, default="")


class RAGEvaluation(TimestampMixin, Base):
    __tablename__ = "rag_evaluations"
    id: Mapped[int] = mapped_column(primary_key=True)
    config: Mapped[dict] = mapped_column(JSON)
    recall_at_k: Mapped[float] = mapped_column(Float)
    mrr: Mapped[float] = mapped_column(Float)
    results: Mapped[dict] = mapped_column(JSON)


class AIModelConfiguration(TimestampMixin, Base):
    __tablename__ = "ai_model_configurations"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100))
    provider: Mapped[str] = mapped_column(String(50))
    model: Mapped[str] = mapped_column(String(100))
    params: Mapped[dict] = mapped_column(JSON, default=dict)
    active: Mapped[bool] = mapped_column(Boolean, default=False)


class SafetyRule(TimestampMixin, Base):
    """Registre des versions de règles de sécurité (les règles elles-mêmes sont
    déterministes et versionnées dans ai-engine/safety)."""
    __tablename__ = "safety_rules"
    id: Mapped[int] = mapped_column(primary_key=True)
    version: Mapped[str] = mapped_column(String(50))
    description: Mapped[str] = mapped_column(Text)
    changed_by_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)


class SecurityEvent(TimestampMixin, Base):
    """Événement technique/sécurité. Ne contient JAMAIS le texte de l'utilisateur."""
    __tablename__ = "security_events"
    id: Mapped[int] = mapped_column(primary_key=True)
    kind: Mapped[str] = mapped_column(String(50), index=True)
    severity: Mapped[str] = mapped_column(String(20), default="info")
    rule: Mapped[str] = mapped_column(String(200), default="")
    details: Mapped[dict] = mapped_column(JSON, default=dict)


class UsageEvent(Base):
    """Événement d'usage anonyme, base des indicateurs agrégés (Sunu Impact)."""
    __tablename__ = "usage_events"
    id: Mapped[int] = mapped_column(primary_key=True)
    hour: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    channel: Mapped[str] = mapped_column(String(20), default="web")
    language: Mapped[str] = mapped_column(String(10))
    category: Mapped[str] = mapped_column(String(60), index=True)
    region: Mapped[str] = mapped_column(String(100), default="non_renseignee")
    safety_action: Mapped[str] = mapped_column(String(40))
    grounded: Mapped[bool] = mapped_column(Boolean)
    used_llm: Mapped[bool] = mapped_column(Boolean, default=False)
    top_score: Mapped[float] = mapped_column(Float)
    latency_ms: Mapped[float] = mapped_column(Float)
    directory_suggested: Mapped[bool] = mapped_column(Boolean, default=False)


class AggregateMetric(TimestampMixin, Base):
    __tablename__ = "aggregate_metrics"
    id: Mapped[int] = mapped_column(primary_key=True)
    period: Mapped[str] = mapped_column(String(20))
    name: Mapped[str] = mapped_column(String(100))
    dimension: Mapped[str] = mapped_column(String(100), default="")
    value: Mapped[float] = mapped_column(Float)


class Report(TimestampMixin, Base):
    __tablename__ = "reports"
    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(200))
    period_start: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    period_end: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    format: Mapped[str] = mapped_column(String(10))
    created_by_id: Mapped[int] = mapped_column(ForeignKey("users.id"))


class AuditLog(TimestampMixin, Base):
    __tablename__ = "audit_logs"
    id: Mapped[int] = mapped_column(primary_key=True)
    actor_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    action: Mapped[str] = mapped_column(String(100), index=True)
    target: Mapped[str] = mapped_column(String(200), default="")
    details: Mapped[dict] = mapped_column(JSON, default=dict)
