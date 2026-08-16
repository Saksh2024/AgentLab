import logging
from app.schemas.simulator import ChatSimulationRequest, ChatSimulationResponse
from app.services.llm.client import OpenAIClient

logger = logging.getLogger(__name__)

class SimulatorService:
    def __init__(self, llm_client: OpenAIClient = None):
        self.llm_client = llm_client

    async def run_simulation_turn(self, request: ChatSimulationRequest) -> ChatSimulationResponse:
        logger.info(f"Processing simulator turn with {len(request.history)} historical messages.")
        
        client = self.llm_client or OpenAIClient()
        
        try:
            response_text = await client.simulate_chat_turn(
                system_prompt=request.system_prompt,
                history=request.history,
                latest_message=request.latest_message
            )
            
            logger.info("Successfully generated simulator response.")
            return ChatSimulationResponse(response=response_text)
            
        except Exception as exc:
            logger.error(f"Failed to generate simulation response: {str(exc)}")
            raise RuntimeError(f"Simulation service failure: {str(exc)}")
