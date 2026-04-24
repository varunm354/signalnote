import { useState } from 'react'
import './App.css'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
const PIPELINE_STEPS = ['Store Notes', 'Embed Text', 'Retrieve Chunks', 'Generate Answer']
const SAMPLE_QUESTIONS = [
  'What does pgvector do?',
  'How does semantic search work in this project?',
  'Explain embeddings in simple terms',
]

function App() {
  const [noteContent, setNoteContent] = useState('')
  const [question, setQuestion] = useState('')

  const [isSubmittingNote, setIsSubmittingNote] = useState(false)
  const [isAskingQuestion, setIsAskingQuestion] = useState(false)

  const [noteMessage, setNoteMessage] = useState({ type: '', text: '' })
  const [askMessage, setAskMessage] = useState({ type: '', text: '' })

  const [answer, setAnswer] = useState('')
  const [retrievedChunks, setRetrievedChunks] = useState([])

  const handleAddKnowledge = async (event) => {
    event.preventDefault()

    const trimmedNote = noteContent.trim()
    if (!trimmedNote) {
      setNoteMessage({ type: 'error', text: 'Please enter note content before submitting.' })
      return
    }

    setIsSubmittingNote(true)
    setNoteMessage({ type: '', text: '' })

    try {
      const response = await fetch(`${API_BASE_URL}/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'note',
          content: trimmedNote,
        }),
      })

      const data = await response.json()

      if (!response.ok || data.error) {
        throw new Error(data.error || 'Failed to store note.')
      }

      setNoteMessage({
        type: 'success',
        text: `Saved document #${data.document_id} with ${data.num_chunks} chunk(s).`,
      })
      setNoteContent('')
    } catch (error) {
      setNoteMessage({
        type: 'error',
        text: error.message || 'Something went wrong while saving your note.',
      })
    } finally {
      setIsSubmittingNote(false)
    }
  }

  const handleAskQuestion = async (event) => {
    event.preventDefault()

    const trimmedQuestion = question.trim()
    if (!trimmedQuestion) {
      setAskMessage({ type: 'error', text: 'Type a question to run retrieval and generation.' })
      return
    }

    setIsAskingQuestion(true)
    setAskMessage({ type: '', text: '' })
    setAnswer('')
    setRetrievedChunks([])

    try {
      const response = await fetch(
        `${API_BASE_URL}/ask?query=${encodeURIComponent(trimmedQuestion)}`,
      )
      const data = await response.json()

      if (!response.ok || data.error) {
        throw new Error(data.error || 'Failed to fetch answer.')
      }

      setAnswer(data.answer || 'No answer was returned.')
      setRetrievedChunks(Array.isArray(data.retrieved_chunks) ? data.retrieved_chunks : [])
      setAskMessage({ type: 'success', text: 'Answer generated from retrieved context.' })
    } catch (error) {
      setAskMessage({
        type: 'error',
        text: error.message || 'Something went wrong while asking your question.',
      })
    } finally {
      setIsAskingQuestion(false)
    }
  }

  return (
    <main className="app-shell">
      <section className="hero-layout">
        <div className="hero-copy">
          <p className="eyebrow">Momentum Journal</p>
          <h1>Build clarity from what you have already lived.</h1>
          <p className="subtitle">
            A reflective system for capturing lessons, asking better questions, and turning your own
            notes into grounded direction.
          </p>
          <p className="supporting-line">
            Less noise. More signal. Evidence-backed insight for focused progress.
          </p>
        </div>

        <aside className="hero-aside">
          <p className="hero-aside-label">Clarity Path</p>
          <div className="architecture-ribbon" aria-label="RAG architecture steps">
            {PIPELINE_STEPS.map((step, index) => (
              <div key={step} className="ribbon-step">
                <span className="step-index">{index + 1}</span>
                <span className="step-label">{step}</span>
                {index < PIPELINE_STEPS.length - 1 ? <span className="flow-arrow">/</span> : null}
              </div>
            ))}
          </div>
        </aside>
      </section>

      <section className="workspace-grid">
        <article className="capture-column">
          <div className="panel-header">
            <h2>Capture What Matters</h2>
            <p>Store reflections, lessons, and decisions you want to carry forward.</p>
          </div>

          <form onSubmit={handleAddKnowledge} className="form-stack">
            <label htmlFor="note-content" className="label">
              Reflection or insight
            </label>
            <textarea
              id="note-content"
              value={noteContent}
              onChange={(event) => setNoteContent(event.target.value)}
              className="input textarea"
              placeholder="Write what you learned, noticed, or want to remember..."
              rows={8}
              disabled={isSubmittingNote}
            />
            <button type="submit" className="button" disabled={isSubmittingNote}>
              {isSubmittingNote ? 'Saving reflection...' : 'Store Insight'}
            </button>
            {noteMessage.text ? (
              <p className={`status ${noteMessage.type}`}>{noteMessage.text}</p>
            ) : null}
          </form>
        </article>

        <article className="clarity-column">
          <div className="panel-header">
            <h2>Ask For Clarity</h2>
            <p>Surface focused direction from the context you have already captured.</p>
          </div>

          <form onSubmit={handleAskQuestion} className="form-stack">
            <label htmlFor="question-input" className="label">
              Clarity question
            </label>
            <input
              id="question-input"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              className="input"
              placeholder="What should I focus on next based on my notes?"
              disabled={isAskingQuestion}
            />
            <button type="submit" className="button" disabled={isAskingQuestion}>
              {isAskingQuestion ? 'Finding clarity...' : 'Get Insight'}
            </button>
            <div className="sample-questions" aria-label="Sample questions">
              {SAMPLE_QUESTIONS.map((sample) => (
                <button
                  key={sample}
                  type="button"
                  className="chip-button"
                  onClick={() => setQuestion(sample)}
                  disabled={isAskingQuestion}
                >
                  {sample}
                </button>
              ))}
            </div>
            {askMessage.text ? <p className={`status ${askMessage.type}`}>{askMessage.text}</p> : null}
          </form>
        </article>
      </section>
      {(answer || retrievedChunks.length > 0) ? (
        <section className="insight-stage">
          <div className="answer-card">
            <h3>Guided Insight</h3>
            <p>{answer}</p>
          </div>

          <div className="chunks-section">
            <h3>Grounding Excerpts</h3>
            {retrievedChunks.length === 0 ? (
              <p className="empty-state">No supporting excerpts were found for this question yet.</p>
            ) : (
              <div className="chunks-grid">
                {retrievedChunks.map((chunk, index) => (
                  <article key={`${chunk.document_id}-${chunk.chunk_index}-${index}`} className="chunk-card">
                    <div className="chunk-meta">
                      <span>Source {chunk.document_id}</span>
                      <span>Excerpt {chunk.chunk_index}</span>
                      <span>Match {Number(chunk.similarity ?? 0).toFixed(3)}</span>
                    </div>
                    <p>{chunk.content}</p>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      ) : (
        <section className="insight-empty">
          <h3>Your direction starts here</h3>
          <p>
            Ask a clarity question to turn stored reflection into practical, grounded next steps.
          </p>
        </section>
      )}
    </main>
  )
}

export default App
