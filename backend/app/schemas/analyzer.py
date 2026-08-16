from pydantic import BaseModel, Field
from typing import List, Optional
from enum import Enum

class FailureCategory(str, Enum):
    IGNORED_CUSTOMER_STATEMENT = "Ignored customer statement"
    HALLUCINATION = "Hallucination"
    POOR_EMPATHY = "Poor empathy"
    WRONG_LANGUAGE = "Wrong language"
    REPEATED_RESPONSE = "Repeated response"
    CONVERSATION_DEAD_END = "Conversation dead end"
    MISSED_OBJECTIVE = "Missed objective"
    POOR_ESCALATION = "Poor escalation"
    INCORRECT_INFORMATION = "Incorrect information"
    OVERLY_VERBOSE = "Overly verbose"
    OTHER = "Other"

class Severity(str, Enum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"
    CRITICAL = "Critical"

class IdentifiedFailure(BaseModel):
    failure_type: FailureCategory = Field(..., description="The category of the failure")
    severity: Severity = Field(..., description="The severity of the failure")
    reason: str = Field(..., description="Detailed explanation of what went wrong")
    suggested_fix: str = Field(..., description="Actionable recommendation to fix this specific failure")

class TranscriptAnalysisRequest(BaseModel):
    original_system_prompt: str = Field(..., description="The system prompt used during the conversation")
    transcript: List[dict] = Field(..., description="The array of messages from the conversation (role, content)")

class TranscriptAnalysisResponse(BaseModel):
    failures: List[IdentifiedFailure] = Field(..., description="List of identified issues in the transcript")
    improvement_summary: str = Field(..., description="High-level summary of the improvements made")
    improved_prompt: str = Field(..., description="A complete, optimized rewrite of the original system prompt that addresses the failures")
