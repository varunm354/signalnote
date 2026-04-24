from fastapi import FastAPI
from pydantic import BaseModel

from .database import Base, SessionLocal, engine
from .models import Item
from .embeddings import get_embedding

from .search import cosine_similarity
from sqlalchemy import text
from openai import OpenAI

from fastapi.middleware.cors import CORSMiddleware

client = OpenAI()

Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ItemCreate(BaseModel):
    type: str
    content: str

def generate_answer(query: str, retrieved_chunks: list[dict]) -> str:
    context = "\n\n".join(
        [
            f"Source {i+1} (doc {chunk['document_id']}, chunk {chunk['chunk_index']}):\n{chunk['content']}"
            for i, chunk in enumerate(retrieved_chunks)
        ]
    )

    response = client.chat.completions.create(
        model="gpt-4.1-mini",
        messages=[
            {
                "role": "system",
                "content": (
                    "Use only the provided context to answer the question. "
                    "If the context is relevant but does not actually answer the question, say exactly: "
                    "'I don't know based on the stored data.' "
                    "Do not use outside knowledge."
                ),
            },
            {
                "role": "user",
                "content": f"""Context:
{context}

Question:
{query}

Answer using only the context above.""",
            },
        ],
        temperature=0
    )

    return response.choices[0].message.content

def chunk_text(text: str, chunk_size: int = 40, overlap: int = 5) -> list[str]:
    words = text.split()
    chunks = []
    
    start = 0
    while start < len(words):
        end = start + chunk_size
        chunk_words = words[start:end]
        chunk = " ".join(chunk_words)
        
        if chunk:
            chunks.append(chunk)
        
        start += chunk_size - overlap

    return chunks

@app.get("/")
def home():
    return {"message": "AI Personal Intelligence System is running"}


@app.post("/items")
def create_item(item: ItemCreate):
    try:
        chunks = chunk_text(item.content)

        with SessionLocal() as db:
            last_item = db.query(Item).order_by(Item.document_id.desc()).first()

            if last_item is None or last_item.document_id is None:
                next_document_id = 1
            else:
                next_document_id = last_item.document_id + 1

            created_chunks = []

            for index, chunk in enumerate(chunks):
                embedding = get_embedding(chunk)

                db_item = Item(
                    document_id=next_document_id,
                    chunk_index=index,
                    type=item.type,
                    content=chunk,
                    embedding=embedding
                )

                db.add(db_item)

                created_chunks.append({
                    "chunk_index": index,
                    "content": chunk
                })

            db.commit()

            return {
                "message": "Document chunked and stored successfully",
                "document_id": next_document_id,
                "num_chunks": len(created_chunks),
                "chunks": created_chunks
            }

    except Exception as e:
        return {"error": str(e)}

@app.get("/search")
def search(query: str):
    try:
        with SessionLocal() as db:
            query_embedding = get_embedding(query)

            items = db.query(Item).all()

            results = []
            for item in items:
                if item.embedding is None:
                    continue

                similarity = cosine_similarity(query_embedding, list(item.embedding))

                results.append({
                    "id": item.id,
                    "content": item.content,
                    "similarity": float(similarity)
                })

            results.sort(key=lambda x: x["similarity"], reverse=True)
            return {"results": results[:5]}

    except Exception as e:
        return {
            "error": str(e),
            "error_type": type(e).__name__
        }

@app.get("/ask")
def ask(query: str):
    try:
        query_embedding = get_embedding(query)
        query_embedding_str = str(query_embedding)

        with SessionLocal() as db:
            sql = text("""
                SELECT
                    document_id,
                    chunk_index,
                    content,
                    1 - (embedding <=> CAST(:query_embedding AS vector)) AS similarity
                FROM items
                WHERE embedding IS NOT NULL
                ORDER BY embedding <=> CAST(:query_embedding AS vector)
                LIMIT 3
            """)

            result = db.execute(
                sql,
                {"query_embedding": query_embedding_str}
            )

            rows = result.fetchall()

            if not rows:
                return {
                    "query": query,
                    "answer": "I don't know based on the stored data.",
                    "retrieved_chunks": []
                }

            # get best similarity score
            best_similarity = max(float(row.similarity) for row in rows)

            retrieved_chunks = [
                {
                    "document_id": row.document_id,
                    "chunk_index": row.chunk_index,
                    "content": row.content,
                    "similarity": float(row.similarity)
                }
                for row in rows
                if float(row.similarity) >= max(0.58, best_similarity - 0.05)
            ]

            unique_chunks = []
            seen_contents = set()

            for chunk in retrieved_chunks:
                if chunk["content"] not in seen_contents:
                    unique_chunks.append(chunk)
                    seen_contents.add(chunk["content"])

            retrieved_chunks = unique_chunks

            if not retrieved_chunks:
                return {
                    "query": query,
                    "answer": "I don't know based on the stored data.",
                    "retrieved_chunks": []
                }

            answer = generate_answer(query, retrieved_chunks)

            return {
                "query": query,
                "answer": answer,
                "retrieved_chunks": retrieved_chunks
            }

    except Exception as e:
        return {
            "error": str(e),
            "error_type": type(e).__name__
        }


@app.get("/search_db")
def search_db(query: str):
    try:
        query_embedding = get_embedding(query)

        with SessionLocal() as db:
            sql = text("""
                SELECT
                    id,
                    content,
                    1 - (embedding <=> :query_embedding) AS similarity
                FROM items
                WHERE embedding IS NOT NULL
                ORDER BY embedding <=> :query_embedding
                LIMIT 5
            """)

            result = db.execute(
                sql,
                {"query_embedding": query_embedding}
            )

            rows = result.fetchall()

            return {
                "results": [
                    {
                        "id": row.id,
                        "content": row.content,
                        "similarity": float(row.similarity)
                    }
                    for row in rows
                ]
            }

    except Exception as e:
        return {
            "error": str(e),
            "error_type": type(e).__name__
        }