from openai import AsyncOpenAI
from app.core.config import settings
from app.schemas.prompt import PromptGenerationResponse
from app.schemas.analyzer import TranscriptAnalysisResponse
from app.services.llm.prompt_templates import (
    META_PROMPT_GENERATION_SYSTEM_INSTRUCTION,
    META_PROMPT_GENERATION_USER_TEMPLATE
)

class OpenAIClient:
    def __init__(self, api_key: str = None):
        self.api_key = api_key or settings.OPENAI_API_KEY
        if not self.api_key:
            raise ValueError(
                "OpenAI API Key is missing. Please configure 'OPENAI_API_KEY' in your .env file "
                "or environment variables."
            )
        self.client = AsyncOpenAI(api_key=self.api_key)

    async def generate_prompt(self, use_case: str, language: str, tone: str) -> PromptGenerationResponse:
        user_content = META_PROMPT_GENERATION_USER_TEMPLATE.format(
            use_case=use_case,
            language=language,
            tone=tone
        )
        
        # We target gpt-4o-2024-08-06 or newer which officially guarantees Pydantic validation via Structured Outputs
        completion = await self.client.beta.chat.completions.parse(
            model="gpt-4o-mini",  # Highly responsive and cost-effective model choice for generation pipelines
            messages=[
                {"role": "system", "content": META_PROMPT_GENERATION_SYSTEM_INSTRUCTION},
                {"role": "user", "content": user_content}
            ],
            response_format=PromptGenerationResponse,
            temperature=0.7,
        )
        
        parsed_response = completion.choices[0].message.parsed
        if parsed_response is None:
            raise RuntimeError("LLM response failed schema validation boundaries.")
            
        return parsed_response

    async def simulate_chat_turn(self, system_prompt: str, history: list, latest_message: str) -> str:
        messages = [{"role": "system", "content": system_prompt}]
        
        for msg in history:
            # Map role appropriately if the frontend uses different terms
            role = msg.role if msg.role in ["user", "assistant", "system"] else "user"
            messages.append({"role": role, "content": msg.content})
            
        messages.append({"role": "user", "content": latest_message})
        
        completion = await self.client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            temperature=0.7,
        )
        
        return completion.choices[0].message.content

    async def analyze_transcript(self, system_prompt: str, transcript: list) -> TranscriptAnalysisResponse:
        system_instruction = (
            "You are an expert Voice AI Quality Assurance evaluator. "
            "Your task is to analyze the following transcript of a Voice AI agent interacting with a customer. "
            "You will identify any failures and categorize them strictly into the provided categories. "
            "You will assign a severity to each failure, explain the reason, and provide a suggested fix. "
            "You will provide an improvement summary explaining the overall updates. "
            "Finally, you will rewrite the ORIGINAL system prompt into an improved prompt that fixes these issues."
        )
        
        # Format the transcript for the LLM
        transcript_text = "ORIGINAL SYSTEM PROMPT:\n" + system_prompt + "\n\nTRANSCRIPT:\n"
        for i, msg in enumerate(transcript):
            role = msg.get("role", msg.get("sender", "unknown"))
            content = msg.get("content", "")
            transcript_text += f"[{i}] {role.upper()}: {content}\n"
            
        completion = await self.client.beta.chat.completions.parse(
            model="gpt-4o-2024-08-06", # Ensure we use a model supporting structured outputs
            messages=[
                {"role": "system", "content": system_instruction},
                {"role": "user", "content": transcript_text}
            ],
            response_format=TranscriptAnalysisResponse,
            temperature=0.2,
        )
        
        parsed_response = completion.choices[0].message.parsed
        if parsed_response is None:
            raise RuntimeError("LLM response failed schema validation boundaries for transcript analysis.")
            
        return parsed_response
