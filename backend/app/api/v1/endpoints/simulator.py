from fastapi import APIRouter, HTTPException, status
from app.schemas.simulator import ChatSimulationRequest, ChatSimulationResponse
from app.services.simulator_service import SimulatorService

router = APIRouter()
simulator_service = SimulatorService()

@router.post(
    "/chat", 
    response_model=ChatSimulationResponse,
    status_code=status.HTTP_200_OK,
    summary="Process a chat turn in the conversation simulator",
    description="Takes the conversation history and a new user message, passing it to the active voice agent prompt configuration."
)
async def simulate_chat(request: ChatSimulationRequest):
    try:
        response = await simulator_service.run_simulation_turn(request)
        return response
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(exc)
        )
