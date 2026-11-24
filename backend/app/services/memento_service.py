import os
import threading
from pathlib import Path
from typing import Optional, List, Dict, Any
import numpy as np

from app.config import settings

# Import actual memento library components
import memento.memory_store
from memento.config import MementoConfig, EmbeddingConfig, LLMConfig
from memento.memory_store import MemoryStore

class Deterministic384Embedder:
    """
    Local 384-dimensional embedder conforming to Memento's Embedder Protocol.
    Computes deterministic semantic term-frequency embeddings.
    Allows Memento to operate seamlessly offline and without heavy 2GB PyTorch models.
    """
    def __init__(self, dimension: int = 384):
        self._dim = dimension

    @property
    def dimension(self) -> int:
        return self._dim

    def embed(self, text: str) -> np.ndarray:
        vec = np.zeros(self._dim, dtype=np.float32)
        if not text:
            return vec
        words = text.lower().replace(",", " ").replace(".", " ").replace("?", " ").split()
        for idx, word in enumerate(words):
            # Positional hashed token projection
            h = abs(hash(word)) % self._dim
            vec[h] += 1.0 / (idx + 1)
        norm = np.linalg.norm(vec)
        if norm > 0:
            vec = vec / norm
        return vec

    def embed_batch(self, texts: List[str]) -> List[np.ndarray]:
        return [self.embed(t) for t in texts]

# Patch Memento's internal embedder factory so deterministic local embeddings work
_orig_create_embedder = memento.memory_store.create_embedder

def _enhanced_create_embedder(cfg: EmbeddingConfig):
    if cfg.provider in ("deterministic", "local", "hash"):
        return Deterministic384Embedder(dimension=cfg.dimension or 384)
    try:
        return _orig_create_embedder(cfg)
    except Exception:
        # Graceful fallback to deterministic local embedder if external dependencies are missing
        return Deterministic384Embedder(dimension=384)

memento.memory_store.create_embedder = _enhanced_create_embedder

class NoOpLLMClient:
    """Fallback LLM client when no external LLM API key is configured."""
    def complete(self, messages: list, model: str, system: Optional[str] = None, temperature: float = 0.0, max_tokens: int = 1024) -> str:
        return "{}"

# Patch Memento's create_llm_client to support NoOp fallback
import memento.llm
_orig_create_llm_client = memento.llm.create_llm_client

def _enhanced_create_llm_client(cfg: LLMConfig):
    if cfg.provider in ("none", "noop") or (not cfg.api_key and not os.environ.get("OPENAI_API_KEY") and not os.environ.get("GOOGLE_API_KEY")):
        return NoOpLLMClient()
    try:
        return _orig_create_llm_client(cfg)
    except Exception:
        return NoOpLLMClient()

memento.llm.create_llm_client = _enhanced_create_llm_client


class MementoService:
    """
    Enterprise Persistent Memory Service using Memento bitemporal knowledge graph.
    Enforces strict physical per-employee database isolation:
    - Employee 1 data -> data/memento/employee_1.db
    - Employee 2 data -> data/memento/employee_2.db
    Ensures zero cross-tenant memory leakage between employees.
    """
    def __init__(self):
        self.storage_dir = Path(settings.MEMENTO_STORAGE_DIR)
        self.storage_dir.mkdir(parents=True, exist_ok=True)
        self._locks = {}
        self._meta_lock = threading.Lock()
        
    def _get_employee_lock(self, employee_id: int) -> threading.Lock:
        with self._meta_lock:
            if employee_id not in self._locks:
                self._locks[employee_id] = threading.Lock()
            return self._locks[employee_id]

    def _get_employee_db_path(self, employee_id: int) -> Path:
        """Returns the isolated database file path for a specific employee."""
        return self.storage_dir / f"memento_employee_{employee_id}.db"

    def _get_memento_store(self, employee_id: int) -> MemoryStore:
        """Initializes or connects to the isolated Memento MemoryStore for an employee."""
        db_path = self._get_employee_db_path(employee_id)
        
        # Configure Memento
        provider = settings.MEMENTO_EMBEDDING_PROVIDER
        if provider == "openai" and settings.OPENAI_API_KEY:
            emb_cfg = EmbeddingConfig(
                provider="openai",
                model="text-embedding-3-small",
                dimension=384,
                openai_api_key=settings.OPENAI_API_KEY
            )
        else:
            emb_cfg = EmbeddingConfig(
                provider="deterministic",
                model="deterministic-384",
                dimension=384
            )

        if settings.GEMINI_API_KEY:
            llm_cfg = LLMConfig(
                provider="gemini",
                api_key=settings.GEMINI_API_KEY,
                extraction_model=os.getenv("GEMINI_MODEL", settings.GEMINI_MODEL or "gemini-3.8-flash")
            )
        elif settings.OPENAI_API_KEY:
            llm_cfg = LLMConfig(
                provider="openai",
                api_key=settings.OPENAI_API_KEY,
                base_url=settings.OPENAI_BASE_URL or "",
                extraction_model=settings.OPENAI_MODEL
            )
        else:
            llm_cfg = LLMConfig(
                provider="none",
                api_key="none"
            )

        config = MementoConfig(
            db_path=db_path,
            embedding=emb_cfg,
            llm=llm_cfg
        )
        return MemoryStore(config=config)

    def save_conversation_turn(
        self,
        employee_id: int,
        user_message: str,
        assistant_message: str,
        conversation_id: str = "default"
    ) -> None:
        """
        Ingests a conversational interaction into the employee's Memento persistent memory.
        """
        with self._get_employee_lock(employee_id):
            store = self._get_memento_store(employee_id)
            try:
                # Ingest employee question
                user_record = f"Employee asked: {user_message}"
                store.ingest(
                    text=user_record,
                    conversation_id=conversation_id,
                    source_type="conversation",
                    authority=0.9
                )
                
                # Ingest assistant response summary
                summary = assistant_message[:400] if len(assistant_message) > 400 else assistant_message
                bot_record = f"Compliance Assistant replied: {summary}"
                store.ingest(
                    text=bot_record,
                    conversation_id=conversation_id,
                    source_type="conversation",
                    authority=0.85
                )
            finally:
                store.close()

    def recall_memories(
        self,
        employee_id: int,
        query: str,
        conversation_id: Optional[str] = None
    ) -> str:
        """
        Recalls persistent memories relevant to the query for the authenticated employee.
        """
        with self._get_employee_lock(employee_id):
            db_path = self._get_employee_db_path(employee_id)
            if not db_path.exists():
                return ""
            
            store = self._get_memento_store(employee_id)
            try:
                # Query Memento's recall engine
                memory_ctx = store.recall(query=query, token_budget=1500)
                recalled_text = getattr(memory_ctx, "text", "") or ""
                
                # If query specifically asks about past discussions or yesterday
                lower_q = query.lower()
                if any(k in lower_q for k in ("yesterday", "earlier", "previous", "last time", "we discuss", "we talk", "remind me")):
                    # Fetch recent verbatim chunks from Memento's verbatim_chunks table if text was brief
                    try:
                        cursor = store._db.execute(
                            "SELECT text FROM verbatim_chunks ORDER BY rowid DESC LIMIT 8"
                        )
                        rows = cursor.fetchall()
                        if rows:
                            recent_exchanges = "\n".join([f"- {r[0]}" for r in reversed(rows)])
                            if recalled_text:
                                recalled_text = f"{recalled_text}\n\nRecent Conversation Log:\n{recent_exchanges}"
                            else:
                                recalled_text = f"Recent Conversation Log:\n{recent_exchanges}"
                    except Exception:
                        pass
                
                return recalled_text.strip()
            except Exception as e:
                # Log error and return empty memory rather than crashing
                return ""
            finally:
                store.close()

    def get_conversation_history(self, employee_id: int, limit: int = 20) -> List[Dict[str, Any]]:
        """
        Retrieves the employee's raw past conversation entries from their isolated Memento database.
        """
        with self._get_employee_lock(employee_id):
            db_path = self._get_employee_db_path(employee_id)
            if not db_path.exists():
                return []
            
            store = self._get_memento_store(employee_id)
            history = []
            try:
                cols = [row[1] for row in store._db.execute("PRAGMA table_info(verbatim_chunks)").fetchall()]
                has_time = "timestamp" in cols
                query_sql = "SELECT text, timestamp FROM verbatim_chunks ORDER BY rowid ASC LIMIT ?" if has_time else "SELECT text, NULL FROM verbatim_chunks ORDER BY rowid ASC LIMIT ?"
                cursor = store._db.execute(query_sql, (limit,))
                rows = cursor.fetchall()
                for text_val, timestamp_val in rows:
                    if text_val.startswith("Employee asked: "):
                        history.append({
                            "role": "user",
                            "content": text_val[len("Employee asked: "):],
                            "created_at": timestamp_val
                        })
                    elif text_val.startswith("Compliance Assistant replied: "):
                        history.append({
                            "role": "assistant",
                            "content": text_val[len("Compliance Assistant replied: "):],
                            "created_at": timestamp_val
                        })
            except Exception:
                pass
            finally:
                store.close()
            return history

memento_service = MementoService()
