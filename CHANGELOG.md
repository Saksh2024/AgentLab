# AgentLab - Project Changelog

All notable changes to the **AgentLab (AI Voice Agent Studio)** project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.3.0] - 2026-09-22

### Added
* **Context-Aware Intent Parsing ("Pay Later" / "Pay at Hotel" / "Hold Active")**:
  * Upgraded multi-turn dialogue engine to understand natural user sub-intents when responding to property selection prompts.
  * When a customer requests to *"pay later"*, *"pay at hotel"*, or *"keep hold active"*, the agent respects their preference, keeps the "Book at $0" hold active, confirms the payment deadline date, and asks if remaining holds should stay open or be released, rather than forcing immediate payment or prematurely releasing remaining holds.
* **Multi-Booking & "Book at $0" Finalization Workflow**:
  * Implemented multi-turn dialog flow for customers managing multiple "Book at $0" reservations simultaneously.
  * Agent prompts for registered name/phone verification to cross-check active holds, lists held properties with payment deadlines, and allows finalizing one property while automatically releasing unselected holds with $0 penalty.
* **Travel App Domain Meta-Prompt Compiler Upgrade**:
  * Updated Prompt Studio generator (`_heuristic_generate_prompt`) for Hotel/Travel App domain to natively generate system instructions, dialogue pipelines, and edge case rules for hotel-specific free cancellation periods, "Book at $0" payment cutoff rules, and "pay later" user preferences.

### Fixed
* **Flawed Confirmation Reference Code Regex Bug**:
  * Replaced greedy `\b[A-Za-z0-9]{6,8}\b` regex with strict alphanumeric pattern requiring digits (`\b(htl|res|pnr|ref|bk)[-_]?[0-9a-z]{3,6}\b`).
  * Fixed bug where standard English words of length 6-8 (like `"booked"`, `"places"`, `"finalize"`) were misidentified as confirmation codes, causing canned cancellation responses.
* **Property Entity Extraction Filter**:
  * Added disqualified words filter (`["cancellation", "policy", "yes", "option", "tomorrow", ...]`) to prevent phrases like *"yes the cancellation policy for this hotel is upto tomororrow"* from being extracted as hotel names.

---

## [1.2.0] - 2026-09-20

### Added
* **Dynamic Domain Customer Profiles**:
  * Created `getDomainCustomerProfiles` helper in `frontend/src/services/mockDb.ts`.
  * Updated `SimulatorPage.tsx` so Customer Profiles dynamically adapt to the active prompt version's domain (e.g., Hotel Booking personas: *Angry Guest (Lost Confirmation Code)*, *Polite Suite Modification*, *Late Check-in Request*, *Non-refundable Rate Cancellation*).
* **Comprehensive Project Documentation**:
  * Created `KNOWLEDGE_BASE.md` detailing system architecture, module breakdowns, API specifications, and local execution guides.
  * Created `CHANGELOG.md` tracking all historical and current releases.

### Fixed
* **Simulator Intent Classifier & Keyword Collision**:
  * Fixed keyword collision where messages containing `"bookings"` (e.g. *"i would like to cancel my bookings for motel oracle"*) triggered new booking logic instead of cancellation.
  * Re-ordered intent classification pipeline to prioritize **Cancellation & Refund** (`cancel`, `refund`) and **Modifications** (`rebook`, `modify`, `change date`) over generic booking keywords.
* **Entity Extraction & Context Awareness**:
  * Added property/hotel name parsing (e.g. *"Motel Oracle"*) to acknowledge user context in responses.
  * Updated cancellation turns to request booking confirmation codes or registered contact numbers instead of asking redundant check-in/check-out questions.
* **Backend Connection ("Failed to Fetch")**:
  * Launched background FastAPI backend service on `http://127.0.0.1:8000` with CORS support and SQLite DB initialization.
  * Configured Vite frontend dev server on `http://localhost:5173/`.

### Verified
* **Frontend Diagnostics**:
  * TypeScript type check (`tsc --noEmit`) — **0 Errors**.
  * Code linter check (`oxlint`) — **0 Errors**.
  * Vite production build (`vite build`) — **0 Errors**, 1795 modules transformed.

---

## [1.1.0] - 2026-08-01

### Added
* **SQLite Persistence Layer**:
  * Added `agentlab.db` SQLite database integration for storing prompt versions and revision histories.
* **Heuristic Offline Compiler**:
  * Implemented deep domain keyword compiler in `OpenAIClient` allowing prompt generation, simulation, and quality evaluation to function seamlessly offline when `OPENAI_API_KEY` is unconfigured.
* **Transcript Quality Analyzer**:
  * Integrated failure mode classification (`Ignored Customer Statement`, `Hallucination`, `Poor Empathy`, `Overly Verbose`) with auto-evolution prompt patching.

---

## [1.0.0] - 2026-07-08

### Added
* Initial release of **AgentLab (AI Voice Agent Studio)**.
* Core React 19 + TypeScript + Vite frontend with Tailwind CSS v4 styling.
* Initial single-page prompt compilation, simulator deck, and evolution diff interfaces.
* Initial seed data for Airline Customer Support agent personas.
