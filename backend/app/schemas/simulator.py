from pydantic import BaseModel, Field
from typing import List, Literal

class Message(BaseModel):
    role: str = Field(..., description="The role of the message sender, e.g., 'user', 'assistant', 'system'")
    content: str = Field(..., description="The content of the message")

class ChatSimulationRequest(BaseModel):
    system_prompt: str = Field(..., description="The compiled system guidelines")
    history: List[Message] = Field(default_factory=list, description="Previous conversation turns")
    latest_message: str = Field(..., description="The new user message to process")

class ChatSimulationResponse(BaseModel):
    response: str = Field(..., description="The generated assistant reply")
    mode: Literal["live", "offline", "fallback"] = Field(
        default="live",
        description="live = answered by the LLM; offline = no API key configured (scripted replies); "
                    "fallback = LLM call failed so a scripted reply was used",
    )
