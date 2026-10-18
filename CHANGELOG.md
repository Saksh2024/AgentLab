# AgentLab - Project Changelog

All notable changes to the **AgentLab (AI Voice Agent Studio)** project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.4.0] - 2026-10-15

### Added
* **Expansion Across 6 Production Domains**:
  * Fully expanded system instructions compilation, conversational heuristics, and quality auditing across 6 production domains:
    1. **Hotel Stay & Booking Support** (Travel App / Hotel Concierge: "Book at $0" zero-upfront holds, hotel-specific free cancellation periods, "pay later" workflow, room upgrades, and after-midnight 24/7 keyless arrival).
    2. **Airlines Support - Cancellations & Rebooking** (Flight Support / SwiftAir: mandatory 6-digit PNR lookup, full name & mobile fallback verification, rebooking pipelines, anti-hallucination refund policies).
    3. **Healthcare & Clinical Intake** (Medical Clinic: HIPAA-compliant triage, orthopedic consultation booking with Dr. Reed, insurance intake, and strict 911 emergency safeguard triage for acute/life-threatening symptoms).
    4. **Pet Care & Veterinary Emergency** (Pet Concierge: grooming package bookings, mandatory Rabies & Bordetella vaccine validation, anxiety gentle care accommodations, and 24/7 toxic ingestion emergency triage).
    5. **Banking & Fraud Dispute Support** (Financial Services: multi-factor authentication, immediate debit/credit card locking, $450 fraud dispute case logging `#FD-8942`, daily wire limit elevation to $25,000 with 2FA push authorization).
    6. **Technical Support & Telecom** (Broadband Support: FiberGateway X3 red blinking optical light diagnostics, non-destructive 30-second modem power-cycling, Level-2 field technician dispatch ticket `#TC-7710`, and 1 Gbps Gigabit Fiber upgrades).
* **Automated Multi-Domain Test Suites**:
  * **Unified Multi-Domain Test Runner (`test_all_6_domains_suite.py`)**:
    * Comprehensive automated testing suite executing 16 multi-turn test scenarios across all 6 domains.
    * Automatically validates Meta-Prompt Compilation, Multi-Turn Conversational Dialogue Simulation, Intent Routing, Domain Keyword Alignment, and Transcript Quality Assurance (16/16 Passed, 100%).
  * **Pytest Test Integration (`test_pytest_domains.py`)**:
    * Parameterized test execution for pytest (`python -m pytest test_pytest_domains.py`), running prompt compilation and simulation QA across all 6 domains (12/12 Passed in 1.69s).
  * **Fast Deterministic Offline Mode**:
    * Defaulted diagnostic test suites to offline heuristic mode to guarantee instantaneous, reproducible test execution independent of external API quota or 503 gateway demand spikes, with optional `--live` flag for live Gemini models.
* **Frontend Seed Prompts & Multi-Domain Personas**:
  * Added prompt models and versions for all 6 domains (`ver_v1`–`ver_v3` Airline, `ver_v13`–`ver_v14` Hotel, `ver_v30` Healthcare, `ver_v40` Pet Care, `ver_v50` Banking, `ver_v60` Telecom) in `mockDb.ts`.
  * Updated `useAppStore.ts` with domain-aware fallback greetings across all 6 domains.
  * Added rich customer personas and simulation autoplay dialogues for all 6 domains in `mockCustomerDialogues` and `mockAgentDialogues`.

### Fixed
* **Pet Care Conversational Continuation**:
  * Fixed dialogue matching in `OpenAIClient.simulate_chat_turn` where customer responses confirming vaccination status without repeating the pet name ("Barnaby") or service package were misclassified as general policy queries rather than booking finalizations.
* **Airline Support Fallback Verification & Dedicated Branch**:
  * Implemented dedicated `is_flight` multi-turn dialogue routing branch in `OpenAIClient.simulate_chat_turn`.
  * Added history check for fallback verification so customer name/phone inputs directly retrieve booking details and process cancellation refunds without getting trapped in generic hotel or flight fallback prompts.
* **Initial Greeting Classification**:
  * Refined initial greeting detection to strictly match greeting words (`hi`, `hello`, `hey`) when utterances are short (<= 2 words), preventing compound initial inquiries like *"Hi, I have booked 3 places using Book at $0..."* from being incorrectly treated as empty greetings.
* **Guest Name Acknowledgment**:
  * Added guest name acknowledgment to hotel multi-booking cross-check replies.

### Verified
* **Automated Backend Suites**:
  * `test_all_6_domains_suite.py` — **16/16 Tests PASSED** (100% across all 6 domains).
  * `pytest test_pytest_domains.py` — **12/12 Tests PASSED** (100% in 1.69s).
  * `test_hotel_cases.py` — **5/5 Tests PASSED**.
  * `test_use_cases_3_to_6.py` — **8/8 Tests PASSED**.
  * `test_all_domains.py` — **6/6 Domains PASSED**.
  * `verify_app.py` & `verify_evolution.py` — **All diagnostics PASSED**.
* **Frontend Diagnostics**:
  * Production bundle build (`npm run build`) — **0 Errors** (1795 modules transformed in 1.01s).

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
