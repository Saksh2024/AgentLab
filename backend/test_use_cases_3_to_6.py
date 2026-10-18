import sys
import asyncio
from app.services.llm.client import OpenAIClient
from app.schemas.prompt import PromptGenerationRequest

SUITE_USE_CASES = [
    # ─── USE CASE 3: HEALTHCARE & CLINICAL INTAKE ─────────────────────────────
    {
        "id": "uc3_healthcare",
        "domain_number": 3,
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
                "expected_keywords": ["arthur pendelton", "10:30 am", "dr. reed", "cancellation policy"]
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

    # ─── USE CASE 4: PET CARE & VETERINARY EMERGENCY ──────────────────────────
    {
        "id": "uc4_pet_care",
        "domain_number": 4,
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

    # ─── USE CASE 5: BANKING & FRAUD DISPUTE SUPPORT ──────────────────────────
    {
        "id": "uc5_banking",
        "domain_number": 5,
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

    # ─── USE CASE 6: TECHNICAL SUPPORT & TELECOM ──────────────────────────────
    {
        "id": "uc6_telecom",
        "domain_number": 6,
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

async def run_suite_3_to_6(use_live_llm: bool = False):
    print("=" * 90)
    print("AGENTLAB - COMPREHENSIVE VERIFICATION SUITE FOR USE CASES 3 TO 6")
    print("Domains: Healthcare (3), Pet Care (4), Banking & Fraud (5), Telecom & Router Support (6)")
    print("=" * 90)

    # Initialize client (offline mode ensures immediate execution and reproducibility)
    client = OpenAIClient(api_key="" if not use_live_llm else None)

    all_results = []
    total_tests_run = 0
    passed_tests_count = 0

    for domain in SUITE_USE_CASES:
        d_num = domain["domain_number"]
        d_name = domain["domain_name"]
        print(f"\n[{d_num}/6] EXECUTING USE CASE {d_num}: {d_name.upper()}")
        print(f"      Domain Topic: {domain['use_case']}")
        print(f"      Target Tone:  {domain['tone']}")
        print("-" * 85)

        # 1. Compile Domain Meta-Prompt
        print("  [Step 1] Compiling Domain Meta-Prompt & System Instructions...")
        generated = await client.generate_prompt(
            use_case=domain["use_case"],
            language="English",
            tone=domain["tone"]
        )
        assert generated.system_prompt, "System prompt must be compiled"
        assert len(generated.conversation_flow) > 0, "Conversation flow must exist"
        assert len(generated.edge_cases) > 0, "Edge cases must be compiled"
        
        print(f"      [OK] System Prompt Length: {len(generated.system_prompt)} chars")
        print(f"      [OK] Flow Steps ({len(generated.conversation_flow)}): {generated.conversation_flow[:2]}")
        print(f"      [OK] Edge Cases ({len(generated.edge_cases)}): {[ec.scenario[:45] for ec in generated.edge_cases[:2]]}")

        # 2. Test Multi-Turn Dialogues
        sys_prompt = generated.system_prompt

        for tc in domain["test_cases"]:
            total_tests_run += 1
            print(f"\n  [Step 2 - Test Scenario {tc['id']}] {tc['name']}")
            print(f"        Customer Persona: {tc['profile']}")

            history = []
            transcript_turns = []

            # Simulate initial greeting
            init_agent = await client.simulate_chat_turn(
                system_prompt=sys_prompt,
                history=[],
                latest_message="greeting"
            )
            print(f"        [AGENT]: {init_agent}")
            history.append({"role": "assistant", "content": init_agent})
            transcript_turns.append({"role": "agent", "content": init_agent})

            # Simulate conversational turns
            all_agent_replies = [init_agent]
            for turn in tc["turns"]:
                print(f"        [USER]:  {turn}")
                transcript_turns.append({"role": "customer", "content": turn})

                reply = await client.simulate_chat_turn(
                    system_prompt=sys_prompt,
                    history=history,
                    latest_message=turn
                )
                print(f"        [AGENT]: {reply}")
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

            print(f"        --> QA Audit Status: [{status_label}] | Keyword Alignment: {keywords_met} | Anti-patterns: {len(qa_report.failures)}")
            for f in qa_report.failures:
                print(f"            * [{f.severity.value}] {f.failure_type.value}: {f.reason[:75]}...")

            all_results.append({
                "domain_number": d_num,
                "domain_name": d_name,
                "test_name": tc["name"],
                "turns": len(tc["turns"]),
                "status": status_label,
                "failures": len(qa_report.failures),
                "summary": qa_report.improvement_summary[:80]
            })

    print("\n" + "=" * 90)
    print(f"FINAL AUDIT SUMMARY: {passed_tests_count}/{total_tests_run} TESTS PASSED (USE CASES 3 TO 6)")
    print("=" * 90)
    for res in all_results:
        symbol = "[PASS]" if res["status"] == "PASSED" else "[FAIL]"
        print(f"  {symbol} UC {res['domain_number']} ({res['domain_name']}) - {res['test_name']} ({res['turns']} turns) -> {res['status']}")
    print("=" * 90)

if __name__ == "__main__":
    use_live = "--live" in sys.argv
    asyncio.run(run_suite_3_to_6(use_live_llm=use_live))
