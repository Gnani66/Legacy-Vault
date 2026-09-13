import asyncio
import json
import os
import tempfile
from collections import deque
from threading import Lock
from typing import Literal

from dotenv import load_dotenv
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from openai import APIConnectionError, APIStatusError
from pydantic import BaseModel, ConfigDict, Field

load_dotenv()

from mock_registry import verify_certificate
from ocr import run_ocr
from qr_verification import run_qr_check
from scoring import compute_final_verdict
from verification import analyze_death_certificate, get_openai_client

app = FastAPI(
    title="Legacy Vault AI Verification Service",
    version="1.0.0",
    description="AI + OCR + QR + Mock Registry verification for death certificates",
)

# Allow backend to call
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SYSTEM_PROMPT = """You are the Legacy Vault AI continuity assistant. Provide clear, practical guidance about insurance claims, legal and probate documents, inheritance readiness, vault navigation, and blockchain or digital asset recovery.

Use the supplied vault context when it is relevant, but never reveal credentials, private keys, recovery phrases, passwords, account numbers, policy numbers, addresses, or other confidential asset details. Do not invent vault facts or legal outcomes. Explain that users should confirm legal, tax, and financial decisions with qualified professionals in their jurisdiction. If the question is unrelated to Legacy Vault or outside those topics, briefly explain the assistant's scope.

Death-certificate verification is preliminary unless a registry result is explicitly provided. Never claim that visual inspection alone proves legal authenticity."""

CHAT_SYSTEM_MESSAGE = {"role": "system", "content": SYSTEM_PROMPT}
MAX_HISTORY_MESSAGES = 10
conversation_histories: dict[str, deque[dict[str, str]]] = {}
conversation_lock = Lock()


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=4000)


class ChatRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    session_id: str = Field(min_length=1, max_length=128, pattern=r"^[A-Za-z0-9:_-]+$")
    question: str = Field(min_length=1, max_length=4000)
    context: str | None = Field(default=None, max_length=8000)


class ClearHistoryRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    session_id: str = Field(min_length=1, max_length=128, pattern=r"^[A-Za-z0-9:_-]+$")


class ChatResponse(BaseModel):
    answer: str


def get_history(session_id: str) -> list[dict[str, str]]:
    with conversation_lock:
        history = conversation_histories.get(session_id)
        return list(history) if history else []


def append_history(session_id: str, question: str, answer: str) -> None:
    with conversation_lock:
        history = conversation_histories.setdefault(session_id, deque(maxlen=MAX_HISTORY_MESSAGES))
        history.append({"role": "user", "content": question})
        history.append({"role": "assistant", "content": answer})


def clear_history(session_id: str) -> None:
    with conversation_lock:
        conversation_histories.pop(session_id, None)


def parse_chat_answer(raw_text: str | None) -> str:
    if not raw_text:
        raise ValueError("AI service returned an empty response")

    raw_text = raw_text.strip()
    try:
        parsed = json.loads(raw_text)
        if isinstance(parsed, str):
            parsed = json.loads(parsed)
        answer = parsed.get("answer") if isinstance(parsed, dict) else None
        if isinstance(answer, str) and answer.strip():
            return answer.strip()
    except (json.JSONDecodeError, AttributeError):
        pass

    return raw_text


async def generate_chat_answer(messages: list[dict[str, str]]) -> str:
    try:
        client = get_openai_client()
        model = os.getenv("OPENROUTER_MODEL") or "openai/gpt-4o-mini"
        request_options = {
            "model": model,
            "messages": messages,
            "temperature": 0.2,
            "max_tokens": 900,
            "extra_headers": {
                "HTTP-Referer": "http://localhost:8000",
                "X-Title": "Legacy Vault AI Assistant",
            },
        }

        try:
            response = await asyncio.to_thread(
                client.chat.completions.create,
                **request_options,
                response_format={"type": "json_object"},
            )
        except (APIConnectionError, APIStatusError):
            response = await asyncio.to_thread(client.chat.completions.create, **request_options)

        return parse_chat_answer(response.choices[0].message.content)
    except (APIConnectionError, APIStatusError, ValueError) as error:
        raise HTTPException(status_code=502, detail="AI assistant is temporarily unavailable") from error


@app.get("/")
async def root():
    return {"service": "Legacy Vault AI Verification", "status": "running"}


@app.get("/health")
async def health():
    return {"success": True, "service": "ai-service"}


@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    question = request.question.strip()
    messages = [CHAT_SYSTEM_MESSAGE]
    messages.extend(get_history(request.session_id))

    if request.context:
        messages.append(
            {
                "role": "system",
                "content": f"Current vault context for this authenticated user:\n{request.context.strip()}",
            }
        )

    messages.append({"role": "user", "content": question})
    answer = await generate_chat_answer(messages)
    append_history(request.session_id, question, answer)
    return ChatResponse(answer=answer)


@app.post("/chat/clear", response_model=ChatResponse)
async def clear_chat(request: ClearHistoryRequest):
    clear_history(request.session_id)
    return ChatResponse(answer="Conversation history cleared.")


@app.post("/verify-death-certificate")
async def verify_death_certificate(file: UploadFile = File(...)):
    allowed_types = [
        "application/pdf",
        "image/jpeg",
        "image/png",
        "image/webp",
    ]

    if file.content_type not in allowed_types:
        # Also allow generic octet-stream for some browsers
        if file.content_type not in ["application/octet-stream"]:
            raise HTTPException(
                status_code=400, detail="Only PDF, JPG, PNG or WEBP files are supported"
            )

    extension = os.path.splitext(file.filename or "")[1]
    if not extension:
        # infer from content_type
        if file.content_type == "application/pdf":
            extension = ".pdf"
        elif file.content_type == "image/jpeg":
            extension = ".jpg"
        else:
            extension = ".png"

    with tempfile.NamedTemporaryFile(delete=False, suffix=extension) as temp_file:
        contents = await file.read()
        if not contents or len(contents) == 0:
            raise HTTPException(status_code=400, detail="Empty file")
        temp_file.write(contents)
        temp_path = temp_file.name

    try:
        # 1. OCR
        try:
            ocr_result = run_ocr(temp_path)
        except Exception as e:
            print(f"OCR failed: {e}")
            ocr_result = {
                "certificate_number": "",
                "deceased_name": "",
                "date_of_death": "",
                "issuing_authority": "",
                "raw_text": "",
                "ocr_text": "",
            }

        # 2. QR
        try:
            qr_result = run_qr_check(temp_path)
        except Exception as e:
            print(f"QR failed: {e}")
            qr_result = {
                "qr_detected": False,
                "qr_data": None,
                "domain_verified": False,
                "approved_issuer": False,
                "reason": f"QR check error: {e}",
            }

        # 3. AI (with OCR text)
        ai_result = analyze_death_certificate(temp_path, ocr_result.get("ocr_text", ""))

        # Fallback: if AI missed fields but OCR has them, merge
        for field in ["certificate_number", "deceased_name", "date_of_death", "issuing_authority"]:
            if not ai_result.get(field) and ocr_result.get(field):
                ai_result[field] = ocr_result[field]

        # 4. Registry
        registry_result = verify_certificate(
            ai_result.get("certificate_number", ""),
            ai_result.get("deceased_name", ""),
            ai_result.get("date_of_death", ""),
        )

        # 5. Scoring
        final = compute_final_verdict(ai_result, ocr_result, qr_result, registry_result)

        return {
            "success": True,
            "verification": {
                "status": final["status"],
                "confidence": final["confidence"],
                "reason": final["reason"],
                "checks": final["checks"],
                "issues": final["issues"],
                "requires_human_review": final["requires_human_review"],
                "ai_analysis": ai_result,
                "ocr": {
                    "certificate_number": ocr_result.get("certificate_number"),
                    "deceased_name": ocr_result.get("deceased_name"),
                    "date_of_death": ocr_result.get("date_of_death"),
                    "issuing_authority": ocr_result.get("issuing_authority"),
                },
                "qr": qr_result,
                "registry_check": registry_result,
            },
        }

    except ValueError as ve:
        print(f"Verification ValueError: {ve}")
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as error:
        print(f"Verification error: {error}")
        import traceback

        traceback.print_exc()
        raise HTTPException(status_code=500, detail="AI verification failed")
    finally:
        if os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except:
                pass


# For local debug
if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("AI_PORT", "8000"))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
