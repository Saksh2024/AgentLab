from fastapi import APIRouter, HTTPException, status
from app.schemas.analyzer import TranscriptAnalysisRequest, TranscriptAnalysisResponse
from app.services.analyzer_service import AnalyzerService

router = APIRouter()
analyzer_service = AnalyzerService()

@router.post(
    "/analyze", 
    response_model=TranscriptAnalysisResponse,
    status_code=status.HTTP_200_OK,
    summary="Analyze a complete voice conversation transcript",
    description="Uses OpenAI Structured Outputs to identify failures, determine root causes, and rewrite the system prompt."
)
async def analyze_transcript(request: TranscriptAnalysisRequest):
    try:
        response = await analyzer_service.analyze(request)
        return response
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(exc)
        )
