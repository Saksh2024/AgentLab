from pydantic import BaseModel, Field
from typing import Optional

class PromptVersionCreate(BaseModel):
    previous_prompt: str = Field(..., description="The original prompt before improvement")
    improved_prompt: str = Field(..., description="The improved prompt after analysis")
    summary_of_changes: str = Field(..., description="A concise summary of what changed and why")

class PromptVersionResponse(BaseModel):
    id: int
    version_number: int
    timestamp: str
    previous_prompt: str
    improved_prompt: str
    summary_of_changes: str

class DiffChunk(BaseModel):
    line: str
    tag: str  # "equal", "insert", "delete", "replace", "modified"
    old_line: Optional[str] = None

class PromptDiffResponse(BaseModel):
    version_id: int
    version_number: int
    timestamp: str
    summary_of_changes: str
    previous_prompt: str
    improved_prompt: str
    diff: list[DiffChunk]

