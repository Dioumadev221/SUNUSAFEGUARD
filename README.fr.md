<div align="center">

# SunuSafeguard AI

**Plateforme intelligente de soutien psychosocial, d'orientation et de protection**

Écoute bienveillante en français et en wolof · Orientation vers des structures d'aide · Pilotage anonyme de l'impact

Conçue par **GREEN T SARL** — Sénégal

**Français** · [English](README.md)

![Python](https://img.shields.io/badge/Python-3.11+-3776AB?logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
![Expo](https://img.shields.io/badge/Expo-SDK%2058-000020?logo=expo&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16%20%2B%20pgvector-4169E1?logo=postgresql&logoColor=white)
![Ollama](https://img.shields.io/badge/LLM-Ollama%20local-000000)
![Version](https://img.shields.io/badge/version-1.0-2ea44f)

</div>

---

## Sommaire

1. [Le projet en bref](#-le-projet-en-bref)
2. [Fonctionnalités](#-fonctionnalités)
3. [Architecture générale](#-architecture-générale)
4. [Le moteur d'intelligence artificielle](#-le-moteur-dintelligence-artificielle)
5. [Parcours d'une conversation](#-parcours-dune-conversation)
6. [Mise en relation avec une structure](#-mise-en-relation-avec-une-structure)
7. [Base de connaissances et validation des documents](#-base-de-connaissances-et-validation-des-documents)
8. [Rôles, accès et authentification](#-rôles-accès-et-authentification)
9. [Modèle de données](#-modèle-de-données)
10. [Sécurité et confidentialité](#-sécurité-et-confidentialité)
11. [Application mobile « Sunu »](#-application-mobile--sunu-)
12. [Stack technique](#-stack-technique)
13. [Arborescence du dépôt](#-arborescence-du-dépôt)
14. [Installation et démarrage](#-installation-et-démarrage)
15. [Configuration](#-configuration)
16. [Comptes de test](#-comptes-de-test)
17. [API](#-api)
18. [Tests et qualité](#-tests-et-qualité)
19. [Déploiement](#-déploiement)
20. [Feuille de route](#-feuille-de-route)
21. [Bonnes pratiques d'exploitation](#-bonnes-pratiques-dexploitation)
22. [Documentation complémentaire](#-documentation-complémentaire)

---

## 🌍 Le projet en bref

Beaucoup de femmes et de jeunes filles au Sénégal font face à des violences, à de la détresse
psychologique ou à des situations d'urgence sans savoir **à qui parler** ni **vers qui se tourner**.
SunuSafeguard AI leur offre :

| Pour… | SunuSafeguard apporte… |
|---|---|
| **La personne qui cherche de l'aide** | Un assistant conversationnel disponible à toute heure, en français et en wolof, qui écoute sans juger, donne des informations fiables et sourcées, détecte les situations d'urgence et propose une orientation vers une structure adaptée, **sans conserver la conversation**. |
| **Les structures partenaires** (centres d'écoute, associations, services sociaux) | Un espace pour tenir à jour leur fiche et leurs disponibilités, recevoir les demandes de mise en relation consenties et suivre leur traitement. |
| **Les institutions et bailleurs** | Des indicateurs d'impact **strictement anonymes** (seuil de publication N ≥ 5), des cartes par région et des rapports PDF / Excel. |
| **Les expert·es** (juristes, psychologues, linguistes) | Un circuit de validation des documents qui alimentent l'assistant : rien n'est utilisé tant que ce n'est pas publié. |
| **L'équipe technique GREEN T** | La supervision de la qualité de l'IA, des performances, des garde-fous, des comptes et du journal d'audit. |

### Principes directeurs

- **La sécurité de la personne passe avant tout** : les règles d'urgence sont déterministes et priment sur l'IA.
- **Aucune conversation n'est stockée** : ni en base, ni dans les journaux.
- **Jamais de diagnostic, jamais de fausse promesse** : un contrôle de sortie remplace toute réponse problématique.
- **Toujours sourcé** : l'assistant ne répond qu'à partir de documents validés et cite ses sources.
- **Consentement explicite** avant toute transmission à une structure.
- **IA souveraine et gratuite** : le modèle de langage et la reconnaissance vocale tournent en local, sans service payant.

---

## ✨ Fonctionnalités

| Espace | Contenu | État |
|---|---|---|
| **Interface publique (site web, PWA)** | Accueil, assistant conversationnel FR / WO, annuaire des structures, mise en relation avec consentement, suivi par code, page confidentialité, **bouton Sortie rapide** (et touche Échap × 2), mode sombre par défaut, conçue d'abord pour le téléphone | ✅ |
| **Application mobile « Sunu »** | Android / iOS (Expo) : écoute vocale, réponse, ressources, session, **mode discret** déguisé en calculatrice | ✅ |
| **Backend FastAPI** | Authentification JWT, contrôle d'accès par rôle côté serveur, verrouillage après échecs, inscription publique, déconnexion avec révocation du jeton, documentation OpenAPI sur `/api/docs` | ✅ |
| **Moteur IA** (`ai-engine/`) | Détection de langue, classification des besoins, garde-fous déterministes (urgence, injection de prompt, hors périmètre, demande de diagnostic), recherche hybride (RAG) avec sources citées, LLM local via Ollama et **repli extractif**, contrôle de sortie | ✅ |
| **Sunu Impact** | Indicateurs clés, évolution, besoins, langues, canaux, carte des régions, rapports PDF / Excel, seuil N ≥ 5 | ✅ |
| **Sunu Orientation** | Fiches des structures, disponibilités et historique, validation, demandes de mise en relation, délais, alertes de non-réception, gestion d'équipe | ✅ |
| **Sunu Ressources** | Import PDF / DOCX / TXT, découpage, indexation, circuit de validation, banc d'essai RAG, lacunes, évaluation | ✅ |
| **Sunu Tech** | Qualité de l'IA, latences, garde-fous, état des services, CPU / RAM, journal d'audit, purge, métriques Prometheus `/metrics` | ✅ |
| **Comptes et accès** | Comptes créés avec mot de passe provisoire, rôles, désactivation, réinitialisation ; un responsable partenaire gère l'équipe de sa structure | ✅ |
| **Sécurité des accès** | Double authentification TOTP (QR code) obligatoire pour les comptes privilégiés, changement de mot de passe, limitation de débit sur la connexion et le chat | ✅ |
| **Conservation des données** | Purge automatique toutes les 24 h selon la politique configurée, purge manuelle depuis Sunu Tech | ✅ |
| **Reconnaissance vocale** | Whisper-small local (français et wolof), sur processeur, audio jamais écrit sur disque | ✅ |
| **Synthèse vocale wolof** | Aucune solution gratuite et fiable identifiée à ce jour | 🔜 Prochaine version |

---

## 🏗 Architecture générale

### Vue d'ensemble

```mermaid
flowchart TB
    subgraph CLIENTS["Clients"]
        direction LR
        WEB["🌐 Site web / PWA<br/>React + Vite + Tailwind"]
        MOB["📱 Application mobile Sunu<br/>Expo / React Native"]
        PRO["🧑‍💼 Espaces professionnels<br/>Impact · Orientation · Ressources · Tech"]
    end

    NGINX["Nginx<br/>fichiers statiques + proxy /api"]

    subgraph API["Backend FastAPI — backend/app"]
        direction TB
        ROUTES["Routes /api<br/>auth · chat · directory · referrals<br/>knowledge · rag · metrics · monitoring<br/>users · voice"]
        MW["Middleware<br/>limitation de débit · en-têtes de sécurité<br/>métriques Prometheus"]
        RBAC["Contrôle d'accès<br/>core/permissions.py"]
        SVC["Services<br/>knowledge · metrics · reports<br/>retention · audit · ai_state · seed"]
    end

    subgraph AI["Moteur IA — ai-engine/"]
        direction TB
        PIPE["pipeline.py<br/>orchestration en 10 étapes"]
        SAFE["safety/<br/>règles d'urgence · contrôle de sortie"]
        RAG["rag/ + embeddings/<br/>recherche hybride"]
        VOICE["voice/<br/>Whisper-small FR / WO"]
    end

    DB[("PostgreSQL 16 + pgvector<br/>(SQLite en développement)")]
    OLLAMA["Ollama — local<br/>qwen2.5:3b + paraphrase-multilingual"]
    REDIS[("Redis<br/>cache volatil")]
    PROM["Prometheus + Grafana<br/>(optionnel)"]

    WEB --> NGINX
    PRO --> NGINX
    MOB -->|HTTPS| API
    NGINX --> API
    MW --> ROUTES --> RBAC --> SVC
    ROUTES --> PIPE
    ROUTES --> VOICE
    PIPE --> SAFE
    PIPE --> RAG
    PIPE -->|génération| OLLAMA
    RAG -->|embeddings| OLLAMA
    SVC --> DB
    RAG -->|segments publiés| DB
    API -.-> REDIS
    PROM -.->|/metrics| API
```

### Organisation en couches du backend

```mermaid
flowchart LR
    REQ(["Requête HTTP"]) --> M["Middleware<br/>débit · en-têtes · mesures"]
    M --> R["Route FastAPI<br/>api/routes/*.py"]
    R --> D["Dépendances<br/>api/deps.py<br/>jeton · rôle · permission"]
    D --> S["Services<br/>services/*.py"]
    S --> O["Modèles SQLAlchemy<br/>models/__init__.py"]
    O --> B[("Base de données")]
    R --> V["Schémas Pydantic<br/>schemas/__init__.py"]
    V --> RES(["Réponse JSON"])
```

Chaque route qui touche à des données professionnelles déclare la permission requise avec
`require("permission")`. **C'est l'API qui fait foi** : l'interface masque les espaces non
autorisés, mais le serveur refuse toujours l'accès, même si l'appel est forgé à la main.

### Démarrage du backend

```mermaid
flowchart TD
    A([Démarrage uvicorn]) --> B{ENVIRONMENT ?}
    B -->|development / test| C["Vérifie le schéma local<br/>recrée la base s'il est obsolète"]
    C --> D["Crée les tables<br/>charge les données d'exemple"]
    B -->|docker / production| E["Migrations Alembic<br/>déjà appliquées par le Dockerfile"]
    D --> F
    E --> F["Initialise le moteur IA<br/>services/ai_state.py"]
    F --> G{Ollama joignable ?}
    G -->|oui| H["Télécharge les modèles manquants<br/>en arrière-plan"]
    H --> I["Réindexe les segments produits<br/>par un autre modèle d'embeddings"]
    I --> J["Recalibre le seuil de pertinence<br/>sur le jeu de tests"]
    G -->|non| K["Mode dégradé :<br/>recherche lexicale + réponses par extraits"]
    J --> L
    K --> L["Précharge Whisper si installé<br/>(thread en arrière-plan)"]
    L --> M["Planifie la purge quotidienne"]
    M --> N([API prête])
```

---

## 🧠 Le moteur d'intelligence artificielle

Le moteur IA (`ai-engine/`) est un module Python indépendant, appelé par le backend. Il
n'enregistre **aucune donnée de conversation**.

### La chaîne de traitement en 10 étapes

```mermaid
flowchart TD
    IN(["Message de la personne"]) --> S1

    S1["1 · Détection de langue<br/>multilingual/detector.py<br/>français ou wolof"]
    S1 --> S2["2 · Classification du besoin<br/>safety/rules.py · classify_need<br/>7 catégories, jamais un diagnostic"]
    S2 --> S3{"3 · Contrôle de sécurité<br/>safety/rules.py · check_input"}

    S3 -->|"injection de prompt<br/>ou hors périmètre"| BLOCK["Réponse modèle fixe<br/>le LLM n'est pas appelé"]
    S3 -->|"urgence"| URG["Message d'urgence en tête<br/>+ numéros d'urgence"]
    S3 -->|"demande de diagnostic"| PROF["Invitation à consulter<br/>un·e professionnel·le"]
    S3 -->|"autorisé"| S4

    URG --> S4
    PROF --> S4

    S4["4 · Recherche documentaire<br/>rag/retriever.py<br/>0,75 × sémantique + 0,25 × lexical<br/>requêtes wolof enrichies par lexique"]
    S4 --> S5["5 · Sélection des sources<br/>seuil calibré + ≥ 60 % du meilleur score<br/>2 segments max par document"]
    S5 --> HAS{"Sources pertinentes ?"}
    HAS -->|non| NOSRC["Message « pas d'information fiable »<br/>+ lien vers l'annuaire"]
    HAS -->|oui| S6["6 · Construction du contexte<br/>rag/context.py<br/>extraits numérotés [1], [2]…"]
    S6 --> S7{"7 · Génération<br/>llm/ollama_client.py"}
    S7 -->|"Ollama disponible"| LLM["qwen2.5:3b<br/>prompt système strict"]
    S7 -->|"Ollama indisponible"| EXT["Repli extractif<br/>llm/fallback.py"]
    LLM --> S8
    EXT --> S8
    S8["8 · Vérification des références<br/>seules les sources réellement citées sont gardées"]
    S8 --> S9{"9 · Contrôle final<br/>safety/output_guard.py"}
    S9 -->|"promesse de confidentialité absolue,<br/>diagnostic, banalisation,<br/>faux signalement"| REPL["Réponse remplacée<br/>par un message sûr"]
    S9 -->|"conforme"| S10
    REPL --> S10
    NOSRC --> S10
    BLOCK --> S10
    S10["10 · Présentation<br/>api/routes/chat.py<br/>réponse · sources · bandeau d'urgence · lien annuaire"]
    S10 --> OUT(["Réponse affichée"])
```

### Détail des étapes

| Étape | Module | Ce qu'elle fait |
|---|---|---|
| 1. Langue | `multilingual/detector.py` | Heuristique français / wolof avec indice de confiance. À remplacer par un modèle évalué. |
| 2. Besoin | `safety/rules.py::classify_need` | Mots-clés → 7 catégories : écoute psychosociale, violences physiques et verbales, violences économiques, cyberharcèlement, hébergement et protection, information juridique, santé reproductive. |
| 3. Sécurité | `safety/rules.py::check_input` | Règles **déterministes** : `urgent`, `refuse_injection`, `out_of_scope`, `redirect_professional`, `allow`. L'urgence prime toujours. Distingue une urgence vécue par la personne et une urgence concernant un tiers. |
| 4. Recherche | `rag/retriever.py` | Recherche **hybride** : 75 % similarité cosinus sémantique (Ollama `paraphrase-multilingual`) et 25 % lexicale. Recherche lexicale seule si Ollama est absent. Les requêtes en wolof sont enrichies grâce au lexique `multilingual/lexicon.py`. |
| 5. Sélection | `pipeline.py` | Seuil absolu **calibré au démarrage** (`evaluation/calibrate.py`) et seuil relatif (≥ 60 % du meilleur score). Seuil relevé en situation d'urgence. |
| 6. Contexte | `rag/context.py` | Extraits numérotés transmis au modèle. |
| 7. Génération | `llm/ollama_client.py` | `qwen2.5:3b` par défaut, prompt système strict (`llm/prompts.py`). Le texte de la personne est délimité pour éviter l'injection. |
| 8. Références | `pipeline.py` | Seules les sources effectivement citées sont renvoyées. |
| 9. Contrôle final | `safety/output_guard.py` | Remplace toute réponse qui promettrait une confidentialité absolue, poserait un diagnostic, banaliserait une violence ou annoncerait un faux signalement. |
| 10. Présentation | `backend/app/api/routes/chat.py` | Réponse, sources, bandeau d'urgence, suggestion d'annuaire. |

### Fonctionnement sans connexion au modèle

```mermaid
flowchart LR
    subgraph COMPLET["Mode hybride (Ollama présent)"]
        A1["Embeddings sémantiques"] --> A2["Recherche hybride"] --> A3["Réponse rédigée par le LLM<br/>avec sources citées"]
    end
    subgraph DEGRADE["Mode lexical (Ollama absent)"]
        B1["Vecteurs lexicaux en mémoire"] --> B2["Recherche lexicale"] --> B3["Réponse par extraits<br/>des documents validés, sourcés"]
    end
    COMPLET -. "Ollama tombe" .-> DEGRADE
    DEGRADE -. "bouton « Reconnecter »<br/>dans Sunu Tech" .-> COMPLET
```

L'assistant **reste toujours en service**. L'état du moteur (mode, modèle, seuil, téléchargements)
est visible dans **Sunu Tech → Performance RAG & IA** et exposé par `GET /api/monitoring/ai-engine`.

### Le wolof

Les petits modèles open source ne maîtrisent pas encore le wolof. Plutôt que d'inventer du wolof
approximatif, l'assistant répond en **français simple**, précédé d'une phrase wolof issue d'un
modèle validable (`llm/fallback.py`). La reconnaissance vocale wolof utilise un Whisper-small affiné
sur 57 h de wolof (`M9and2M/whisper-small-wolof`, licence MIT).

---

## 💬 Parcours d'une conversation

```mermaid
sequenceDiagram
    autonumber
    actor P as Personne
    participant UI as Site ou application
    participant API as Backend FastAPI
    participant RL as Limitation de débit
    participant AI as Moteur IA
    participant DB as Base de données
    participant LLM as Ollama (local)

    P->>UI: Écrit ou dicte son message
    opt Message vocal (application mobile)
        UI->>API: POST /api/voice/transcribe (audio)
        API->>AI: Whisper-small FR ou WO, en mémoire
        AI-->>UI: Texte reconnu, relu par la personne
    end
    UI->>API: POST /api/chat { message, canal }
    API->>RL: IP hachée, 30 requêtes / 60 s
    RL-->>API: autorisé
    API->>AI: pipeline.run(message)
    AI->>AI: Langue, besoin, contrôle de sécurité
    AI->>DB: Segments des documents publiés
    AI->>LLM: Contexte + question
    LLM-->>AI: Réponse rédigée
    AI->>AI: Références + contrôle de sortie
    AI-->>API: Réponse, sources, urgence
    API->>DB: UsageEvent anonyme (langue, catégorie, région, heure arrondie)
    Note over API,DB: Le texte du message n'est JAMAIS enregistré
    API-->>UI: Réponse + sources + bandeau d'urgence
    UI-->>P: Affichage (historique en mémoire du navigateur uniquement)
```

---

## 🤝 Mise en relation avec une structure

Une mise en relation n'est créée **qu'avec le consentement explicite** de la personne. Ses
coordonnées sont **chiffrées** (Fernet) et **effacées** dès la clôture de la demande.

```mermaid
sequenceDiagram
    autonumber
    actor P as Personne
    participant UI as Site ou application
    participant API as Backend
    participant DB as Base de données
    actor S as Structure partenaire

    P->>UI: Choisit une structure dans l'annuaire
    UI->>P: Montre ce qui sera transmis et demande le consentement
    P->>UI: Donne son accord et le niveau d'information souhaité
    UI->>API: POST /api/referrals { consent: true, … }
    API->>API: Refus si consent ≠ true, refus 409 si la structure n'a pas de compte
    API->>DB: Demande + contact chiffré + événements
    API-->>UI: Code de suivi aléatoire SSG-XXXXXXXX
    UI-->>P: Affiche le code (gardé sur l'appareil)
    S->>API: GET /api/referrals (sa structure uniquement)
    S->>API: PATCH /api/referrals/{id} (reçue, en cours…)
    P->>API: GET /api/referrals/status/{code}
    API-->>P: Message clair sur l'avancement
    S->>API: PATCH statut « clôturée »
    API->>DB: Effacement des coordonnées
```

### Cycle de vie d'une demande

```mermaid
stateDiagram-v2
    [*] --> en_attente_consentement: orientation proposée
    en_attente_consentement --> transmise: consentement donné
    transmise --> recue: la structure accuse réception
    transmise --> alerte: non reçue après 24 h
    alerte --> recue
    recue --> en_cours
    en_cours --> prise_en_charge_confirmee
    en_cours --> non_prise_en_charge
    prise_en_charge_confirmee --> cloturee
    non_prise_en_charge --> cloturee
    transmise --> annulee
    cloturee --> [*]: coordonnées effacées
    annulee --> [*]: coordonnées effacées

    note right of alerte
        Alerte interne visible dans
        Sunu Orientation (REFERRAL_ALERT_HOURS)
    end note
```

---

## 📚 Base de connaissances et validation des documents

Seuls les documents au statut **publié** alimentent l'assistant. Chaque document passe par un
circuit de validation tracé (versions, relectures, audit).

```mermaid
stateDiagram-v2
    [*] --> importe: import PDF, DOCX ou TXT
    importe --> a_verifier
    importe --> rejete
    en_traitement --> a_verifier
    a_verifier --> en_validation
    a_verifier --> rejete
    en_validation --> valide
    en_validation --> a_verifier: corrections demandées
    en_validation --> rejete
    valide --> publie: utilisé par l'assistant
    valide --> archive
    publie --> archive
    publie --> expire
    publie --> en_validation: révision
    expire --> en_validation
    expire --> archive
    archive --> en_validation
    rejete --> a_verifier
    rejete --> archive
```

```mermaid
flowchart LR
    F["Fichier importé<br/>PDF · DOCX · TXT ≤ 10 Mo"] --> X["Extraction du texte<br/>rag/extract.py"]
    X --> C["Découpage en segments<br/>rag/chunker.py"]
    C --> E["Embeddings<br/>Ollama ou lexical"]
    E --> K[("knowledge_chunks<br/>+ nom de l'embedder")]
    K --> Q{"Document publié ?"}
    Q -->|oui| R["Utilisable par la recherche"]
    Q -->|non| N["Ignoré par l'assistant"]
```

Contenus fournis (`data/knowledge_base/`) : écoute psychosociale, violences conjugales et droits,
cyberharcèlement, violences économiques, hébergement et orientation, santé reproductive, bien-être,
stress, soutien d'un proche, idées suicidaires, ressources au Sénégal, confidentialité.

---

## 🔐 Rôles, accès et authentification

### Profils principaux

La plateforme s'articule autour de trois profils principaux :

| Profil | Rôle technique | Peut faire | Ne peut pas faire |
|---|---|---|---|
| **Utilisateur** | `utilisateur` | Utiliser l'assistant et l'annuaire, créer un compte par inscription publique, suivre ses propres demandes (`GET /api/referrals/mine`) | Accéder à un espace d'administration (« Accès refusé ») |
| **Administrateur opérationnel** | `admin_operationnel` | Ressources, annuaire, orientations, indicateurs d'impact, rapports, sur toutes les structures | Gérer les comptes, voir la supervision technique |
| **Super administrateur GREEN T** | `super_admin` | Tout : comptes et rôles, configuration technique, supervision, journaux | — |

Des rôles plus fins sont également disponibles : administrateur technique,
responsable institutionnel, analyste, responsable partenaire, travailleur social, expert
documentaire, expert linguistique.

### Matrice des espaces

| Espace | super_admin | admin_operationnel | admin_technique | institutionnel / analyste | partenaire / travailleur social | experts | utilisateur |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Sunu Impact | ✅ | ✅ | | ✅ | | | |
| Sunu Orientation | ✅ | ✅ | | | ✅ *(sa structure)* | | |
| Sunu Ressources | ✅ | ✅ | | | | ✅ | |
| Sunu Tech | ✅ | | ✅ | | | | |
| Gestion des comptes | ✅ | | | | ✅ *(responsable, sa structure)* | | |

La matrice complète des permissions est versionnée dans
[`backend/app/core/permissions.py`](backend/app/core/permissions.py), ce qui la rend auditable.

### Connexion avec double authentification

```mermaid
sequenceDiagram
    autonumber
    actor U as Professionnel·le
    participant UI as Espace pro
    participant API as Backend

    U->>UI: E-mail + mot de passe
    UI->>API: POST /api/auth/login
    alt 5 échecs consécutifs
        API-->>UI: Compte verrouillé 15 min
    else Rôle privilégié avec 2FA activée
        API-->>UI: Jeton intermédiaire « mfa » (5 min, aucun accès aux API)
        U->>UI: Code TOTP de l'application d'authentification
        UI->>API: POST /api/auth/mfa/verify
        API-->>UI: Jeton d'accès JWT (60 min)
    else Compte standard
        API-->>UI: Jeton d'accès JWT (60 min)
    end
    UI->>API: Requêtes avec Authorization: Bearer …
    API->>API: Jeton valide, non révoqué, permission accordée ?
    U->>UI: Se déconnecter
    UI->>API: POST /api/auth/logout
    API->>API: jti ajouté à revoked_tokens jusqu'à expiration
```

---

## 🗄 Modèle de données

```mermaid
erDiagram
    ORGANIZATIONS ||--o{ USERS : "emploie"
    ORGANIZATIONS ||--o{ SERVICE_AVAILABILITY : "publie"
    ORGANIZATIONS ||--o{ REFERRAL_REQUESTS : "reçoit"
    USERS |o--o{ REFERRAL_REQUESTS : "a demandé"
    REFERRAL_REQUESTS ||--o{ REFERRAL_EVENTS : "historique"
    USERS |o--o{ REFERRAL_EVENTS : "acteur"
    KNOWLEDGE_DOCUMENTS ||--o{ KNOWLEDGE_VERSIONS : "versions"
    KNOWLEDGE_DOCUMENTS ||--o{ KNOWLEDGE_CHUNKS : "segments"
    KNOWLEDGE_DOCUMENTS ||--o{ KNOWLEDGE_REVIEWS : "relectures"
    USERS ||--o{ AUDIT_LOGS : "actions"

    ORGANIZATIONS {
        int id
        string name
        string region
        string department
        string availability
        bool validated
    }
    USERS {
        int id
        string email
        string role
        string password_hash
        bool mfa_enabled
        bool is_active
    }
    REFERRAL_REQUESTS {
        int id
        string public_code
        string category
        string status
        bool consent_given
        string contact_encrypted
    }
    KNOWLEDGE_DOCUMENTS {
        int id
        string title
        string category
        string status
        int version
        string index_status
    }
    KNOWLEDGE_CHUNKS {
        int id
        text text
        json embedding
        string embedder
    }
    USAGE_EVENTS {
        string language
        string category
        string region
        datetime hour
        string channel
        string safety_action
        float latency_ms
    }
    SECURITY_EVENTS {
        string kind
        string severity
        string rule
    }
    REVOKED_TOKENS {
        string jti
        datetime expires_at
    }
```

Autres tables : `rag_evaluations`, `ai_model_configurations`, `safety_rules`, `aggregate_metrics`,
`reports`. Le schéma complet est dans [`backend/app/models/__init__.py`](backend/app/models/__init__.py)
et les migrations Alembic dans [`backend/migrations/versions/`](backend/migrations/versions/).

> [!NOTE]
> `USAGE_EVENTS` est la seule source des indicateurs : langue, catégorie, région **déclarée**,
> canal et heure **arrondie**. Aucun identifiant de session, aucun texte.

---

## 🛡 Sécurité et confidentialité

### Ce que le code garantit aujourd'hui

| Exigence | Mise en œuvre | Vérifiée par |
|---|---|---|
| Conversations non conservées | Aucune table ne stocke le texte ; historique en `sessionStorage` (site) ou en mémoire (mobile) | `test_chat_never_stores_message_text` |
| Journaux sans contenu sensible | `SecurityEvent` ne garde que la règle déclenchée ; Nginx `access_log off` | idem |
| Statistiques anonymes | `UsageEvent` sans identifiant de session | — |
| Seuil de publication N ≥ 5 | `services/metrics.py::suppress`, aussi dans l'export Excel | `test_k_anonymity_suppression` |
| Consentement avant transmission | `POST /api/referrals` refuse sans `consent=true` | `test_referral_requires_consent` |
| Code de suivi non corrélable | Code aléatoire `SSG-XXXXXXXX` | — |
| Données d'orientation chiffrées | Fernet (`DATA_ENCRYPTION_KEY`), effacées à la clôture | — |
| Isolation des partenaires | Filtrage serveur par `organization_id` | `test_partner_isolation` |
| Contrôle d'accès côté serveur | `require(permission)` sur chaque route | `test_dashboard_permissions` |
| Inscription publique sans privilège | Rôle `utilisateur` imposé par le serveur | `test_roles.py` |
| Déconnexion effective | Jeton révoqué (`revoked_tokens`) | `test_roles.py` |
| Protection contre la force brute | Verrouillage 15 min après 5 échecs + limitation de débit par IP hachée | `test_rate_limit_on_chat` |
| Double authentification | TOTP (RFC 6238) obligatoire pour `super_admin` et `admin_technique` | `test_mfa_enrolment_and_login` |
| Conservation et purge | Purge quotidienne + manuelle | `test_retention_purge` |
| Pas de signalement automatique | Aucune intégration sortante ; contrôle de sortie | `test_output_guard` |
| Injection de prompt | Règles déterministes + consignes système + texte délimité | `test_prompt_injection_refused` |
| Documents non validés exclus | Seul le statut `publie` est chargé | `test_unpublished_document_not_used` |
| En-têtes HTTP | `nosniff`, `X-Frame-Options: DENY`, `no-referrer`, `Cache-Control: no-store` | — |
| Sortie rapide | Bouton sur chaque écran, Échap × 2, efface la session, `location.replace` | — |

### Durées de conservation par défaut

| Données | Durée | Variable |
|---|---|---|
| Événements d'usage anonymes | 395 jours | `RETENTION_USAGE_DAYS` |
| Événements de sécurité | 180 jours | `RETENTION_SECURITY_DAYS` |
| Journal d'audit | 730 jours | `RETENTION_AUDIT_DAYS` |
| Demandes de mise en relation | 365 jours | `RETENTION_REFERRAL_DAYS` |

### Ce qui circule et ce qui ne circule jamais

```mermaid
flowchart LR
    subgraph JAMAIS["❌ Jamais enregistré"]
        J1["Texte des messages"]
        J2["Audio des messages vocaux"]
        J3["Identifiant de session de chat"]
        J4["Corps des requêtes dans les journaux"]
    end
    subgraph ANONYME["📊 Anonyme et agrégé"]
        A1["Langue · catégorie · région déclarée"]
        A2["Heure arrondie · canal"]
        A3["Publié seulement si N ≥ 5"]
    end
    subgraph PROTEGE["🔒 Chiffré, avec consentement"]
        P1["Coordonnées d'une demande<br/>de mise en relation"]
        P2["Effacées à la clôture"]
    end
```

---

## 📱 Application mobile « Sunu »

Application Android / iOS dans [`frontend/mobile/`](frontend/mobile/), branchée sur la même API,
avec le même design que le site (palette Teranga, thème sombre par défaut).

```mermaid
flowchart TB
    HOME["🏠 Accueil<br/>index.tsx"] --> ECOUTE["🎙 Sunu Écoute + Réponse<br/>response.tsx<br/>micro FR / WO puis chat"]
    HOME --> RES["📍 Sunu Ressources<br/>resources/<br/>annuaire, filtres, fiche, appel"]
    HOME --> SES["🗂 Sunu Session<br/>session.tsx<br/>suivi, « Effacer toute trace »"]
    HOME --> ACC["👤 Mon compte (optionnel)<br/>account.tsx"]
    ECOUTE --> REF["🤝 Mise en relation<br/>referral/[id].tsx<br/>consentement, code de suivi"]
    RES --> REF
    REF --> SES
    HOME & ECOUTE & RES & SES -->|"bouton « Sortir »"| DISC["🧮 Sunu Discret<br/>vraie calculatrice<br/>retour : code + « = »"]
```

| Protection côté téléphone | Détail |
|---|---|
| Conversation | En mémoire seulement, effacée à la fermeture, à « Sortir » ou à l'effacement |
| Codes de suivi et réglages | Stockage chiffré du système (`expo-secure-store`) ; demande close effacée après 30 jours, toute demande après 180 jours |
| Annuaire hors connexion | Copie locale de l'annuaire public (aucune donnée personnelle) |
| Discrétion | Android : écran masqué dans les applications récentes et captures bloquées ; iOS : flou dans le sélecteur |
| Micro | Coupé en arrière-plan et à « Sortir » ; seule permission demandée |
| Notifications | Aucune |

Lancement, compilation Android et tests : voir [`frontend/mobile/README.md`](frontend/mobile/README.md)
et le [guide utilisatrice](docs/user-guides/guide-app-mobile.md).

---

## 🧰 Stack technique

| Couche | Technologies |
|---|---|
| **Site web** | React 18, TypeScript, Vite 5, Tailwind CSS 3, Recharts, PWA (service worker) |
| **Mobile** | Expo SDK 58, React Native, Expo Router, TypeScript, Zustand, expo-secure-store, expo-speech |
| **Backend** | Python 3.11+, FastAPI, SQLAlchemy 2, Alembic, Pydantic 2, PyJWT, cryptography (Fernet) |
| **Documents et rapports** | pypdf, python-docx, openpyxl, fpdf2 |
| **IA** | Ollama (`qwen2.5:3b`, `paraphrase-multilingual`), RAG hybride maison, garde-fous déterministes |
| **Voix** | Transformers + PyAV, Whisper-small (FR) et Whisper-small wolof, sur processeur |
| **Données** | PostgreSQL 16 + pgvector (production), SQLite (développement), Redis (cache volatil) |
| **Exploitation** | Docker Compose, Nginx, Prometheus, Grafana, psutil |
| **Tests** | pytest, Jest, vérification TypeScript |

---

## 📂 Arborescence du dépôt

```text
SUNUSAFEGUARD/
├── ai-engine/                 Moteur IA (Python, indépendant du web)
│   ├── pipeline.py            Orchestration de la chaîne en 10 étapes
│   ├── safety/                Règles d'urgence, classification, contrôle de sortie, PII
│   ├── rag/                   Extraction, découpage, contexte, recherche hybride
│   ├── embeddings/            Embeddings Ollama et lexicaux (hashing)
│   ├── llm/                   Client Ollama, prompts, repli extractif, messages modèles
│   ├── multilingual/          Détection de langue, lexique wolof
│   ├── evaluation/            Évaluation RAG, calibrage du seuil
│   └── voice/                 Reconnaissance vocale Whisper
├── backend/                   API FastAPI
│   ├── app/
│   │   ├── main.py            Application, middleware, démarrage, purge planifiée
│   │   ├── api/routes/        auth, chat, directory, referrals, knowledge, rag,
│   │   │                      metrics, monitoring, users, voice
│   │   ├── core/              config, permissions (RBAC), sécurité, TOTP, débit
│   │   ├── models/            Modèles SQLAlchemy
│   │   ├── schemas/           Schémas Pydantic
│   │   ├── services/          Connaissances, indicateurs, rapports, conservation, audit
│   │   └── cli.py             Commandes : seed, evaluate, ai-status, import-orgs…
│   ├── migrations/            Migrations Alembic
│   └── tests/                 Tests pytest
├── frontend/                  Site web React (public + espaces professionnels)
│   ├── src/pages/public/      Accueil, Chat, Annuaire, Connexion, Confidentialité
│   ├── src/pages/dashboards/  Impact, Orientation, Ressources, Tech, Compte
│   └── mobile/                Application mobile Expo « Sunu »
├── data/
│   ├── knowledge_base/        Documents sources de l'assistant (Markdown)
│   ├── seed/                  Comptes, structures, numéros d'urgence
│   ├── evaluation/            Jeu de tests RAG
│   └── fixtures/              Fichiers d'exemple pour l'import
├── infrastructure/            Dockerfile du site, Nginx, PostgreSQL, Prometheus, sauvegardes
├── docs/                      Architecture, API, sécurité, base de données, déploiement, guides
├── scripts/                   Démarrage local (Windows, Unix), test de fumée
├── docker-compose.yml
├── Makefile
└── .env.example
```

---

## 🚀 Installation et démarrage

### Prérequis

| Outil | Version | Obligatoire |
|---|---|---|
| Python | 3.11 ou plus | Oui |
| Node.js | 20 ou plus | Oui |
| Ollama | récent | Non : sans lui, l'assistant répond par extraits |
| Docker + Docker Compose | récent | Seulement pour la pile complète |

### Option 1 — Démarrage local sans Docker

**Windows (PowerShell)**

```powershell
git clone https://github.com/Dioumadev221/SUNUSAFEGUARD.git
cd SUNUSAFEGUARD
copy .env.example .env
.\scripts\dev.ps1
```

**Linux / macOS / WSL**

```bash
git clone https://github.com/Dioumadev221/SUNUSAFEGUARD.git
cd SUNUSAFEGUARD
cp .env.example .env
make install    # une seule fois
make backend    # terminal 1 → http://localhost:8000/api/docs
make frontend   # terminal 2 → http://localhost:5173
```

Au premier démarrage, une base SQLite est créée et remplie avec des données d'exemple :
documents indexés, structures, comptes et activité **synthétique** pour les graphiques.

### Option 2 — Pile complète avec Docker

```bash
cp .env.example .env          # puis changer JWT_SECRET, DATA_ENCRYPTION_KEY et les mots de passe
docker compose up -d --build  # http://localhost:8080
docker compose --profile monitoring up -d   # en plus : Prometheus :9090 et Grafana :3000
```

```mermaid
flowchart LR
    U(["Navigateur :8080"]) --> FE["frontend<br/>Nginx + site compilé"]
    FE -->|/api| BE["backend :8000<br/>FastAPI"]
    BE --> PG[("postgres<br/>pgvector/pg16")]
    BE --> RD[("redis<br/>sans persistance")]
    BE --> OL["ollama<br/>modèles ~3 Go<br/>volume persistant"]
    PR["prometheus :9090"] -.-> BE
    GR["grafana :3000"] -.-> PR
```

### Activer l'IA générative (Ollama)

| Rôle | Modèle par défaut | Taille | Variable |
|---|---|---|---|
| Rédaction des réponses | `qwen2.5:3b` | ~2 Go | `OLLAMA_MODEL` |
| Embeddings sémantiques (FR + wolof approximatif) | `paraphrase-multilingual` | ~0,6 Go | `EMBEDDING_MODEL` |

1. Installer Ollama (Windows : `winget install Ollama.Ollama`).
2. Lancer le backend : les modèles manquants sont **téléchargés automatiquement en arrière-plan**
   (`OLLAMA_AUTO_PULL=true`), les documents sont réindexés et le seuil recalibré.
3. Vérifier l'état : `python -m app.cli ai-status` (dans `backend/`).

### Activer la reconnaissance vocale (optionnel)

```bash
cd backend
pip install --index-url https://download.pytorch.org/whl/cpu torch
pip install -r requirements-voice.txt
```

Les modèles Whisper (~1 Go) sont téléchargés une seule fois depuis Hugging Face au premier usage.

### Lancer l'application mobile

```powershell
.\scripts\dev-mobile.ps1      # API joignable sur le Wi-Fi (port 8001) + Expo
```

Puis ouvrir Expo Go sur un téléphone connecté au même Wi-Fi. Détails dans
[`frontend/mobile/README.md`](frontend/mobile/README.md).

### Commandes utiles

| Commande | Effet |
|---|---|
| `make test` | Tests backend + IA, puis vérification TypeScript du site |
| `make eval` | Évaluation du RAG sur `data/evaluation/rag_testset.json` |
| `make seed` | Recharge les données d'exemple |
| `make llm-local` | Télécharge les modèles dans un Ollama local |
| `make docker-up` / `make docker-down` | Démarre / arrête la pile Docker |
| `python -m app.cli import-orgs <fichier> --hide-demo` | Importe des structures réelles et masque les structures d'exemple |

---

## ⚙️ Configuration

Toute la configuration passe par des variables d'environnement (fichier `.env`, modèle dans
[`.env.example`](.env.example)). **Ne jamais committer `.env`.**

| Groupe | Variable | Défaut | Rôle |
|---|---|---|---|
| Application | `ENVIRONMENT` | `development` | `development` crée les tables et les données d'exemple |
| | `CORS_ORIGINS` | `http://localhost:5173,http://localhost:8080` | Origines autorisées |
| Base | `DATABASE_URL` | SQLite local | URL PostgreSQL en production |
| Sécurité | `JWT_SECRET` | *à changer* | Secret de signature des jetons |
| | `JWT_EXPIRE_MINUTES` | `60` | Durée de validité d'un jeton |
| | `DATA_ENCRYPTION_KEY` | *vide* | Clé Fernet des données d'orientation |
| | `DEMO_PASSWORD` | `SunuDemo2026!` | Mot de passe des comptes de test |
| IA | `LLM_PROVIDER` | `ollama` | `ollama` ou `none` (réponses par extraits uniquement) |
| | `OLLAMA_URL` | `http://127.0.0.1:11434` | Adresse d'Ollama (IPv4 pour éviter ~2 s de latence sous Windows) |
| | `OLLAMA_MODEL` | `qwen2.5:3b` | Modèle de génération |
| | `OLLAMA_AUTO_PULL` | `true` | Téléchargement automatique des modèles |
| | `EMBEDDING_PROVIDER` | `auto` | `auto`, `ollama` ou `hashing` |
| | `EMBEDDING_MODEL` | `paraphrase-multilingual` | Modèle d'embeddings |
| | `RAG_MIN_SCORE` | *calibré* | Seuil fixe (laisser vide pour le calibrage automatique) |
| | `RAG_TOP_K` | `4` | Nombre de segments recherchés |
| Confidentialité | `K_ANONYMITY_THRESHOLD` | `5` | Seuil de publication des indicateurs |
| | `RETENTION_*_DAYS` | voir plus haut | Durées de conservation |
| Protection | `RATE_LIMIT_CHAT` | `30/60` | Requêtes par fenêtre de secondes |
| | `RATE_LIMIT_LOGIN` | `10/60` | Idem pour la connexion |
| Orientation | `REFERRAL_ALERT_HOURS` | `24` | Délai avant alerte de non-réception |

Générer une clé de chiffrement :

```bash
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

---

## 👥 Comptes de test

Mot de passe commun : `SunuDemo2026!` (variable `DEMO_PASSWORD`). Ces comptes servent aux environnements de développement et de test.

| E-mail | Profil | Accès |
|---|---|---|
| `superadmin@sunusafeguard.local` | Super administrateur GREEN T | Tous les espaces, comptes, supervision |
| `operationnel@sunusafeguard.local` | Administrateur opérationnel | Impact, Orientation, Ressources |
| `utilisateur@sunusafeguard.local` | Utilisatrice de test (Awa) | Aucun espace d'administration |
| `utilisateur2@sunusafeguard.local` | Utilisatrice de test (Fatou) | Aucun espace d'administration |
| `tech@sunusafeguard.local` | Administrateur technique | Sunu Tech |
| `impact@…` / `analyste@…` | Responsable institutionnel / Analyste | Sunu Impact |
| `partenaire@…` / `social@…` | Responsable partenaire / Travailleuse sociale | Sunu Orientation, leur structure uniquement |
| `expert@…` / `linguiste@…` | Expert·es documentaire / linguistique | Sunu Ressources |

Les comptes `super_admin` et `admin_technique` sont invités à activer la double authentification
(page « Mon compte ») ; une fois activée, un code est demandé à chaque connexion.

---

## 🔌 API

Documentation interactive OpenAPI : **http://localhost:8000/api/docs**

| Famille | Routes principales | Accès |
|---|---|---|
| Authentification | `POST /api/auth/login`, `/register`, `/logout`, `/mfa/setup`, `/mfa/enable`, `/mfa/verify`, `/password`, `GET /api/auth/me` | public / connecté |
| Chat | `POST /api/chat`, `GET /api/emergency-contacts` | public |
| Voix | `POST /api/voice/transcribe`, `POST /api/voice/transcribe-base64` | public |
| Annuaire | `GET /api/directory`, `GET /api/directory/manage`, `POST` / `PUT /api/directory`, `POST /api/directory/{id}/availability`, `/validate`, `GET …/history` | public (validées) / partenaires / administrateurs |
| Mises en relation | `POST /api/referrals`, `GET /api/referrals/status/{code}`, `GET /api/referrals/mine`, `GET /api/referrals`, `PATCH /api/referrals/{id}`, `GET /api/referrals/stats`, `GET /api/referrals/alerts` | public / utilisateur / structure |
| Connaissances | `GET` / `POST /api/knowledge/documents`, `GET …/{id}`, `PATCH …/{id}/status`, `POST …/{id}/reindex` | expert·es |
| RAG | `POST /api/rag/playground`, `POST /api/rag/evaluate`, `GET /api/rag/evaluations`, `GET /api/rag/gaps` | expert·es, technique |
| Indicateurs et rapports | `GET /api/metrics/overview`, `GET /api/metrics/geo`, `GET /api/reports`, `GET /api/reports/export` | Sunu Impact |
| Comptes | `GET` / `POST /api/users`, `GET /api/users/roles`, `PATCH /api/users/{id}`, `POST /api/users/{id}/reset` | super admin / responsable partenaire |
| Supervision | `GET /api/health`, `/api/monitoring/services`, `/ai`, `/security`, `/retention`, `/ai-engine`, `POST …/retention/purge`, `POST …/ai-engine/reconnect`, `GET /api/audit`, `GET /metrics` | Sunu Tech |

Exemple :

```bash
curl -X POST http://localhost:8000/api/chat \
     -H "Content-Type: application/json" \
     -d '{"message": "Mën naa am ndimbal ?"}'
```

---

## ✅ Tests et qualité

```bash
make test   # pytest (backend + moteur IA) puis vérification TypeScript
make eval   # évaluation du RAG
```

| Suite | Fichier | Ce qui est vérifié |
|---|---|---|
| Moteur IA | `backend/tests/test_ai_engine.py` | Garde-fous, détection de langue, contrôle de sortie, injection de prompt |
| API | `backend/tests/test_api.py` | Contrôle d'accès, isolation des partenaires, seuil N ≥ 5, consentement, non-stockage des messages |
| Recherche hybride | `backend/tests/test_hybrid.py` | Score hybride, repli lexical, calibrage |
| Comptes et exploitation | `backend/tests/test_phase2.py` | Comptes, 2FA, limitation de débit, rapports PDF / Excel, purge |
| Mobile (serveur) | `backend/tests/test_mobile.py` | Canal mobile, limites de l'API vocale |
| Rôles | `backend/tests/test_roles.py` | Inscription, 3 profils, déconnexion, demandes rattachées au compte |
| Mobile (app) | `frontend/mobile/tests/logic.test.ts` | Calculatrice, disponibilité, conservation locale, lecture vocale |

Résultats d'évaluation RAG sur le jeu de référence (14 cas) : **rappel@4 = 93 %**, **MRR = 0,82**.

Un test de fumée de bout en bout est disponible dans `scripts/smoke_test.py`.

---

## ☁️ Déploiement

```mermaid
flowchart TB
    INTERNET(["Internet"]) -->|HTTPS 443| LB["Reverse proxy TLS<br/>Nginx"]
    subgraph SERVEUR["Serveur ou VM — Docker Compose"]
        LB --> FE["Site statique"]
        LB -->|/api| BE["Backend FastAPI<br/>1..n instances"]
        BE --> PG[("PostgreSQL + pgvector<br/>volume chiffré")]
        BE --> OL["Ollama<br/>CPU ou GPU"]
        BE --> RD[("Redis")]
        MON["Prometheus + Grafana"] -.-> BE
    end
    PG -->|backup-postgres.sh| BK[("Sauvegardes chiffrées<br/>hors site")]
    APP["📱 Application mobile<br/>build EAS (APK)"] -->|HTTPS| LB
```

Étapes et bonnes pratiques détaillées : [docs/deployment/README.md](docs/deployment/README.md).

---

## 🗺 Feuille de route

```mermaid
timeline
    title SunuSafeguard AI
    Version 1.0 — Disponible : Assistant FR/WO avec RAG et garde-fous : Annuaire et mise en relation : 4 tableaux de bord : Application mobile : 2FA, comptes, purge, rapports
    Prochaine version : Synthèse vocale wolof : Interface entièrement en wolof : Rôles gérés en base
    Ensuite : Recherche vectorielle pgvector : Déploiement multi-instances : Publication sur les stores
```

---

## 🧭 Bonnes pratiques d'exploitation

| Domaine | Recommandation |
|---|---|
| Contenus | Faire relire régulièrement `data/knowledge_base/` par des juristes et des professionnel·les psychosociaux |
| Urgences | Tenir à jour les numéros de `data/seed/emergency_contacts.json` |
| Wolof | Faire valider les évolutions du lexique (`ai-engine/multilingual/lexicon.py`) et des messages (`ai-engine/llm/fallback.py`) par des linguistes |
| Règles de sécurité | Revoir `ai-engine/safety/rules.py` avec des professionnel·les à chaque évolution |
| Annuaire | Maintenir structures, coordonnées et conventions de partenariat à jour |
| Données personnelles | Tenir à jour l'analyse d'impact relative à la protection des données |
| Infrastructure | TLS, rotation des secrets, sauvegardes chiffrées, tests d'intrusion réguliers |
| Mineures | Appliquer un protocole spécifique pour ce public |
| Montée en charge | Avec plusieurs instances backend, déplacer la limitation de débit vers Redis |

---

## 📖 Documentation complémentaire

| Document | Contenu |
|---|---|
| [Architecture](docs/architecture/README.md) | Composants et chaîne IA |
| [API](docs/api/README.md) | Familles de routes et exemples |
| [Sécurité et confidentialité](docs/security/README.md) | Garanties et travaux restants |
| [Base de données](docs/database/README.md) | Schéma, migrations, passage à pgvector |
| [Déploiement](docs/deployment/README.md) | Mise en production |
| [Charte UI](docs/user-guides/charte-ui.md) | Couleurs, typographie, composants |
| [Guide de démonstration](docs/user-guides/guide-demo.md) | Scénario de présentation |
| [Guide de l'application mobile](docs/user-guides/guide-app-mobile.md) | Utilisation de « Sunu » |
| [Moteur IA](ai-engine/README.md) | Détails du module `ai-engine` |

---

<div align="center">

**SunuSafeguard AI** — GREEN T SARL, Sénégal

*« Sunu » signifie « notre » en wolof : une plateforme pensée avec et pour les personnes qu'elle protège.*

</div>
