from pydantic import BaseModel, Field
from typing import List

class PromptGenerationRequest(BaseModel):
    use_case: str = Field(
        ..., 
        description="The primary business application or domain, e.g., Flight support cancellation",
        examples=["Flight Cancellation support"]
    )
    language: str = Field(
        ..., 
        description="The language of the agent, e.g., English, Spanish",
        examples=["English"]
    )
    tone: str = Field(
        ..., 
        description="Brand voice descriptors, e.g., empathetic, professional, clear",
        examples=["Empathetic, clear, and professional"]
    )

class EdgeCase(BaseModel):
    scenario: str = Field(..., description="The conversational deviation or context, e.g., customer interrupts")
    behavior: str = Field(..., description="The exact instructions on how the agent should handle this scenario")

class PromptGenerationResponse(BaseModel):
    system_prompt: str = Field(
        ..., 
        description="The fully compiled, production-ready system instruction prompt for the Voice AI agent"
    )
    conversation_flow: List[str] = Field(
        ..., 
        description="Chronological milestones of the conversation flow"
    )
    edge_cases: List[EdgeCase] = Field(
        ..., 
        description="Key edge-case scenarios and expected behavior instructions mapped out"
    )
