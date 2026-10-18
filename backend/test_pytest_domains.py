"""
Pytest integration suite for AgentLab Multi-Domain Verification.
Tests prompt compilation and simulation execution across all 6 domains.
"""
import pytest
from app.services.llm.client import OpenAIClient
from test_all_6_domains_suite import ALL_6_DOMAINS_SUITE

@pytest.fixture
def offline_client():
    return OpenAIClient(api_key="")

@pytest.mark.asyncio
@pytest.mark.parametrize("domain_info", ALL_6_DOMAINS_SUITE, ids=[d["domain_id"] for d in ALL_6_DOMAINS_SUITE])
async def test_domain_prompt_compilation(offline_client, domain_info):
    """Verifies that all 6 domains successfully compile structured system prompts, flows, and edge cases."""
    generated = await offline_client.generate_prompt(
        use_case=domain_info["use_case"],
        language="English",
        tone=domain_info["tone"]
    )
    assert generated.system_prompt is not None and len(generated.system_prompt) > 100
    assert len(generated.conversation_flow) >= 4
    assert len(generated.edge_cases) >= 2

@pytest.mark.asyncio
@pytest.mark.parametrize("domain_info", ALL_6_DOMAINS_SUITE, ids=[d["domain_id"] for d in ALL_6_DOMAINS_SUITE])
async def test_domain_conversational_simulation(offline_client, domain_info):
    """Verifies multi-turn dialogue simulation and expected keyword alignment for each domain."""
    generated = await offline_client.generate_prompt(
        use_case=domain_info["use_case"],
        language="English",
        tone=domain_info["tone"]
    )
    sys_prompt = generated.system_prompt

    for tc in domain_info["test_cases"]:
        history = []
        transcript = []

        # Initial agent greeting
        init_reply = await offline_client.simulate_chat_turn(sys_prompt, [], "greeting")
        assert len(init_reply) > 0
        history.append({"role": "assistant", "content": init_reply})
        transcript.append({"role": "agent", "content": init_reply})

        agent_replies = [init_reply]
        for user_turn in tc["turns"]:
            transcript.append({"role": "customer", "content": user_turn})
            reply = await offline_client.simulate_chat_turn(sys_prompt, history, user_turn)
            assert len(reply) > 0
            history.append({"role": "user", "content": user_turn})
            history.append({"role": "assistant", "content": reply})
            transcript.append({"role": "agent", "content": reply})
            agent_replies.append(reply)

        combined_text = " ".join(agent_replies).lower()
        for kw in tc["expected_keywords"]:
            assert kw in combined_text, f"Expected keyword '{kw}' not found in replies for {tc['id']}"

        # QA evaluation check
        qa_report = await offline_client.analyze_transcript(sys_prompt, transcript)
        critical_issues = [f for f in qa_report.failures if f.severity.value in ["High", "Critical"]]
        assert len(critical_issues) == 0, f"Critical failure detected in {tc['id']}: {critical_issues}"
