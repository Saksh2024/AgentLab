"""The simulator reports where each reply came from so the UI can't pass scripted replies off as an LLM."""
import asyncio
from unittest.mock import AsyncMock, MagicMock

from app.schemas.simulator import ChatSimulationRequest
from app.services.llm.client import OpenAIClient
from app.services.simulator_service import SimulatorService

REQ = ChatSimulationRequest(system_prompt="hotel concierge", history=[], latest_message="what reservations have i made")


def _run(client):
    return asyncio.run(SimulatorService(client).run_simulation_turn(REQ))


def test_mode_offline_without_api_key():
    assert _run(OpenAIClient(api_key="")).mode == "offline"


def test_mode_fallback_when_llm_call_fails():
    client = OpenAIClient(api_key="test-key")
    client.client.chat.completions.create = AsyncMock(side_effect=ConnectionError("Connection error."))
    result = _run(client)
    assert result.mode == "fallback"
    assert result.response  # the scripted reply is still returned


def test_mode_live_when_llm_answers():
    client = OpenAIClient(api_key="test-key")
    completion = MagicMock()
    completion.choices = [MagicMock()]
    completion.choices[0].message.content = "live reply"
    client.client.chat.completions.create = AsyncMock(return_value=completion)
    result = _run(client)
    assert (result.mode, result.response) == ("live", "live reply")


def test_settings_are_stripped_of_whitespace():
    client = OpenAIClient(api_key="  test-key\n", base_url=" https://example.com/v1/ \n")
    assert client.api_key == "test-key"
    assert client.base_url == "https://example.com/v1/"
