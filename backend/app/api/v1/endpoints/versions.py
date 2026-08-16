from fastapi import APIRouter, HTTPException, status
from app.schemas.version import PromptVersionCreate, PromptVersionResponse, PromptDiffResponse
from app.services.version_service import VersionService
from typing import List

router = APIRouter()
version_service = VersionService()


@router.post(
    "/",
    response_model=PromptVersionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Save a new prompt version",
    description="Stores the previous and improved prompt along with a change summary in SQLite."
)
async def create_version(request: PromptVersionCreate):
    try:
        return version_service.create_version(request)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(exc)
        )


@router.get(
    "/",
    response_model=List[PromptVersionResponse],
    status_code=status.HTTP_200_OK,
    summary="List all prompt versions",
    description="Returns all saved prompt versions ordered newest-first."
)
async def list_versions():
    try:
        return version_service.get_all_versions()
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(exc)
        )


@router.get(
    "/{version_id}/diff",
    response_model=PromptDiffResponse,
    status_code=status.HTTP_200_OK,
    summary="Get a structured line-by-line diff for a version",
    description="Uses Python's built-in difflib to compute tagged diff chunks (equal/insert/delete) between previous and improved prompt."
)
async def get_diff(version_id: int):
    try:
        return version_service.get_diff(version_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(exc)
        )
