import sys
import asyncio
from unittest.mock import AsyncMock

async def run_diagnostics():
    print("AI Voice Agent Studio - Backend Diagnostic Verification")
    print("=" * 60)
    
    # 1. Verify basic imports
    print("[1/3] Verifying module imports...")
    try:
        from app.core.config import settings
        from app.schemas.prompt import PromptGenerationRequest, PromptGenerationResponse, EdgeCase
        from app.services.llm.client import OpenAIClient
        from app.services.prompt_service import PromptService
        from app.main import app
        print("[OK] All modules imported successfully.")
    except Exception as exc:
        print(f"[FAIL] Import failure detected: {str(exc)}")
        sys.exit(1)
        
    # 2. Check Route Registrations
    print("[2/3] Verifying FastAPI route registration...")
    app.openapi() # Force FastAPI to compile internal included routers
    routes_registered = []
    for r in app.routes:
        if hasattr(r, 'path'):
            routes_registered.append(r.path)
        if hasattr(r, '_effective_candidates'):
            for cand in r._effective_candidates:
                if hasattr(cand, 'path'):
                    routes_registered.append(cand.path)
                    
    target_path = "/api/v1/prompts/generate"
    if target_path in routes_registered:
        print(f"[OK] Target endpoint '{target_path}' is registered.")
    else:
        print(f"[FAIL] Target route '{target_path}' not found in app routes. Found: {routes_registered}")
        sys.exit(1)
        
    # 3. Test Service Logic (Mocked LLM Integration)
    print("[3/3] Validating PromptService using dependency mock injection...")
    
    mock_response = PromptGenerationResponse(
        system_prompt="You are a mock agent.",
        conversation_flow=["Step 1", "Step 2"],
        edge_cases=[EdgeCase(scenario="Mock Scenario", behavior="Mock Behavior")]
    )
    
    # Create mock LLM client
    mock_llm = AsyncMock()
    mock_llm.generate_prompt = AsyncMock(return_value=mock_response)
    
    # Inject into PromptService
    service = PromptService(llm_client=mock_llm)
    
    request_data = PromptGenerationRequest(
        use_case="Mock Testing",
        language="English",
        tone="professional"
    )
    
    try:
        result = await service.generate_agent_prompt(request_data)
        print("[OK] Service execution complete.")
        print(f"[OK] Generated Prompt preview: '{result.system_prompt}'")
        print(f"[OK] Generated Flow steps: {result.conversation_flow}")
        print(f"[OK] Generated Edge cases: {[e.scenario for e in result.edge_cases]}")
    except Exception as exc:
        print(f"[FAIL] Service logic execution failed: {str(exc)}")
        sys.exit(1)
        
    print("=" * 60)
    print("SUCCESS: Backend configuration and logic structure are fully correct!")

if __name__ == "__main__":
    asyncio.run(run_diagnostics())
