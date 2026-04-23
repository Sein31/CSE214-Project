from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import time
from collections import defaultdict
from agents import run_chatbot

app = FastAPI(title="DataPulse AI Chatbot", version="1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200"],
    allow_credentials=False,
    allow_methods=["POST", "GET"],
    allow_headers=["Content-Type", "Authorization"],
)

# AV-09: Rate limiting (basit in-memory)
request_counts = defaultdict(list)
RATE_LIMIT = 20      # max istek
RATE_WINDOW = 60     # saniye icinde


def is_rate_limited(client_ip: str) -> bool:
    now = time.time()
    request_counts[client_ip] = [t for t in request_counts[client_ip]
                                  if now - t < RATE_WINDOW]
    if len(request_counts[client_ip]) >= RATE_LIMIT:
        return True
    request_counts[client_ip].append(now)
    return False


class ChatRequest(BaseModel):
    question: str
    role:     Optional[str] = "ADMIN"
    userId:   Optional[int] = None
    storeId:  Optional[int] = None


class ChatResponse(BaseModel):
    answer:        str
    sql_query:     Optional[str] = None
    visualization: Optional[dict] = None
    error:         Optional[str] = None


@app.post("/chat", response_model=ChatResponse)
def chat(request: ChatRequest, req: Request):
    # AV-09: Rate limit kontrolu
    client_ip = req.client.host
    if is_rate_limited(client_ip):
        return ChatResponse(
            answer="Cok fazla istek gonderdiniz. Lutfen bir dakika bekleyin.",
            error="rate_limited"
        )

    # Soru uzunluk limiti
    if len(request.question) > 500:
        return ChatResponse(answer="Soru cok uzun. Lutfen daha kisa bir soru sorun.")

    result = run_chatbot(
        question=request.question,
        role=request.role or "ADMIN",
        user_id=request.userId,
        store_id=request.storeId,
    )
    return ChatResponse(
        answer=result["answer"],
        # AV-07: SQL sorgusunu frontend'e gondermiyoruz
        sql_query=None,
        visualization=result.get("visualization"),
        error=result.get("error"),
    )


@app.get("/health")
def health():
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
