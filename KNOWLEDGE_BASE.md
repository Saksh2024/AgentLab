# AgentLab - AI Voice Agent Studio Knowledge Base

## Overview
**AgentLab (AI Voice Agent Studio)** is an end-to-end web application and backend platform designed for creating, evaluating, simulating, and auto-evolving system prompts for AI voice agents across diverse application domains (e.g., Hotel Reservations, Flight Support, Healthcare/Clinic Intake, Pet Care, Financial Services, and Technical Support).

---

## Technical Architecture

```
                               ┌──────────────────────────────────────────┐
                               │             React 19 Frontend            │
                               │        (Vite + Tailwind CSS v4)          │
                               └────────────────────┬─────────────────────┘
                                                    │
                                         HTTP API   │ (port 8000)
                                                    ▼
                               ┌──────────────────────────────────────────┐
                               │           FastAPI Python Backend         │
                               │           (App Router & Services)        │
                               └──────────┬──────────────────────┬────────┘
                                          │                      │
                   Structured Outputs     │                      │ SQL Storage
                                          ▼                      ▼
                               ┌──────────────────┐    ┌──────────────────┐
                               │   OpenAI API /   │    │    SQLite DB     │
                               │ Heuristic Engine │    │  (agentlab.db)   │
                               └──────────────────┘    └──────────────────┘
```

### Frontend Stack
* **Framework**: React 19 + TypeScript + Vite 8
* **Styling**: Tailwind CSS v4 + Lucide Icons
* **State Management**: Zustand (`useAppStore`)
* **Routing**: React Router DOM (`/`, `/studio`, `/simulator`, `/analyzer`, `/evolution`)
* **Form Handling**: React Hook Form

### Backend Stack
* **Framework**: FastAPI + Uvicorn (`http://localhost:8000`)
* **Database**: SQLite (`agentlab.db`) via SQLAlchemy / Direct Connection
* **LLM Integration**: `AsyncOpenAI` client with Structured Outputs parsing (`gpt-4o`, `gpt-4o-mini`).
* **Offline Fallback Engine**: Deep domain-specific heuristic compiler and dialogue simulator operating when `OPENAI_API_KEY` is absent or unconfigured.

---

## Core Feature Modules

### 1. Dashboard (`/`)
* **Metrics Overview**: Real-time KPI cards displaying total active prompt versions, simulation runs, transcript failure counts, and average success scores.
* **Prompt Version Timeline**: Displays active prompt instruction releases, gain percentages, and line modification counts.
* **Transcript Failure Breakdown**: Displays severity and category distribution for evaluated conversations.

### 2. Prompt Studio (`/studio`)
* **Domain Meta-Compiler**: Compiles tailored system prompts, dialogue pipelines, and domain guardrails based on use-case inputs, language, and brand tone.
* **Registry Commit**: Persists new prompt versions into SQLite and activates them across the application.

### 3. Simulator Deck (`/simulator`)
* **Live Audio/Text Sandbox**: Simulates turn-based customer conversations against active prompt versions.
* **Dynamic Domain Customer Profiles**: Automatically detects the domain of the active prompt version and loads matching test personas (e.g. Hotel Guest, Patient, Pet Owner).
* **Intent & Entity Processing**: Smart intent classifier prioritizing cancellations, modifications, and refunds over generic keywords, with entity extraction (e.g., hotel names).

### 4. Quality Analyzer (`/analyzer`)
* **Transcript QA Evaluator**: Scans conversation turns for anti-patterns:
  * `Ignored Customer Statement` (e.g., missing fallback verification when primary code is lost)
  * `Hallucination` (e.g., missing fee/refund clarity)
  * `Poor Empathy` (e.g., transactional tone under customer frustration)
  * `Overly Verbose` (e.g., utterances exceeding 2-3 sentences)
* **Auto-Evolution Engine**: Synthesizes targeted rules to patch identified vulnerabilities and outputs an evolved system prompt.

### 5. Prompt Evolution (`/evolution`)
* **Version Diff Registry**: Compares prompt versions side-by-side with line-by-line diff highlighting, change descriptions, and score gain history.

---

## Backend API Specification

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/v1/prompts/generate` | Generates system instructions, dialogue pipeline, and edge cases. |
| `POST` | `/api/v1/simulator/chat` | Processes a turn in the simulator and returns the voice agent response. |
| `POST` | `/api/v1/analyzer/evaluate` | Evaluates a transcript for failure modes and returns an improved prompt. |
| `GET` | `/api/v1/versions/` | Fetches all prompt versions from SQLite database. |
| `POST` | `/api/v1/versions/` | Persists a new prompt version to SQLite database. |
| `GET` | `/health` | Health check endpoint returning backend status. |

---

## Running locally

1. **Backend**:
   ```bash
   cd backend
   .venv\Scripts\python.exe -m uvicorn app.main:app --port 8000
   ```

2. **Frontend**:
   ```bash
   cd frontend
   npm run dev
   ```
   * App UI available at: `http://localhost:5173/`
