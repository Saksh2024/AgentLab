import sys
import asyncio
import json
from app.services.llm.client import OpenAIClient

async def run_hotel_suite_tests():
    print("=" * 80)
    print("AGENTLAB - SIMULATION SUITE FOR HOTEL STAY & BOOKING SUPPORT USE CASE (v13)")
    print("=" * 80)
    
    client = OpenAIClient()
    
    # Target system prompt for Hotel Concierge / Travel App (Version v13)
    system_prompt = (
        "You are an expert AI voice guest concierge and travel app booking specialist for Hotel Stay & Booking Support.\n"
        "Always maintain an empathetic, clear, and professional tone and assist guests fluently in English.\n"
        "1. Greet the guest warmly and assist with stay reservations, hotel-specific policy inquiries, room modifications, or cancellations.\n"
        "2. HOTEL-SPECIFIC CANCELLATION PERIODS: Recognize that each hotel has its specific free cancellation deadline (e.g. free cancellation until 24/48 hours before check-in or specified date). If a guest cancels within their free cancellation period, process a 100% full refund with $0 cancellation charges.\n"
        "3. BOOK AT $0 FEATURE: Explain and support the 'Book at $0' feature, which allows guests to hold room bookings with zero upfront payment. Explicitly clarify that guests may hold multiple 'Book at $0' reservations, but total charges must be paid before the final payment deadline date, otherwise the system will automatically cancel the unpaid reservation.\n"
        "4. IDENTITY VERIFICATION & CONTEXT: For existing reservations, verify the 6-to-8 character confirmation reference or registered phone number before modifying details. Understand natural context (e.g., when a guest affirms 'yes' to a cancellation prompt).\n"
        "5. BREVITY & POLICIES: Keep voice responses concise, hospitable, and strictly under 2-3 sentences. Never promise unconfirmed upgrades without authorization."
    )
    
    test_cases = [
        {
            "id": "tc_hotel_book_at_zero",
            "name": "Book at $0 Payment Deadline Inquiry",
            "profile": "Guest holding multiple zero-upfront payment reservations checking auto-cancellation cutoff rules.",
            "turns": [
                "Hi, I have booked 3 places using Book at $0 and want to check the payment deadlines before they get cancelled.",
                "My name is Alex Mercer and phone is +1-555-0199.",
                "I want to pay later for Motel Oracle."
            ]
        },
        {
            "id": "tc_hotel_free_cancel_window",
            "name": "Free Cancellation Period Confirmation",
            "profile": "Guest confirming cancellation within free cancellation window ('upto tomorrow').",
            "turns": [
                "Hi, I need to check the free cancellation period for my booking at Motel Oracle.",
                "Yes, the cancellation policy for this hotel is upto tomorrow, please cancel it."
            ]
        },
        {
            "id": "tc_hotel_cancel",
            "name": "Angry Guest (Lost Confirmation Code)",
            "profile": "Frustrated, attempting to cancel booking for Motel Oracle without reference number.",
            "turns": [
                "I need to cancel my booking for Motel Oracle right now, but I don't have my confirmation code!",
                "My name is Alex Mercer and phone is +1-555-0199.",
                "Yes, please confirm the cancellation."
            ]
        },
        {
            "id": "tc_hotel_modify",
            "name": "Polite Suite Modification",
            "profile": "Cooperative, clear speaker requesting room upgrade or stay date shift.",
            "turns": [
                "Hello! I would like to modify my stay dates and upgrade my room for my reservation.",
                "My confirmation code is HTL-882, and I want to extend my stay by 2 nights and upgrade to Deluxe King Suite."
            ]
        },
        {
            "id": "tc_hotel_late_checkin",
            "name": "Late Check-in Request",
            "profile": "Traveler arriving after midnight inquiring about keyless entry policy.",
            "turns": [
                "Hi, I will be arriving late tonight around 01:30 AM. Can I check in after midnight?"
            ]
        }
    ]
    
    results_summary = []
    
    for idx, tc in enumerate(test_cases, 1):
        print(f"\n[{idx}/5] RUNNING TEST CASE: {tc['name']}")
        print(f"     Profile: {tc['profile']}")
        print("-" * 70)
        
        conversation_history = []
        transcript_turns = []
        
        # Initial agent greeting
        init_agent_reply = await client.simulate_chat_turn(
            system_prompt=system_prompt,
            history=[],
            latest_message="greeting"
        )
        print(f"  [AGENT INIT]: {init_agent_reply}")
        conversation_history.append({"role": "assistant", "content": init_agent_reply})
        transcript_turns.append({"role": "agent", "content": init_agent_reply})
        
        for turn_user_msg in tc["turns"]:
            print(f"  [USER]: {turn_user_msg}")
            transcript_turns.append({"role": "customer", "content": turn_user_msg})
            
            agent_reply = await client.simulate_chat_turn(
                system_prompt=system_prompt,
                history=conversation_history,
                latest_message=turn_user_msg
            )
            print(f"  [AGENT]: {agent_reply}")
            conversation_history.append({"role": "user", "content": turn_user_msg})
            conversation_history.append({"role": "assistant", "content": agent_reply})
            transcript_turns.append({"role": "agent", "content": agent_reply})
            
        # Run Quality Analysis Evaluation on completed transcript
        print("\n  --> Evaluating Transcript Quality...")
        qa_report = await client.analyze_transcript(system_prompt, transcript_turns)
        
        fail_count = len(qa_report.failures)
        passed = fail_count == 0 or all(f.severity.value not in ["High", "Critical"] for f in qa_report.failures)
        status_str = "PASSED" if passed else "FAILED"
        
        print(f"  --> Status: [{status_str}] | Failures Detected: {fail_count}")
        if qa_report.failures:
            for f in qa_report.failures:
                print(f"      * [{f.severity.value}] {f.failure_type.value}: {f.reason[:80]}...")
        else:
            print("      * Zero critical anti-patterns detected. Compliant with domain policies.")
            
        results_summary.append({
            "test_case": tc["name"],
            "status": status_str,
            "turns_count": len(tc["turns"]),
            "failures_count": fail_count,
            "improvement_summary": qa_report.improvement_summary
        })
        
    print("\n" + "=" * 80)
    print("FINAL TEST SUITE SUMMARY FOR HOTEL STAY & BOOKING SUPPORT USE CASE")
    print("=" * 80)
    for res in results_summary:
        symbol = "[PASS]" if res["status"] == "PASSED" else "[FAIL]"
        print(f"{symbol} [{res['status']}] {res['test_case']} ({res['turns_count']} turns) - Failures: {res['failures_count']}")
    print("=" * 80)

if __name__ == "__main__":
    asyncio.run(run_hotel_suite_tests())
