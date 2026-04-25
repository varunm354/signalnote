# SignalNote

**SignalNote** is a full-stack AI notes application that turns personal notes into **grounded, interactive insights** using Retrieval-Augmented Generation (RAG).

It allows users to store notes, retrieve semantically relevant context using vector search, and generate answers that are **explicitly tied to their own data**.

👉 **Live Demo:** https://signalnote-euqfuc8ls-varunm354s-projects.vercel.app  
⚠️ Shared demo environment — notes may persist across sessions

---

## 🚀 What makes this different

Most AI apps are just a prompt box + LLM.

SignalNote is built as a **complete AI system**, where:
- retrieval comes before generation
- answers are grounded in user data
- users can see *why* an answer was generated

Key product features:
- 🧠 Semantic search over personal notes (pgvector)
- 🔗 Grounded answers with visible source chunks
- 📊 Similarity scoring for retrieved context
- ⚡ Real-time “thinking” / loading states
- 🎯 Interactive grounding (hover → see which source influences the answer)

---

## 🧪 How it works

1. User writes a note  
2. Backend generates embeddings  
3. Notes + vectors are stored in PostgreSQL (pgvector)  
4. User asks a question  
5. Query is embedded and compared against stored vectors  
6. Top matches are retrieved based on similarity  
7. Retrieved context is passed to the LLM  
8. LLM generates a grounded answer  
9. UI displays:
   - the answer  
   - supporting sources  
   - similarity scores  
   - interactive grounding cues  

---

## 🧠 Example questions

- What patterns are showing up in my notes?  
- What should I focus on next?  
- What themes keep repeating in my thinking?  
- What decisions have I been leaning toward?  

---

## 🏗️ Tech Stack

### Frontend
- React (Vite)

### Backend
- FastAPI (Python)

### Database
- PostgreSQL
- pgvector (vector similarity search)

### AI Layer
- OpenAI Embeddings API
- OpenAI Chat/Completions API

### Deployment
- Vercel (frontend)
- Render (backend)

---

## ⚙️ Core Engineering Concepts

### 1. Semantic Retrieval (pgvector)
Notes and queries are embedded into vector space and compared using similarity search, enabling meaning-based retrieval instead of keyword matching.

### 2. Retrieval-Augmented Generation (RAG)
The system retrieves relevant note chunks first, then generates answers grounded in that context.

### 3. Multi-chunk Context Synthesis
Instead of using a single match, multiple relevant chunks are retrieved and combined to improve answer quality.

### 4. Grounded AI UX
The UI makes the system transparent:
- shows retrieved sources
- displays similarity scores
- links answers to specific notes through interaction

---

## 🖥️ Demo Experience

When using the app:
1. Add a few notes  
2. Ask a question  
3. See:
   - a grounded answer  
   - supporting source notes  
   - similarity scores  
   - interactive highlighting between answer and sources  

---



