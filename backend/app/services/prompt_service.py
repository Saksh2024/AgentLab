import logging
from app.schemas.prompt import PromptGenerationRequest, PromptGenerationResponse
from app.services.llm.client import OpenAIClient

logger = logging.getLogger(__name__)

class PromptService:
    def __init__(self, llm_client: OpenAIClient = None):
        # Allow dependency injection of client for unit testing/mocking
        self.llm_client = llm_client

    async def generate_agent_prompt(self, request: PromptGenerationRequest) -> PromptGenerationResponse:
        logger.info(
            f"Initiating agent prompt compilation. Use Case: {request.use_case} | "
            f"Language: {request.language} | Tone: {request.tone}"
        )
        
        # Instantiate default client if none provided
        client = self.llm_client or OpenAIClient()
        
        try:
            response = await client.generate_prompt(
                use_case=request.use_case,
                language=request.language,
                tone=request.tone
            )
            logger.info("Successfully generated structured prompt version.")
            return response
        except ValueError as val_err:
            logger.error(f"Configuration error: {str(val_err)}")
            raise val_err
        except Exception as exc:
            logger.error(f"Unexpected error compiling system prompts: {str(exc)}")
            raise RuntimeError(f"Prompt generation service failure: {str(exc)}")
