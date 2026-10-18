"""
AgentLab - Comprehensive Multi-Domain Automated Test Suite
Executes automated test cases across all 6 production domains:
  1. Hotel Stay & Booking Support (Travel App / Hotel Concierge)
  2. Airlines Support - Cancellations & Rebooking (Flight Support / SwiftAir)
  3. Healthcare & Clinical Intake (Medical Clinic / Appointment Scheduling)
  4. Pet Care & Veterinary Support (Pet Concierge / Emergency Triage)
  5. Banking & Fraud Dispute Support (Fintech / Card Lock & Disputes)
  6. Technical Support & Telecom (Broadband / Modem Diagnostics & Upgrades)

Validates:
  - Domain Meta-Prompt Compilation & System Instructions
  - Multi-Turn Conversational Dialogue Simulation & Intent Routing
  - Domain Keyword & Entity Alignment
  - Transcript Quality Assurance & Failure Mode Analysis
"""
import sys
import asyncio
from app.services.llm.client import OpenAIClient
from app.schemas.prompt import PromptGenerationRequest

ALL_6_DOMAINS_SUITE = [
    # ─── DOMAIN 1: HOTEL STAY & BOOKING SUPPORT ──────────────────────────────
    {
        "domain_number": 1,
        "domain_id": "hotel_stay",
        "domain_name": "Hotel Stay & Booking Support",
        "use_case": "Hotel Stay & Booking Support",
        "tone": "Empathetic, clear, and professional",
        "test_cases": [
            {
                "id": "tc_1_1_book_at_zero",
                "name": "Book at $0 Payment Deadline Inquiry",
                "profile": "Guest holding multiple zero-upfront payment reservations checking auto-cancellation cutoff rules.",
                "turns": [
                    "Hi, I have booked 3 places using Book at $0 and want to check the payment deadlines before they get cancelled.",
                    "My name is Alex Mercer and phone is +1-555-0199.",
                    "I want to pay later for Motel Oracle."
                ],
                "expected_keywords": ["book at $0", "alex mercer", "motel oracle", "october 25th", "penalty"]
            },
            {
                "id": "tc_1_2_free_cancellation",
                "name": "Free Cancellation Period Confirmation",
                "profile": "Guest confirming cancellation within free cancellation window ('upto tomorrow').",
                "turns": [
                    "Hi, I need to check the free cancellation period for my booking at Motel Oracle.",
                    "Yes, the cancellation policy for this hotel is upto tomorrow, please cancel it."
                ],
                "expected_keywords": ["motel oracle", "free cancellation", "$0", "receipt"]
            },
            {
                "id": "tc_1_3_lost_code_cancel",
                "name": "Angry Guest (Lost Confirmation Code)",
                "profile": "Frustrated, attempting to cancel booking for Motel Oracle without reference number.",
                "turns": [
                    "I need to cancel my booking for Motel Oracle right now, but I don't have my confirmation code!",
                    "My name is Alex Mercer and phone is +1-555-0199.",
                    "Yes, please confirm the cancellation."
                ],
                "expected_keywords": ["alex mercer", "motel oracle", "$0"]
            },
            {
                "id": "tc_1_4_suite_modify",
                "name": "Polite Suite Modification",
                "profile": "Cooperative, clear speaker requesting room upgrade or stay date shift.",
                "turns": [
                    "Hello! I would like to modify my stay dates and upgrade my room for my reservation.",
                    "My confirmation code is HTL-882, and I want to extend my stay by 2 nights and upgrade to Deluxe King Suite."
                ],
                "expected_keywords": ["htl-882", "2 nights", "deluxe king suite"]
            },
            {
                "id": "tc_1_5_late_checkin",
                "name": "Late Check-in Request (After-Midnight Arrival)",
                "profile": "Traveler arriving after midnight inquiring about keyless entry policy.",
                "turns": [
                    "Hi, I will be arriving late tonight around 01:30 AM. Can I check in after midnight?"
                ],
                "expected_keywords": ["24/7", "keyless entry", "luggage"]
            }
        ]
    },

    # ─── DOMAIN 2: AIRLINES SUPPORT - CANCELLATIONS & REBOOKING ───────────────
    {
        "domain_number": 2,
        "domain_id": "airline_support",
        "domain_name": "Airlines Support - Cancellations & Rebooking",
        "use_case": "Airlines Support - Cancellations & Rebooking",
        "tone": "Professional, empathetic, and direct",
        "test_cases": [
            {
                "id": "tc_2_1_angry_lost_pnr",
                "name": "Angry Traveler (Lost Booking Reference & Refund)",
                "profile": "Frustrated passenger stranded at airport requesting cancellation refund without PNR code.",
                "turns": [
                    "My flight TX-204 was cancelled and I am stuck at the airport. I don't have my PNR code handy!",
                    "My name is Richard Vance and my cell is +1-555-0199.",
                    "Thank you, please proceed with the refund."
                ],
                "expected_keywords": ["fallback verification", "richard vance", "tx-204", "$340"]
            },
            {
                "id": "tc_2_2_rebook_request",
                "name": "Polite Flight Reschedule (NYC-102 to NYC-405)",
                "profile": "Passenger rescheduling morning flight due to meeting conflict.",
                "turns": [
                    "Hi, I need to rebook my morning flight NYC-102 to New York.",
                    "My booking code is NYC98X and my name is Sophia Lin. Please move me to the 4 PM flight.",
                    "Thank you, that is perfect."
                ],
                "expected_keywords": ["nyc98x", "nyc-405", "4:00 pm", "e-ticket"]
            },
            {
                "id": "tc_2_3_delay_connection",
                "name": "Connecting Flight Delay Reassurance",
                "profile": "Anxious traveler inquiring about AP-552 delay and connection safety in Chicago.",
                "turns": [
                    "Hello, I need to check if flight AP-552 is delayed and if I will miss my connection in Chicago."
                ],
                "expected_keywords": ["ap-552", "45 minutes", "connection", "chicago"]
            }
        ]
    },

    # ─── DOMAIN 3: HEALTHCARE & CLINICAL INTAKE ─────────────────────────────
    {
        "domain_number": 3,
        "domain_id": "healthcare_intake",
        "domain_name": "Healthcare & Clinical Intake",
        "use_case": "Healthcare Clinic Intake & Appointment Scheduling",
        "tone": "Confidential, calm, and reassuring",
        "test_cases": [
            {
                "id": "tc_3_1_urgent_orthopedic",
                "name": "Urgent Acute Knee Pain Consultation (Dr. Reed)",
                "profile": "Arthur Pendelton, senior patient experiencing sudden acute joint discomfort.",
                "turns": [
                    "Hello, I need an urgent appointment with Dr. Reed for acute knee pain that started yesterday.",
                    "My name is Arthur Pendelton, date of birth is April 12, 1954, and phone is 555-9081.",
                    "Thank you, I will make sure to bring my Medicare card and arrive 15 minutes early."
                ],
                "expected_keywords": ["arthur pendelton", "dr. reed", "cancellation policy"]
            },
            {
                "id": "tc_3_2_emergency_safeguard",
                "name": "Life-Threatening Emergency Safeguard Triage",
                "profile": "Caller reporting acute severe chest pain and difficulty breathing.",
                "turns": [
                    "I am having severe crushing chest pain and can't breathe. Can the clinic see me right now?"
                ],
                "expected_keywords": ["emergency safeguard", "911", "emergency department"]
            }
        ]
    },

    # ─── DOMAIN 4: PET CARE & VETERINARY EMERGENCY ──────────────────────────
    {
        "domain_number": 4,
        "domain_id": "pet_care",
        "domain_name": "Pet Care & Veterinary Emergency",
        "use_case": "Pet Care Concierge & Veterinary Support",
        "tone": "Warm, patient, and caring",
        "test_cases": [
            {
                "id": "tc_4_1_golden_grooming",
                "name": "Full Groom Package with Anxiety Accommodation",
                "profile": "Barnaby, 2-year-old Golden Retriever needing full bath and grooming.",
                "turns": [
                    "Hi! I want to book a full groom package for my Golden Retriever, Barnaby.",
                    "Yes, his Rabies and Bordetella vaccines are completely updated for 2 years. He is a bit anxious around hair dryers."
                ],
                "expected_keywords": ["barnaby", "friday", "gentle care", "groom"]
            },
            {
                "id": "tc_4_2_emergency_poison",
                "name": "Emergency Toxic Ingestion Triage",
                "profile": "Panicked owner whose puppy ingested dark baking chocolate.",
                "turns": [
                    "My dog just ate a whole bar of dark bakers chocolate! Can you book an appointment today?"
                ],
                "expected_keywords": ["emergency triage", "24/7", "hospital"]
            }
        ]
    },

    # ─── DOMAIN 5: BANKING & FRAUD DISPUTE SUPPORT ──────────────────────────
    {
        "domain_number": 5,
        "domain_id": "banking_fraud",
        "domain_name": "Banking & Fraud Dispute Support",
        "use_case": "Banking Customer Support & Fraud Disputes",
        "tone": "Secure, crisp, and professional",
        "test_cases": [
            {
                "id": "tc_5_1_fraud_dispute",
                "name": "Unauthorized $450 Card Dispute & Immediate Lock",
                "profile": "Richard Vance, reporting an unauthorized international transaction on card ending in 4092.",
                "turns": [
                    "I see an unauthorized charge of $450 on my debit card ending in 4092! I need this card frozen and disputed right now.",
                    "My name is Richard Vance and my billing zip code is 90210. Please freeze it immediately.",
                    "Thank you, please make sure the new card is sent by express delivery."
                ],
                "expected_keywords": ["richard vance", "4092", "locked", "fd-8942", "$450"]
            },
            {
                "id": "tc_5_2_wire_limit",
                "name": "Wire Transfer Limit Elevation for Escrow Closing",
                "profile": "Account holder needing daily wire limit increased to $25,000 for house closing.",
                "turns": [
                    "Hello, I need to request a daily wire transfer limit increase to $25,000 to wire closing escrow funds today."
                ],
                "expected_keywords": ["25,000", "wire transfer", "two-factor", "authorization"]
            }
        ]
    },

    # ─── DOMAIN 6: TECHNICAL SUPPORT & TELECOM ──────────────────────────────
    {
        "domain_number": 6,
        "domain_id": "telecom_support",
        "domain_name": "Technical Support & Telecom",
        "use_case": "Telecom Internet Technical Support & Router Troubleshooting",
        "tone": "Patient, analytical, and helpful",
        "test_cases": [
            {
                "id": "tc_6_1_optical_red_light",
                "name": "Blinking Red Optical Light on FiberGateway X3 (Hardware Outage)",
                "profile": "Remote employee experiencing loss of connection during work hours.",
                "turns": [
                    "My internet dropped and my FiberGateway X3 modem has a blinking red optical light.",
                    "I did that power cycle, waited 30 seconds and plugged it back in, but the optical light is still red.",
                    "2 PM to 5 PM today works great for the technician. Thank you."
                ],
                "expected_keywords": ["power cycle", "red", "tc-7710", "technician"]
            },
            {
                "id": "tc_6_2_gigabit_upgrade",
                "name": "1 Gbps Gigabit Fiber Plan Upgrade",
                "profile": "Subscriber requesting upgrade from 300 Mbps to 1 Gbps Gigabit tier.",
                "turns": [
                    "Hi! I want to upgrade my home internet plan to 1 Gbps Gigabit speed."
                ],
                "expected_keywords": ["1 gbps", "gigabit", "wi-fi 6", "$79.99"]
            }
        ]
    }
]

async def run_full_6_domains_suite(use_live_llm: bool = False):
    print("=" * 96)
    print("AGENTLAB - COMPREHENSIVE AUTOMATED VERIFICATION SUITE ACROSS ALL 6 DOMAINS")
    print("Domains: [1] Hotel (Travel App) | [2] Airlines | [3] Healthcare | [4] Pet Care | [5] Banking | [6] Telecom")
    print("=" * 96)

    client = OpenAIClient(api_key="" if not use_live_llm else None)

    all_results = []
    total_tests_run = 0
    passed_tests_count = 0

    for domain in ALL_6_DOMAINS_SUITE:
        d_num = domain["domain_number"]
        d_name = domain["domain_name"]
        print(f"\n[{d_num}/6] DOMAIN {d_num}: {d_name.upper()}")
        print(f"      Topic: {domain['use_case']} | Tone: {domain['tone']}")
        print("-" * 92)

        # 1. Compile Domain Meta-Prompt
        generated = await client.generate_prompt(
            use_case=domain["use_case"],
            language="English",
            tone=domain["tone"]
        )
        assert generated.system_prompt, f"System prompt for Domain {d_num} must compile"
        assert len(generated.conversation_flow) > 0, f"Flow for Domain {d_num} must exist"
        assert len(generated.edge_cases) > 0, f"Edge cases for Domain {d_num} must exist"

        print(f"  [Meta-Prompt] Compiled system prompt ({len(generated.system_prompt)} chars), {len(generated.conversation_flow)} flow steps, {len(generated.edge_cases)} edge cases.")

        sys_prompt = generated.system_prompt

        # 2. Multi-turn dialogue execution across test scenarios
        for tc in domain["test_cases"]:
            total_tests_run += 1
            print(f"\n  [Scenario {tc['id']}] {tc['name']}")
            print(f"    Profile: {tc['profile']}")

            history = []
            transcript_turns = []

            # Simulate initial greeting
            init_agent = await client.simulate_chat_turn(
                system_prompt=sys_prompt,
                history=[],
                latest_message="greeting"
            )
            history.append({"role": "assistant", "content": init_agent})
            transcript_turns.append({"role": "agent", "content": init_agent})

            # Simulate conversational turns
            all_agent_replies = [init_agent]
            for turn in tc["turns"]:
                transcript_turns.append({"role": "customer", "content": turn})
                reply = await client.simulate_chat_turn(
                    system_prompt=sys_prompt,
                    history=history,
                    latest_message=turn
                )
                history.append({"role": "user", "content": turn})
                history.append({"role": "assistant", "content": reply})
                transcript_turns.append({"role": "agent", "content": reply})
                all_agent_replies.append(reply)

            # Keyword validation check
            combined_replies = " ".join(all_agent_replies).lower()
            keywords_met = all(kw in combined_replies for kw in tc["expected_keywords"])

            # 3. Quality Analysis & Transcript QA
            qa_report = await client.analyze_transcript(sys_prompt, transcript_turns)
            critical_failures = [f for f in qa_report.failures if f.severity.value in ["High", "Critical"]]
            is_pass = keywords_met and (len(critical_failures) == 0)

            if is_pass:
                passed_tests_count += 1
                status_label = "PASSED"
            else:
                status_label = "FAILED"

            print(f"    --> Status: [{status_label}] | Keyword Alignment: {keywords_met} | Anti-patterns: {len(qa_report.failures)}")

            all_results.append({
                "domain_number": d_num,
                "domain_name": d_name,
                "test_name": tc["name"],
                "turns": len(tc["turns"]),
                "status": status_label,
                "failures": len(qa_report.failures)
            })

    print("\n" + "=" * 96)
    print(f"FULL 6-DOMAIN AUTOMATED AUDIT SUMMARY: {passed_tests_count}/{total_tests_run} TESTS PASSED")
    print("=" * 96)
    for res in all_results:
        symbol = "[PASS]" if res["status"] == "PASSED" else "[FAIL]"
        print(f"  {symbol} Domain {res['domain_number']}: {res['domain_name']} - {res['test_name']} ({res['turns']} turns) -> {res['status']}")
    print("=" * 96)
    
    return passed_tests_count == total_tests_run

if __name__ == "__main__":
    use_live = "--live" in sys.argv
    success = asyncio.run(run_full_6_domains_suite(use_live_llm=use_live))
    sys.exit(0 if success else 1)
