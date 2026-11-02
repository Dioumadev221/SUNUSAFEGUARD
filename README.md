<div align="center">

# SunuSafeguard AI

**An intelligent platform for psychosocial support, referral and protection**

Caring support in French and Wolof · Referral to support organizations · Anonymous impact monitoring

Built by **GREEN T SARL**, Senegal

[Français](README.fr.md) · **English**

![Python](https://img.shields.io/badge/Python-3.11+-3776AB?logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
![Expo](https://img.shields.io/badge/Expo-SDK%2058-000020?logo=expo&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)
![Version](https://img.shields.io/badge/version-1.0-2ea44f)

</div>

---

## Table of contents

1. [Overview](#overview)
2. [Why SunuSafeguard](#why-sunusafeguard)
3. [The concept](#the-concept)
4. [Research and design](#research-and-design)
5. [Features](#features)
6. [Architecture](#architecture)
7. [How the assistant works](#how-the-assistant-works)
8. [User guide](#user-guide)
9. [Roles and access](#roles-and-access)
10. [Security and privacy](#security-and-privacy)
11. [Installation](#installation)
12. [Configuration](#configuration)
13. [Test accounts](#test-accounts)
14. [API](#api)
15. [Development](#development)
16. [Test results](#test-results)
17. [Testing](#testing)
18. [Deployment](#deployment)
19. [Repository structure](#repository-structure)
20. [Roadmap](#roadmap)
21. [Operational best practices](#operational-best-practices)
22. [Further documentation](#further-documentation)

---

## Overview

Many women and girls in Senegal face violence, psychological distress or emergencies without knowing
who to talk to or where to turn. SunuSafeguard AI brings together, in one platform:

- **a conversational assistant** available day and night, in French and Wolof, that listens without
  judgment, gives reliable information with its sources, and recognizes emergencies;
- **a directory of support organizations** (listening centers, legal aid, shelters, health services)
  with a consent-based referral process;
- **professional dashboards** for partner organizations, content experts, institutions and the
  technical team.

The platform is built on six principles:

| Principle | In practice |
|---|---|
| Safety first | Emergency rules are deterministic and always take priority over the AI. |
| No conversation stored | Messages are never saved, neither in the database nor in the logs. |
| No diagnosis, no false promise | A final check replaces any answer that crosses these lines. |
| Always sourced | The assistant only answers from documents validated by experts, and cites them. |
| Explicit consent | Nothing is sent to an organization without the person's clear agreement. |
| Sovereign AI | The language model and speech recognition run locally, with no paid third-party service. |

---

## Why SunuSafeguard

### The problem

In Senegal, many women, adolescent girls and vulnerable people face domestic violence, economic
violence, cyberbullying, psychological distress or situations of danger. Help exists (listening
centers, legal aid offices, shelters, health and social services), but it is hard to reach:

- people often **do not know which organization can help them**, where it is, or whether it is
  available;
- speaking about violence or distress is difficult, and **fear of being judged or exposed** stops
  many people from asking;
- reliable information on rights, protection and well-being is **scattered** and rarely available
  in Wolof, the language most people speak every day;
- organizations work in silos, and institutions **lack reliable figures** on needs, regions and
  response times to guide their decisions.

### The answer

SunuSafeguard AI is a single entry point that anyone can open on a phone, at any hour, without giving
their name. It listens, informs from validated sources, recognizes emergencies, and connects the
person with a human organization when she wants it. Behind this entry point, it gives the network of
professionals the tools to keep information reliable, coordinate referrals and measure impact
without ever exposing the people they serve.

### Who it is for

| Audience | What they need | What SunuSafeguard gives them |
|---|---|---|
| Women, adolescent girls, vulnerable people | A safe, discreet place to talk and find help | Assistant in French and Wolof, directory, consent-based referral, quick exit, discreet mode |
| Partner organizations | Requests they can act on, and an up-to-date profile | Sunu Orientation: profile, availability, incoming requests, team |
| Lawyers, psychologists, linguists | Control over what the assistant says | Sunu Ressources: document validation, testing, gap analysis |
| Institutions and funders | Reliable, anonymous figures | Sunu Impact: indicators, regional map, reports |
| GREEN T technical team | A reliable and secure platform | Sunu Tech: AI quality, security, audit, accounts |

### What SunuSafeguard is not

SunuSafeguard does not replace doctors, psychologists, social workers or the authorities. It never
makes a diagnosis, never prescribes, and never reports anyone on its own initiative. It is a
complementary tool for information, first orientation and access to human services.

---

## The concept

### The name

*Sunu* means "our" in Wolof. *Safeguard* means protection. **SunuSafeguard** is "our protection": a
tool built in Senegal, for people in Senegal, with the organizations that already protect them.

### One platform, five spaces

| Space | Purpose |
|---|---|
| **Public space** (website and mobile app) | Listen, inform, orient. Open to everyone, no account required. |
| **Sunu Impact** | Understand needs and trends to support institutional decisions. |
| **Sunu Orientation** | Coordinate referrals with the network of human organizations. |
| **Sunu Ressources** | Keep control over the quality of the knowledge used by the AI. |
| **Sunu Tech** | Guarantee the performance, security and reliability of the platform. |

Each space has its own users, permissions and data. They share one technical foundation and one
visual identity.

### Design principles

| Principle | Meaning in SunuSafeguard |
|---|---|
| Safety by design | Every user journey is designed around the person's safety: quick exit, discreet mode, emergency rules that always win. |
| Privacy by design | Data minimization: no conversation stored, no account required, anonymous statistics only. |
| Human-centered AI | The AI supports people and professionals without replacing their judgment. |
| Human in the loop | Situations that require a person are routed to human organizations, with consent. |
| Evidence-based knowledge | Answers rely on documents validated by experts, with their sources shown. |
| Digital inclusion | Mobile-first, plain language, French and Wolof, voice input, works on slow connections. |
| Accountability | Every administrative action is traced in an audit log. |

---

## Research and design

### Reference documents

The platform was designed from two specifications written for the project:

| Document | Content |
|---|---|
| **Functional and technical specification** (19 chapters) | Context and vision, the four dashboards view by view, the public space, roles and permissions, AI and RAG architecture, multilingual architecture, data model, security and protection of people, non-functional requirements, API, acceptance criteria, governance |
| **Mobile app specification** | The five mobile spaces (Listen, Answer, Resources, Session, Discreet), on-device privacy rules, voice, offline use |

Every requirement of these specifications is traced in the code and documentation (references such
as "CDC §9.2" in the source code point to the matching chapter).

### Design choices and the reasons behind them

| Choice | Reason |
|---|---|
| **No account needed** to use the assistant or the directory | A person in danger must be able to ask for help without leaving an identity. An account is optional, only to follow requests from several devices. |
| **No conversation stored** | Protects people if a device or the server is ever compromised, and builds trust. |
| **Deterministic emergency rules** before the AI | An emergency must never depend on the mood of a language model. Rules are predictable and testable. |
| **Answers only from validated documents** | Prevents invented information on sensitive subjects such as law, health and violence. |
| **Local, open-source AI** (Ollama, Whisper) | No paid service, no message sent to a foreign provider, and full control over the data. |
| **Extractive fallback** | The assistant keeps working even if the language model stops. |
| **Wolof handled honestly** | Small open models do not write reliable Wolof yet. The assistant understands Wolof questions and answers in plain French opened by a validated Wolof sentence, rather than producing incorrect Wolof. |
| **Quick exit and discreet mode** | Someone may be watched. One tap hides everything; the mobile app turns into a working calculator. |
| **Consent before referral, encrypted contact details** | The person stays in control of what is shared, with whom, and for how long. |
| **Publication threshold N ≥ 5** | Prevents anyone from being identified through statistics in a small region. |
| **Server-side permissions** | Security cannot depend on what the interface shows. |

### Visual identity

The "Teranga" design system (from the Senegalese value of hospitality) aims for a safe, welcoming and
institutional place:

- a night-blue, warm-sand and teal palette, with ochre for warmth and red reserved **only** for quick
  exit and emergency numbers;
- Fraunces for titles and Plus Jakarta Sans for text, embedded so that no third-party resource is
  loaded;
- a logo showing a heart where the sun rises over the sea, and arch shapes evoking the door of a home
  (*kër*);
- dark mode by default, which is more discreet on a phone.

The full charter is in [`docs/user-guides/charte-ui.md`](docs/user-guides/charte-ui.md).

### Content and directory

- The knowledge base covers psychosocial support, domestic violence and rights, cyberbullying,
  economic violence, shelter, reproductive health, stress, supporting a loved one, suicidal thoughts,
  resources in Senegal and confidentiality.
- The directory includes real Senegalese organizations, among them AJS Grand-Yoff, Maison Rose
  (Guédiawaye), La Palabre (Thiès), CLVF (Kédougou) and CEGID. Their contact details are checked with
  each organization before they are connected to the referral service.

### Governance

| Area | Responsibility |
|---|---|
| Architecture and development | GREEN T SARL |
| Infrastructure and cybersecurity | GREEN T technical team |
| Content governance | Authorized experts |
| Psychosocial validation | Qualified professionals |
| Legal validation | Legal experts |
| Linguistic validation | French and Wolof specialists |
| Organization profiles | Partner organizations |
| Protection of people | Authorized managers and professionals |

---

## Features

| Component | What it offers |
|---|---|
| **Public website** | Conversational assistant (French / Wolof), directory of organizations, consent-based referral, request tracking by code, privacy page, Quick exit button, installable on a phone (PWA) |
| **Mobile app "Sunu"** | Android and iOS app with voice input, answers, resources, request tracking and a discreet mode disguised as a calculator |
| **Sunu Impact** | Anonymous indicators, trends, needs, languages, regional map, PDF and Excel reports |
| **Sunu Orientation** | Organization profiles, availability, incoming referral requests, response times, team management |
| **Sunu Ressources** | Document import, expert validation workflow, publication, assistant testing, evaluation |
| **Sunu Tech** | AI quality and performance, service health, security events, audit log, accounts, data purge |
| **Security** | Role-based access enforced by the server, two-factor authentication, account lockout, rate limiting, encryption of referral data, automatic data purge |
| **Speech recognition** | Local Whisper models for French and Wolof; audio is never written to disk |

---

## Architecture

```mermaid
flowchart TB
    subgraph CLIENTS["Clients"]
        direction LR
        WEB["Website / PWA<br/>React"]
        MOB["Mobile app Sunu<br/>Expo / React Native"]
        PRO["Professional dashboards<br/>Impact · Orientation · Ressources · Tech"]
    end

    subgraph SERVER["Server"]
        NGINX["Nginx<br/>website + /api proxy"]
        API["FastAPI backend<br/>authentication · access control<br/>business services"]
        AI["AI engine<br/>safety rules · document retrieval<br/>answer generation · speech"]
        OLLAMA["Ollama<br/>local language model"]
        DB[("PostgreSQL<br/>organizations · referrals<br/>documents · anonymous statistics")]
    end

    WEB --> NGINX
    PRO --> NGINX
    MOB --> API
    NGINX --> API
    API --> AI
    AI --> OLLAMA
    API --> DB
    AI --> DB
```

| Component | Role | Location |
|---|---|---|
| Website | Public interface and professional dashboards | `frontend/` |
| Mobile app | Android / iOS app connected to the same API | `frontend/mobile/` |
| Backend | REST API, authentication, permissions, business logic | `backend/` |
| AI engine | Language detection, safety rules, document retrieval, generation, speech recognition | `ai-engine/` |
| Language model | Local Ollama server (`qwen2.5:3b` for answers, `paraphrase-multilingual` for search) | external service |
| Database | PostgreSQL in production, SQLite for local development | `backend/migrations/` |

Access control is always enforced by the API: the interface hides what a user is not allowed to
see, and the server refuses any unauthorized request.

---

## How the assistant works

Every message goes through the same chain of checks before an answer is shown.

```mermaid
flowchart TD
    IN(["Message"]) --> LANG["1. Language detection<br/>French or Wolof"]
    LANG --> SAFE{"2. Safety check"}
    SAFE -->|"Emergency"| URG["Emergency message<br/>and emergency numbers first"]
    SAFE -->|"Out of scope or<br/>manipulation attempt"| FIX["Fixed safe answer"]
    SAFE -->|"Allowed"| SEARCH
    URG --> SEARCH["3. Search in validated documents"]
    SEARCH --> FOUND{"Relevant sources?"}
    FOUND -->|"No"| NONE["Honest answer<br/>and link to the directory"]
    FOUND -->|"Yes"| GEN["4. Answer written from the sources<br/>with references [1], [2]"]
    GEN --> CHECK{"5. Final check"}
    CHECK -->|"Diagnosis, false promise,<br/>trivialization"| SAFEANS["Replaced by a safe answer"]
    CHECK -->|"Compliant"| OUT
    SAFEANS --> OUT
    NONE --> OUT
    FIX --> OUT
    OUT(["Answer + sources<br/>+ directory suggestion"])
```

| Step | What happens |
|---|---|
| Language detection | The message is identified as French or Wolof. Wolof questions are enriched with a lexicon to improve search. |
| Safety check | Deterministic rules detect emergencies (including when someone else is in danger), manipulation attempts, out-of-scope requests and diagnosis requests. Emergencies always come first. |
| Document search | Hybrid search: 75 % meaning, 25 % keywords. Only documents **published** by experts are used. |
| Answer | The local model writes an answer from the sources found. If the model is unavailable, the assistant answers with extracts from the documents, so it never stops working. |
| Final check | Any answer that would make a diagnosis, promise absolute confidentiality, trivialize violence or claim a report was filed is replaced. |

The message text is never stored. Only anonymous statistics are kept: language, category of need,
self-reported region, channel and rounded hour.

---

## User guide

### For people seeking help (website)

**Talk to the assistant**

1. Open the website and click **"Essayer maintenant"** (Try now), or go to the chat page.
2. Type your message in French or Wolof. No name or personal information is required.
3. Read the answer and its sources. If the situation is urgent, emergency numbers appear at the top.
4. The conversation is kept only in your browser and disappears when you close the tab.

**Find an organization**

1. Open the directory (**"Voir les structures"**).
2. Filter by region (**"Toutes les régions"**) and by type of need (**"Type de besoin"**).
3. Open an organization to see its services, hours, access conditions and availability.
4. Use **"Appeler"** (Call) to contact it directly.

**Ask to be contacted by an organization**

1. On an organization's card, choose **"Être rappelée"** (Ask for a callback). This button appears
   for organizations that receive requests through the platform.
2. Read what will be shared, enter a safe way to reach you, and give your consent.
3. Click **"Transmettre"** (Send). A tracking code such as `SSG-XXXXXXXX` is displayed: keep it.
4. Later, use **"Suivre avec votre code"** (Track with your code) to see the progress of your request.

**Leave quickly**

The red **Quick exit** button is on every page. It can also be triggered by pressing **Esc twice**.
It clears the conversation and replaces the page with a neutral website, without leaving a trace in
the browser history.

### For people seeking help (mobile app "Sunu")

| Screen | How to use it |
|---|---|
| **Home** | Access the assistant, the directory, topics and emergency numbers. |
| **Sunu Écoute** (Listen) | Press the microphone, speak in French or Wolof, check the recognized text, then send it. |
| **Sunu Ressources** | Search the directory by region, department or need; call an organization; the directory also works offline. |
| **Referral** | Choose what to share, give consent, receive a tracking code. |
| **Sunu Session** | Follow your requests, and use **"Effacer toute trace"** (Erase all traces) to clear everything stored on the phone. |
| **Sunu Discret** | The **"Sortir"** (Exit) button turns the app into a working calculator. To come back, type your code followed by **"="** (default code `1234`). |

### For professionals

**Sign in**

1. Go to the **"Espace pro"** page (`/pro`) and sign in with your professional email and password.
2. If two-factor authentication is enabled on your account, enter the 6-digit code from your
   authenticator app.
3. On first sign-in with a temporary password, you are asked to choose a new one.
4. You only see the dashboards your role allows. Sign out with **"Se déconnecter"**.

**Enable two-factor authentication** (required for super administrators and technical administrators)

1. Open **"Mon compte"** (My account), section **"Double authentification"**.
2. Click **"Configurer"** and scan the QR code with an authenticator app (Google Authenticator,
   Microsoft Authenticator, etc.).
3. Enter the code shown by the app and click **"Activer"**.

**Manage the directory and referrals** (Sunu Orientation)

| Task | Procedure |
|---|---|
| Add an organization | **"Nouvelle structure"** → fill in name, region, department, contact, services, hours → **"Enregistrer"**. A new organization stays hidden from the public until it is validated. |
| Validate an organization | Open the organization → **"Valider"**. It then appears in the public directory. |
| Update availability | Open the organization → set availability and capacity → save. Every change is kept in the history. |
| Handle a referral request | Open the request list → open a request → update its status step by step (received, in progress, support confirmed or not, closed). The person sees each update with their tracking code. |
| Watch delays | The dashboard shows median response times and alerts for requests not received after 24 hours. |

**Manage the assistant's knowledge** (Sunu Ressources)

1. Click **"Importer un document"**, choose a PDF, DOCX, TXT or MD file (10 MB maximum), fill in
   title, category, language and source, then **"Importer et indexer"**.
2. The document moves through the review steps: to check, under review, validated.
3. Once **published**, it is immediately used by the assistant. Unpublished documents are never used.
4. Use the test area (**"Tester"**) to ask a question and see which extracts the assistant would use.
5. Use **"Lancer l'évaluation"** to measure search quality on the reference question set, and the
   gaps view to find topics the documents do not cover.

**Follow the impact** (Sunu Impact)

1. Choose the period and granularity to see interactions, needs, languages, channels and the
   regional map.
2. Click **"Générer un rapport d'impact"**, then download the **"Rapport PDF"** or the
   **"Données Excel"**.
3. Any figure based on fewer than 5 cases is hidden to protect anonymity.

**Supervise the platform** (Sunu Tech)

| Task | Procedure |
|---|---|
| Check service health | **"État des services"**: database, AI engine, speech recognition, CPU and memory. |
| Check the AI engine | View the mode (hybrid or lexical), model, relevance threshold and response times. **"Reconnecter"** restarts the connection to the language model. |
| Review security | Emergency escalations, manipulation attempts, failed logins, locked accounts. |
| Read the audit log | **"Journal d'administration"** lists every administrative action. |
| Purge data | **"Lancer la purge maintenant"** applies the retention policy immediately (it also runs automatically every 24 hours). |

**Manage accounts** (super administrator, or partner manager for their own team)

1. Open **"Comptes & accès"** (or **"Équipe & comptes"** for a partner manager).
2. Enter the full name, professional email and role, then **"Créer le compte"**. A temporary password
   is displayed once: send it to the person through a secure channel.
3. Use **"Désactiver"** / **"Réactiver"** to suspend or restore access, and the reset action to issue
   a new temporary password.

---

## Roles and access

The platform is built around three main profiles:

| Profile | Role | Access |
|---|---|---|
| **User** | `utilisateur` | Assistant, directory, own referral requests. Created by public sign-up. No access to any dashboard. |
| **Operations administrator** | `admin_operationnel` | Sunu Impact, Sunu Orientation and Sunu Ressources, for all organizations. No account management, no technical supervision. |
| **GREEN T super administrator** | `super_admin` | Full access: all dashboards, accounts and roles, technical configuration, supervision. |

Finer-grained roles are also available:

| Role | Dashboard |
|---|---|
| Technical administrator (`admin_technique`) | Sunu Tech |
| Institutional manager, Analyst | Sunu Impact |
| Partner manager, Social worker | Sunu Orientation, limited to their own organization |
| Document expert, Linguistic expert | Sunu Ressources |

The full permission matrix is in [`backend/app/core/permissions.py`](backend/app/core/permissions.py).

---

## Security and privacy

| Commitment | How it is guaranteed |
|---|---|
| Conversations are never stored | No table stores message text; the history lives only in the browser or the phone's memory. |
| Anonymous statistics | Only language, need category, self-reported region, channel and rounded hour are recorded. Figures under 5 cases are never published. |
| Consent before any referral | The API refuses a referral request without explicit consent. |
| Protected contact details | Encrypted (Fernet) and erased as soon as the request is closed. |
| Partner isolation | Each organization only sees its own requests, enforced by the server. |
| Secure access | Hashed passwords, 15-minute lockout after 5 failures, rate limiting, two-factor authentication for privileged accounts, token revocation on logout. |
| No automatic reporting | The platform never contacts anyone on the person's behalf. |
| Limited retention | Automatic daily purge: usage 395 days, security events 180 days, audit 730 days, referrals 365 days (configurable). |
| Hardened HTTP | `nosniff`, `X-Frame-Options: DENY`, `no-referrer`, `Cache-Control: no-store`; no request bodies in the logs. |
| Discretion on the phone | Encrypted local storage, screen hidden in recent apps, screenshots blocked on Android, microphone as the only permission. |

Each of these commitments is covered by automated tests (see [Testing](#testing)).

---

## Installation

### Prerequisites

| Tool | Version | Required |
|---|---|---|
| Python | 3.11 or later | Yes |
| Node.js | 20 or later | Yes |
| Ollama | recent | Recommended. Without it, the assistant answers with document extracts. |
| Docker and Docker Compose | recent | Only for the full stack |

### Local installation (Windows)

```powershell
git clone https://github.com/Dioumadev221/SUNUSAFEGUARD.git
cd SUNUSAFEGUARD
copy .env.example .env
.\scripts\dev.ps1
```

### Local installation (Linux, macOS, WSL)

```bash
git clone https://github.com/Dioumadev221/SUNUSAFEGUARD.git
cd SUNUSAFEGUARD
cp .env.example .env
make install     # once
make backend     # terminal 1: API on http://localhost:8000 (docs: /api/docs)
make frontend    # terminal 2: website on http://localhost:5173
```

On first startup, a local database is created with sample organizations, documents and accounts.

### Full stack with Docker

```bash
cp .env.example .env            # change JWT_SECRET, DATA_ENCRYPTION_KEY and passwords
docker compose up -d --build    # website on http://localhost:8080
```

This starts the website, the API, PostgreSQL, Redis and Ollama. Add
`docker compose --profile monitoring up -d` for Prometheus (port 9090) and Grafana (port 3000).

### Enable the language model

1. Install Ollama (Windows: `winget install Ollama.Ollama`).
2. Start the backend. The required models (`qwen2.5:3b`, about 2 GB, and `paraphrase-multilingual`,
   about 0.6 GB) are downloaded automatically in the background.
3. Check the status with `python -m app.cli ai-status` from the `backend/` folder, or in Sunu Tech.

### Enable speech recognition (optional)

```bash
cd backend
pip install --index-url https://download.pytorch.org/whl/cpu torch
pip install -r requirements-voice.txt
```

The Whisper models (about 1 GB) are downloaded on first use.

### Run the mobile app

```powershell
.\scripts\dev-mobile.ps1
```

Then open the Expo Go app on a phone connected to the same Wi-Fi network. Building an Android APK is
described in [`frontend/mobile/README.md`](frontend/mobile/README.md).

### Useful commands

| Command | Effect |
|---|---|
| `make test` | Runs all backend and AI tests, then checks the website code |
| `make eval` | Measures search quality on the reference question set |
| `make seed` | Reloads the sample data |
| `python -m app.cli import-orgs <file> --hide-demo` | Imports real organizations and hides the sample ones |

---

## Configuration

Configuration is done through environment variables in the `.env` file (template:
[`.env.example`](.env.example)). The `.env` file must never be committed.

| Variable | Default | Purpose |
|---|---|---|
| `ENVIRONMENT` | `development` | `development` creates the tables and sample data automatically |
| `DATABASE_URL` | local SQLite | PostgreSQL connection string in production |
| `JWT_SECRET` | must be changed | Secret used to sign sessions |
| `DATA_ENCRYPTION_KEY` | empty | Encryption key for referral contact details |
| `OLLAMA_URL` | `http://127.0.0.1:11434` | Address of the language model server |
| `OLLAMA_MODEL` | `qwen2.5:3b` | Model used to write answers |
| `EMBEDDING_MODEL` | `paraphrase-multilingual` | Model used for search |
| `K_ANONYMITY_THRESHOLD` | `5` | Minimum number of cases before a figure is published |
| `RETENTION_*_DAYS` | 395 / 180 / 730 / 365 | Retention periods |
| `RATE_LIMIT_CHAT`, `RATE_LIMIT_LOGIN` | `30/60`, `10/60` | Requests allowed per time window |
| `REFERRAL_ALERT_HOURS` | `24` | Delay before a non-receipt alert |

Generate an encryption key:

```bash
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

---

## Test accounts

These accounts are created automatically in development and test environments. Shared password:
`SunuDemo2026!` (variable `DEMO_PASSWORD`).

| Email | Profile |
|---|---|
| `superadmin@sunusafeguard.local` | GREEN T super administrator |
| `operationnel@sunusafeguard.local` | Operations administrator |
| `utilisateur@sunusafeguard.local` | User |
| `utilisateur2@sunusafeguard.local` | User |
| `tech@sunusafeguard.local` | Technical administrator |
| `impact@sunusafeguard.local`, `analyste@sunusafeguard.local` | Institutional manager, Analyst |
| `partenaire@sunusafeguard.local`, `social@sunusafeguard.local` | Partner manager, Social worker |
| `expert@sunusafeguard.local`, `linguiste@sunusafeguard.local` | Document expert, Linguistic expert |

---

## API

The full interactive documentation is available at **http://localhost:8000/api/docs**.

| Group | Main routes | Access |
|---|---|---|
| Authentication | `POST /api/auth/login`, `/register`, `/logout`, `/mfa/verify`, `GET /api/auth/me` | public / signed in |
| Chat | `POST /api/chat`, `GET /api/emergency-contacts` | public |
| Voice | `POST /api/voice/transcribe` | public |
| Directory | `GET /api/directory`, `POST` / `PUT /api/directory`, `POST /api/directory/{id}/availability` | public / organizations |
| Referrals | `POST /api/referrals`, `GET /api/referrals/status/{code}`, `GET /api/referrals/mine`, `PATCH /api/referrals/{id}` | public / user / organization |
| Knowledge | `GET` / `POST /api/knowledge/documents`, `PATCH /api/knowledge/documents/{id}/status` | experts |
| Metrics and reports | `GET /api/metrics/overview`, `GET /api/reports/export` | Sunu Impact |
| Accounts | `GET` / `POST /api/users`, `PATCH /api/users/{id}` | administrators |
| Monitoring | `GET /api/health`, `GET /api/monitoring/services`, `GET /api/audit`, `GET /metrics` | Sunu Tech |

Example:

```bash
curl -X POST http://localhost:8000/api/chat \
     -H "Content-Type: application/json" \
     -d '{"message": "Where can I find help?"}'
```

---

## Development

### How the platform was built

| Stage | What was delivered |
|---|---|
| 1. Specification | Functional and technical specification, then the mobile specification |
| 2. Foundation | FastAPI backend, data model and migrations, role-based access, public website, the four dashboards |
| 3. AI engine | Language detection, safety rules, RAG with cited sources, local language model, final answer check, extractive fallback |
| 4. Search quality | Hybrid semantic and keyword search, automatic threshold calibration on a reference question set, evaluation tools |
| 5. Security and operations | Two-factor authentication, account management, rate limiting, encrypted referral data, PDF and Excel reports, automatic data purge, monitoring |
| 6. Mobile app | Expo app for Android and iOS, same design as the website, discreet mode, offline directory, local voice recognition in French and Wolof |
| 7. Access control and field tests | Three main profiles, public sign-up, server-side logout, end-to-end tests on the phone and the website |

### Engineering practices

- **Automated tests** for every security and privacy commitment (pytest for the backend and AI
  engine, Jest for the mobile app, TypeScript checks for the website).
- **Versioned database migrations** with Alembic.
- **Permissions defined in code** in a single, auditable file.
- **Configuration through environment variables**, with no secret in the repository.
- **Reproducible environments**: local scripts for Windows and Unix, and Docker Compose for the full
  stack.
- **Observability**: Prometheus metrics, service health, AI engine state and an audit log.

---

## Test results

End-to-end tests were run on 2 November 2026, on the mobile app, the website and the API.

| # | Test | Result | Observations |
|---|---|---|---|
| 1 | Sign-up and sign-in | Passed | Account created in the app, automatic sign-in, sign-out and sign-in again. The account always receives the "User" profile. |
| 2 | Voice journey (French) | Passed | Spoken question transcribed word for word, then a sourced answer. |
| 3 | Text journey | Passed | Same question typed in the app and on the website. |
| 4 | French and Wolof | Partially passed | Both languages are recognized. In Wolof, the answer opens with a Wolof sentence and continues in French, because the validated resources are in French. |
| 5 | Answer based on resources | Passed | The answer cites its source document. |
| 6 | Out-of-scope question | Passed | No invented answer, directory suggested; a diagnosis request is redirected to a health professional. |
| 7 | Referral with consent | Passed | Directory, profile, "Être rappelée", consent box (button disabled until checked), tracking code, real status read from the server. Tested with a test organization: real organizations are offered by phone until they have an account on the platform. Without consent, the request is refused. |
| 8 | Role security | Passed | 33 access checks out of 33 compliant, including direct URL access and API calls. |
| C1 | Confidentiality between accounts | Passed | Account B cannot see account A's request; a partner only sees its own organization's requests. |
| C2 | Logout | Passed | After logout, the old token is refused by the server. |
| C3 | Stability | Passed | 5 questions out of 5 answered, no error during the whole campaign. |

On a laptop without a graphics card, answers take 12 to 57 seconds. A server sized for the language
model brings this down significantly.

---
## Testing

```bash
make test    # backend and AI engine tests, then website type checking
make eval    # search quality evaluation
```

| Area | What is verified |
|---|---|
| AI engine | Emergency detection, language detection, final answer check, manipulation attempts |
| Privacy | Messages never stored, anonymity threshold, consent required, partner isolation |
| Access | Permissions per dashboard, public sign-up without privileges, logout, two-factor authentication, lockout and rate limiting |
| Operations | Reports, data purge, accounts |
| Mobile | Mobile channel, voice API limits, calculator, local retention |

Search quality on the reference set (14 questions): **recall@4 = 93 %**, **MRR = 0.82**.

---

## Deployment

```mermaid
flowchart LR
    USERS(["Users"]) -->|HTTPS| PROXY["Nginx<br/>TLS"]
    APP(["Mobile app"]) -->|HTTPS| PROXY
    subgraph HOST["Server (Docker Compose)"]
        PROXY --> WEBSITE["Website"]
        PROXY --> BACKEND["FastAPI backend"]
        BACKEND --> PG[("PostgreSQL")]
        BACKEND --> LLM["Ollama"]
        BACKEND --> CACHE[("Redis")]
    end
    PG --> BACKUP[("Encrypted backups")]
```

Production checklist:

1. Set strong values for `JWT_SECRET`, `DATA_ENCRYPTION_KEY` and database passwords.
2. Set `ENVIRONMENT=production` and `DATABASE_URL` to the PostgreSQL instance.
3. Serve the platform over HTTPS only.
4. Schedule encrypted backups with `infrastructure/scripts/backup-postgres.sh`.
5. Point the mobile app to the public API address in `frontend/mobile/eas.json`, then build it.

Details: [docs/deployment/README.md](docs/deployment/README.md).

---

## Repository structure

```text
SUNUSAFEGUARD/
├── ai-engine/          AI engine: safety rules, search, generation, Wolof, speech
├── backend/            FastAPI API, database models, migrations, tests
├── frontend/           React website (public pages and dashboards)
│   └── mobile/         Expo mobile app "Sunu"
├── data/
│   ├── knowledge_base/ Source documents used by the assistant
│   ├── seed/           Accounts, organizations, emergency numbers
│   └── evaluation/     Reference questions for search quality
├── infrastructure/     Docker, Nginx, PostgreSQL, monitoring, backups
├── docs/               Architecture, API, security, database, deployment, user guides
├── scripts/            Local startup scripts
├── docker-compose.yml
├── Makefile
└── .env.example
```

---

## Roadmap

| Release | Content |
|---|---|
| **1.0 (current)** | French and Wolof assistant with sourced answers and safety rules, directory and referrals, four dashboards, mobile app, two-factor authentication, reports, data purge |
| **Next release** | Wolof text-to-speech, fully Wolof interface, roles managed from the interface |
| **Later** | Vector search with pgvector, multi-instance deployment, app store publication |

---

## Operational best practices

| Area | Recommendation |
|---|---|
| Content | Have the documents in `data/knowledge_base/` reviewed regularly by lawyers and psychosocial professionals. |
| Emergency numbers | Keep `data/seed/emergency_contacts.json` up to date. |
| Wolof | Have changes to the Wolof lexicon and messages validated by linguists. |
| Safety rules | Review `ai-engine/safety/rules.py` with professionals whenever it changes. |
| Directory | Keep organizations, contact details and partnership agreements up to date. |
| Personal data | Keep the data protection impact assessment up to date. |
| Infrastructure | HTTPS, secret rotation, encrypted backups, regular penetration tests. |
| Minors | Apply a dedicated protocol for this audience. |

---

## Further documentation

The documents below are written in French.

| Document | Content |
|---|---|
| [Architecture](docs/architecture/README.md) | Components and the AI processing chain in detail |
| [API](docs/api/README.md) | Route groups and examples |
| [Security and privacy](docs/security/README.md) | Guarantees and the tests that verify them |
| [Database](docs/database/README.md) | Schema and migrations |
| [Deployment](docs/deployment/README.md) | Going to production |
| [Mobile app guide](docs/user-guides/guide-app-mobile.md) | Using the "Sunu" app |
| [UI guidelines](docs/user-guides/charte-ui.md) | Colors, typography, components |

---

<div align="center">

**SunuSafeguard AI** · GREEN T SARL, Senegal

*"Sunu" means "our" in Wolof: a platform designed with and for the people it protects.*

</div>
