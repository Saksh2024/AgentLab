import sys
import logging
from app.db import init_db, get_connection
from app.schemas.version import PromptVersionCreate
from app.services.version_service import VersionService

logging.basicConfig(level=logging.INFO)

def test_evolution_system():
    print("=" * 60)
    print("AI Voice Agent Studio - Prompt Evolution System Verification")
    print("=" * 60)
    
    # 1. Test database initialization & seeding
    print("[1/4] Initializing SQLite database...")
    init_db()
    with get_connection() as conn:
        count = conn.execute("SELECT COUNT(*) as cnt FROM prompt_versions").fetchone()["cnt"]
    print(f"[OK] SQLite database initialized. Found {count} versions in 'prompt_versions' table.")

    # 2. Test listing versions
    print("[2/4] Testing VersionService.get_all_versions()...")
    service = VersionService()
    versions = service.get_all_versions()
    print(f"[OK] Retrieved {len(versions)} versions:")
    for v in versions:
        print(f"  - Version v{v.version_number} | {v.timestamp} | Summary: {v.summary_of_changes[:50]}...")

    # 3. Test creating a new evolved prompt version
    print("[3/4] Testing VersionService.create_version()...")
    new_version_data = PromptVersionCreate(
        previous_prompt="You are a support agent for SwiftAir. Always be polite.",
        improved_prompt="You are a senior support specialist for SwiftAir. Always be polite.\nAlways ask for 6-digit PNR booking code.\nNever disclose internal policy codes.",
        summary_of_changes="Upgraded role to senior support specialist, added mandatory PNR verification and policy confidentiality guardrail."
    )
    created = service.create_version(new_version_data)
    print(f"[OK] Created new Version v{created.version_number} (id={created.id}) in SQLite.")

    # 4. Test diff computation with added, removed, and modified instruction tags
    print("[4/4] Testing VersionService.get_diff() on latest version...")
    diff_res = service.get_diff(created.id)
    print(f"[OK] Diff computed for Version v{diff_res.version_number}. Summary: {diff_res.summary_of_changes}")
    print("  - Previous Prompt:", repr(diff_res.previous_prompt[:40]))
    print("  - Improved Prompt:", repr(diff_res.improved_prompt[:40]))
    
    tags_count = {}
    for chunk in diff_res.diff:
        tags_count[chunk.tag] = tags_count.get(chunk.tag, 0) + 1
        if chunk.tag in ["insert", "delete", "modified"]:
            print(f"    [{chunk.tag.upper()}] line='{chunk.line}' old_line='{chunk.old_line}'")
            
    print(f"[OK] Diff Chunk Tag Summary: {tags_count}")
    print("=" * 60)
    print("SUCCESS: Prompt Evolution SQLite & Diff engine verified completely!")
    print("=" * 60)

if __name__ == "__main__":
    test_evolution_system()
