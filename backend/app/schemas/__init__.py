from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ORM(BaseModel):
    model_config = ConfigDict(from_attributes=True)


# --- Auth -------------------------------------------------------------------------
class LoginIn(BaseModel):
    email: str = Field(max_length=200)
    password: str


class UserOut(ORM):
    id: int
    email: str
    full_name: str
    role: str
    organization_id: int | None
    is_active: bool
    dashboards: list[str] = []


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserOut


# --- Chat -------------------------------------------------------------------------
class ChatIn(BaseModel):
    message: str = Field(min_length=1, max_length=2000)
    channel: str = Field(default="web", pattern="^(web|pwa|voix)$")
    region: str | None = Field(default=None, max_length=100)


class Source(BaseModel):
    ref: int
    document_id: int
    title: str | None
    source: str | None
    section: str | None
    score: float


class ChatOut(BaseModel):
    answer: str
    language: str
    category: str
    sources: list[Source]
    grounded: bool
    show_emergency: bool
    suggest_directory: bool
    safety_action: str
    disclaimer: str


# --- Annuaire ---------------------------------------------------------------------
AVAILABILITY = ["disponible", "capacite_limitee", "sature", "information_non_actualisee", "non_communique"]


class OrganizationBase(BaseModel):
    name: str
    org_type: str
    description: str = ""
    address: str = ""
    region: str
    department: str = ""
    phone: str = ""
    email: str = ""
    domains: list[str] = []
    publics: list[str] = []
    services: list[str] = []
    hours: str = ""
    access: str = ""


class OrganizationIn(OrganizationBase):
    pass


class OrganizationOut(OrganizationBase, ORM):
    id: int
    capacity: int
    availability: str
    validated: bool
    last_verified_at: datetime | None
    updated_at: datetime


class AvailabilityIn(BaseModel):
    status: str = Field(pattern="^(" + "|".join(AVAILABILITY) + ")$")
    capacity: int = Field(default=0, ge=0, le=10000)
    note: str = Field(default="", max_length=300)


# --- Orientations -----------------------------------------------------------------
REFERRAL_STATUSES = ["brouillon", "en_attente_consentement", "transmise", "recue", "en_cours",
                     "prise_en_charge_confirmee", "non_prise_en_charge", "cloturee", "annulee"]


class ReferralIn(BaseModel):
    organization_id: int
    category: str = Field(max_length=60)
    region: str = Field(default="", max_length=100)
    consent: bool
    contact: str = Field(default="", max_length=300, description="Moyen de recontact choisi (chiffré)")


class ReferralCreated(BaseModel):
    public_code: str
    status: str
    message: str


class ReferralStatusIn(BaseModel):
    status: str = Field(pattern="^(" + "|".join(REFERRAL_STATUSES) + ")$")
    note: str = Field(default="", max_length=300)


# --- Connaissances ----------------------------------------------------------------
class DocumentOut(ORM):
    id: int
    title: str
    source: str
    doc_type: str
    category: str
    language: str
    status: str
    version: int
    filename: str
    index_status: str
    published_at: datetime | None
    verified_at: datetime | None
    expires_at: datetime | None
    created_at: datetime
    updated_at: datetime
    chunk_count: int = 0


class DocumentStatusIn(BaseModel):
    status: str
    comment: str = Field(default="", max_length=2000)


class PlaygroundIn(BaseModel):
    question: str = Field(min_length=1, max_length=1000)
    top_k: int = Field(default=4, ge=1, le=10)
    min_score: float = Field(default=0.0, ge=0, le=1)
    generate: bool = True
