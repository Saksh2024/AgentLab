import logging
import difflib
from app.db import get_connection
from app.schemas.version import PromptVersionCreate, PromptVersionResponse, DiffChunk, PromptDiffResponse

logger = logging.getLogger(__name__)


class VersionService:

    def create_version(self, data: PromptVersionCreate) -> PromptVersionResponse:
        """Insert a new prompt version and return the created record."""
        with get_connection() as conn:
            # Determine the next version number
            row = conn.execute("SELECT COALESCE(MAX(version_number), 0) AS max_ver FROM prompt_versions").fetchone()
            next_version = row["max_ver"] + 1

            cursor = conn.execute(
                """
                INSERT INTO prompt_versions (version_number, previous_prompt, improved_prompt, summary_of_changes)
                VALUES (?, ?, ?, ?)
                """,
                (next_version, data.previous_prompt, data.improved_prompt, data.summary_of_changes)
            )
            conn.commit()
            new_id = cursor.lastrowid

        logger.info(f"Created prompt version v{next_version} (id={new_id})")
        return self.get_version_by_id(new_id)

    def get_all_versions(self) -> list[PromptVersionResponse]:
        """Return all prompt versions ordered newest-first."""
        with get_connection() as conn:
            rows = conn.execute(
                "SELECT * FROM prompt_versions ORDER BY version_number DESC"
            ).fetchall()
        return [PromptVersionResponse(**dict(row)) for row in rows]

    def get_version_by_id(self, version_id: int) -> PromptVersionResponse:
        """Return a single prompt version by id."""
        with get_connection() as conn:
            row = conn.execute(
                "SELECT * FROM prompt_versions WHERE id = ?", (version_id,)
            ).fetchone()
        if row is None:
            raise ValueError(f"Prompt version with id={version_id} not found.")
        return PromptVersionResponse(**dict(row))

    def get_diff(self, version_id: int) -> PromptDiffResponse:
        """
        Use Python's built-in difflib to compute a line-by-line diff between
        the previous_prompt and improved_prompt for the given version.
        Returns a list of DiffChunk objects tagged as: equal, insert, delete, or replace.
        """
        version = self.get_version_by_id(version_id)

        prev_lines = version.previous_prompt.splitlines()
        improved_lines = version.improved_prompt.splitlines()

        matcher = difflib.SequenceMatcher(None, prev_lines, improved_lines)
        chunks: list[DiffChunk] = []

        for tag, i1, i2, j1, j2 in matcher.get_opcodes():
            if tag == "equal":
                for line in prev_lines[i1:i2]:
                    chunks.append(DiffChunk(line=line, tag="equal"))
            elif tag == "insert":
                for line in improved_lines[j1:j2]:
                    chunks.append(DiffChunk(line=line, tag="insert"))
            elif tag == "delete":
                for line in prev_lines[i1:i2]:
                    chunks.append(DiffChunk(line=line, tag="delete"))
            elif tag == "replace":
                old_block = prev_lines[i1:i2]
                new_block = improved_lines[j1:j2]
                min_len = min(len(old_block), len(new_block))
                for idx in range(min_len):
                    chunks.append(DiffChunk(line=new_block[idx], tag="modified", old_line=old_block[idx]))
                if len(old_block) > min_len:
                    for line in old_block[min_len:]:
                        chunks.append(DiffChunk(line=line, tag="delete"))
                if len(new_block) > min_len:
                    for line in new_block[min_len:]:
                        chunks.append(DiffChunk(line=line, tag="insert"))

        logger.info(f"Computed diff for version id={version_id}: {len(chunks)} diff chunks")

        return PromptDiffResponse(
            version_id=version.id,
            version_number=version.version_number,
            timestamp=version.timestamp,
            summary_of_changes=version.summary_of_changes,
            previous_prompt=version.previous_prompt,
            improved_prompt=version.improved_prompt,
            diff=chunks,
        )

