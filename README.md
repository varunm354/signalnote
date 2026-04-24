# SignalNote

**SignalNote** is a full-stack Retrieval-Augmented Generation (RAG) application for grounded Q&A over personal notes.  
It allows users to store notes, embed them into a vector database, retrieve semantically relevant context using pgvector, and generate context-aware answers through a React frontend.

---

## Why this project

Most “AI apps” stop at a prompt box and a direct LLM call. SignalNote was built to go deeper into the system design behind modern AI products:

- semantic retrieval over user-owned data
- embeddings for meaning-based search
- grounded answer generation using retrieved context
- full-stack integration across frontend, backend, vector storage, and model APIs

The goal was to build a system where the LLM is **not the product**, but one component in a larger retrieval pipeline.

---

## What it does

SignalNote allows a user to:

- store notes through a web UI
- generate embeddings for note content
- store vectors in PostgreSQL using **pgvector**
- ask natural-language questions over stored notes
- retrieve relevant content using vector similarity search
- generate answers grounded in retrieved context

---

## Demo workflow

1. User writes a note in the frontend  
2. Backend generates an embedding for the note  
3. Note + embedding are stored in PostgreSQL  
4. User asks a question  
5. Question is embedded into the same vector space  
6. pgvector retrieves the most similar stored notes  
7. Retrieved context is sent to the LLM  
8. LLM generates a grounded answer  
9. Frontend displays the answer  

---

## System architecture

### Frontend
- React  
- Vite  

### Backend
- FastAPI (Python)

### Storage / Retrieval
- PostgreSQL  
- pgvector  

### AI layer
- OpenAI Embeddings API  
- OpenAI Chat/Completions API  

---

## Core engineering ideas implemented

### 1. Semantic retrieval instead of keyword matching
User queries are embedded and compared against stored vectors using pgvector similarity search. This allows retrieval based on meaning rather than exact wording.

### 2. Retrieval-Augmented Generation (RAG)
Instead of directly querying an LLM, the system first retrieves relevant data and then provides that context to the model to generate grounded responses.

### 3. Separation of retrieval and generation
The system separates:
- retrieval (pgvector)
- generation (LLM)

This makes the pipeline more controllable and extensible.

### 4. Full-stack AI system design
SignalNote integrates:
- frontend note ingestion
- backend orchestration
- vector storage
- semantic retrieval
- LLM-based answer generation

---

## Example queries

- What does pgvector do?  
- How does semantic search work in this project?  
- Explain embeddings in simple terms  

---

## Project structure

```text
signalnote/
  backend/
    app/
      main.py
      database.py
      embeddings.py
      models.py
  frontend/
    src/
      App.jsx
      App.css
  assets/
    signalnote-hero.png
    signalnote-add-note.png
    signalnote-grounded-answer.png

```
## Screenshots

### Landing / product view
![SignalNote landing view](assets/signalnote-hero.png)

### Note ingestion flow
![SignalNote add note flow](assets/signalnote-add-note.png)

### Grounded answer with retrieved chunks
![SignalNote grounded answer](assets/signalnote-grounded-answer.png)