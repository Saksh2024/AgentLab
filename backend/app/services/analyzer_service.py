import logging
from app.schemas.analyzer import TranscriptAnalysisRequest, TranscriptAnalysisResponse
from app.services.llm.client import OpenAIClient
from app.services.version_service import VersionService
from app.schemas.version import PromptVersionCreate

logger = logging.getLogger(__name__)

class AnalyzerService:
    def __init__(self, llm_client: OpenAIClient = None):
        self.llm_client = llm_client

    async def analyze(self, request: TranscriptAnalysisRequest) -> TranscriptAnalysisResponse:
        logger.info(f"Initiating transcript analysis. Transcript length: {len(request.transcript)} turns.")
        
        client = self.llm_client or OpenAIClient()
        
        try:
            response = await client.analyze_transcript(
                system_prompt=request.original_system_prompt,
                transcript=request.transcript
            )
            
            logger.info(f"Successfully analyzed transcript. Identified {len(response.failures)} failures.")
            
            # Every prompt improvement creates a new version in SQLite
            if response.improved_prompt and response.improved_prompt != request.original_system_prompt:
                try:
                    version_service = VersionService()
                    version_service.create_version(
                        PromptVersionCreate(
                            previous_prompt=request.original_system_prompt,
                            improved_prompt=response.improved_prompt,
                            summary_of_changes=response.improvement_summary or "Auto-evolved prompt via transcript analysis."
                        )
                    )
                    logger.info("Automatically created new prompt version in SQLite from analyzer improvement.")
                except Exception as db_exc:
                    logger.warning(f"Failed to auto-save evolved version to SQLite: {str(db_exc)}")

            return response
            
        except Exception as exc:
            logger.error(f"Failed to analyze transcript: {str(exc)}")
            raise RuntimeError(f"Analyzer service failure: {str(exc)}")

