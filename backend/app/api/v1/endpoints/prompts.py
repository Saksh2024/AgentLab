from fastapi import APIRouter, HTTPException, status
from app.schemas.prompt import PromptGenerationRequest, PromptGenerationResponse
from app.services.prompt_service import PromptService

router = APIRouter()
prompt_service = PromptService()

@router.post(
    "/generate", 
    response_model=PromptGenerationResponse,
    status_code=status.HTTP_200_OK,
    summary="Generate system prompt and agent assets",
    description="Uses OpenAI Structured Outputs to construct voice guidelines, dialogue flow, and edge cases."
)
async def generate_prompt(request: PromptGenerationRequest):
    try:
        response = await prompt_service.generate_agent_prompt(request)
        return response
    except ValueError as val_err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(val_err)
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(exc)
        )
