"""
SQLite database layer using Python's built-in sqlite3 module.
No external dependencies required — works with the standard library.
"""
import sqlite3
import logging
from pathlib import Path

logger = logging.getLogger(__name__)

# Database file lives in the backend root
DB_PATH = Path(__file__).parent.parent.parent / "agentlab.db"


def get_connection() -> sqlite3.Connection:
    """Return a configured sqlite3 connection with row_factory for dict-like access."""
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")  # Better concurrent read performance
    return conn


def init_db() -> None:
    """Create all tables if they do not already exist."""
    logger.info(f"Initializing SQLite database at: {DB_PATH}")
    with get_connection() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS prompt_versions (
                id                INTEGER PRIMARY KEY AUTOINCREMENT,
                version_number    INTEGER NOT NULL,
                timestamp         TEXT NOT NULL DEFAULT (datetime('now')),
                previous_prompt   TEXT NOT NULL,
                improved_prompt   TEXT NOT NULL,
                summary_of_changes TEXT NOT NULL
            )
        """)
        conn.commit()
        
        # Seed initial prompt versions if the table is empty
        cursor = conn.execute("SELECT COUNT(*) as cnt FROM prompt_versions")
        row = cursor.fetchone()
        if row and row["cnt"] == 0:
            logger.info("Seeding initial prompt versions into SQLite...")
            seed_versions = [
                (
                    1,
                    "2026-08-01 10:00:00",
                    "You are an AI support agent for an airline. Assist users with questions.",
                    "You are an AI customer support agent for SwiftAir. Always greet the customer warmly and ask for their booking reference number before checking cancellation policies.",
                    "Initial baseline prompt with brand identity and mandatory booking reference verification."
                ),
                (
                    2,
                    "2026-08-01 14:30:00",
                    "You are an AI customer support agent for SwiftAir. Always greet the customer warmly and ask for their booking reference number before checking cancellation policies.",
                    "You are an AI customer support agent for SwiftAir. Always greet the customer warmly and ask for their booking reference number before checking cancellation policies.\nIf the booking reference is missing, ask for their registered phone number as a fallback.\nKeep responses empathetic and under 3 sentences.",
                    "Added phone number fallback verification for missing booking reference and added empathy & brevity constraints."
                ),
                (
                    3,
                    "2026-08-01 18:45:00",
                    "You are an AI customer support agent for SwiftAir. Always greet the customer warmly and ask for their booking reference number before checking cancellation policies.\nIf the booking reference is missing, ask for their registered phone number as a fallback.\nKeep responses empathetic and under 3 sentences.",
                    "You are a professional AI customer support specialist for SwiftAir. Greet the customer warmly and request their 6-digit PNR booking reference before discussing cancellation policies.\nIf the PNR is missing, ask for their registered mobile number and full name as a fallback.\nAlways maintain an empathetic, calm tone and restrict replies to 2-3 concise sentences.\nNever hallucinate refund amounts or policy waivers.",
                    "Modified role title and PNR instructions; added full name fallback verification; added anti-hallucination guardrail for refunds."
                )
            ]
            conn.executemany(
                """
                INSERT INTO prompt_versions (version_number, timestamp, previous_prompt, improved_prompt, summary_of_changes)
                VALUES (?, ?, ?, ?, ?)
                """,
                seed_versions
            )
            conn.commit()
            logger.info("Initial prompt versions seeded successfully.")
    logger.info("Database initialized successfully.")

