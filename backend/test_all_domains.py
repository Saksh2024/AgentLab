"""
AgentLab - Multi-Domain Diagnostic Verification Script
Tests prompt compilation, simulation heuristics, and evaluation logic across 6 domain scenarios:
1. Hotel Stay & Booking Support
2. Airline Cancellations & Rebooking
3. Healthcare & Clinical Intake
4. Pet Care & Veterinary Emergency
5. Banking & Fraud Dispute Support
6. Technical Support & Telecom
"""
import sys
import asyncio
import logging
from app.schemas.prompt import PromptGenerationRequest
from app.schemas.analyzer import TranscriptAnalysisRequest
from app.services.llm.client import OpenAIClient
from app.services.prompt_service import PromptService
from app.services.analyzer_service import AnalyzerService

logging.basicConfig(level=logging.INFO, format="%(levelname)s:%(name)s:%(message)s")

DOMAINS_TO_TEST = [
    {
        "name": "Hotel Stay & Booking Support",
        "use_case": "Hotel Stay & Booking Support",
        "tone": "Empathetic, clear, and professional",
        "sample_turn": "I have 3 Book at $0 holds and want to pay later for Motel Oracle."
    },
    {
        "name": "Airline Cancellations & Rebooking",
        "use_case": "Airlines Support - Cancellations & Rebooking",
        "tone": "Professional, empathetic, and direct",
        "sample_turn": "My flight TX-204 was cancelled and I do not have my PNR code."
    },
    {
        "name": "Healthcare & Clinical Intake",
        "use_case": "Healthcare Clinic Intake & Appointment Scheduling",
        "tone": "Confidential, calm, and reassuring",
        "sample_turn": "I need an urgent appointment for acute knee pain with Dr. Reed."
    },
    {
        "name": "Pet Care & Veterinary Emergency",
        "use_case": "Pet Care Concierge & Veterinary Support",
        "tone": "Warm, patient, and caring",
        "sample_turn": "I want to schedule a full groom package for my Golden Retriever Barnaby."
    },
    {
        "name": "Banking & Fraud Dispute Support",
        "use_case": "Banking Customer Support & Fraud Disputes",
        "tone": "Secure, crisp, and professional",
        "sample_turn": "I see an unauthorized charge of $450 on my debit card ending in 4092."
    },
    {
        "name": "Technical Support & Telecom",
        "use_case": "Telecom Internet Technical Support & Router Troubleshooting",
        "tone": "Patient, analytical, and helpful",
        "sample_turn": "My optical light is blinking red on my FiberGateway X3 modem."
    }
]

async def run_multi_domain_verification():
    print("=" * 80)
    print("AGENTLAB - MULTI-DOMAIN DIAGNOSTIC & HEURISTIC COMPILER SUITE")
    print("=" * 80)

    client = OpenAIClient()
    prompt_service = PromptService()
    analyzer_service = AnalyzerService()

    passed_count = 0
    total_count = len(DOMAINS_TO_TEST)

    for idx, domain in enumerate(DOMAINS_TO_TEST, 1):
        print(f"\n[{idx}/{total_count}] TESTING DOMAIN: {domain['name']}")
        print(f"     Use Case: {domain['use_case']}")

        # 1. Compile Domain Prompt
        request = PromptGenerationRequest(
            use_case=domain['use_case'],
            language="English",
            tone=domain['tone']
        )
        generated = await prompt_service.generate_agent_prompt(request)
        assert generated.system_prompt, "System prompt should not be empty"
        assert len(generated.conversation_flow) > 0, "Conversation flow should be non-empty"
        assert len(generated.edge_cases) > 0, "Edge cases should be generated"

        print(f"  [OK] Generated System Prompt preview: '{generated.system_prompt[:70]}...'")
        print(f"  [OK] Generated Flow steps ({len(generated.conversation_flow)}): {generated.conversation_flow[:2]}")
        print(f"  [OK] Generated Edge cases ({len(generated.edge_cases)}): {[ec.scenario[:40] for ec in generated.edge_cases[:2]]}")

        # 2. Simulate Response
        history = [
            {"sender": "customer", "content": domain['sample_turn']}
        ]
        agent_reply = await client.simulate_chat_turn(
            system_prompt=generated.system_prompt,
            history=history,
            latest_message=domain['sample_turn']
        )
        assert agent_reply, "Agent reply should not be empty"
        print(f"  [OK] Simulated Agent Reply: '{agent_reply}'")

        # 3. Analyze Transcript Quality
        full_transcript = [
            {"sender": "customer", "content": domain['sample_turn']},
            {"sender": "agent", "content": agent_reply}
        ]
        analysis_req = TranscriptAnalysisRequest(
            original_system_prompt=generated.system_prompt,
            transcript=full_transcript
        )
        analysis = await analyzer_service.analyze(analysis_req)
        print(f"  [OK] Failures Identified: {len(analysis.failures)} | Improvement Summary: '{analysis.improvement_summary[:60]}...'")

        passed_count += 1

    print("\n" + "=" * 80)
    print(f"MULTI-DOMAIN VERIFICATION SUMMARY: {passed_count}/{total_count} DOMAINS PASSED SUCCESSFULLY")
    print("=" * 80)

if __name__ == "__main__":
    asyncio.run(run_multi_domain_verification())
