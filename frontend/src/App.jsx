import { useEffect, useState } from 'react'
import './App.css'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
const PIPELINE_STEPS = ['Store Notes', 'Embed Text', 'Retrieve Chunks', 'Generate Answer']
const SAMPLE_QUESTIONS = [
  'What should I focus on next?',
  'What themes keep showing up in my notes?',
  'What decisions have I been leaning toward?',
  'What should I revisit from my notes?',
]
const STEP_META = {
  'Store Notes': { icon: '🗒', detail: 'Save your thoughts and reflections.' },
  'Embed Text': { icon: '⌘', detail: 'Convert notes into vector embeddings.' },
  'Retrieve Chunks': { icon: '⌕', detail: 'Find the most relevant context.' },
  'Generate Answer': { icon: '✧', detail: 'Produce grounded, actionable answers.' },
}

const THINKING_STEPS = [
  {
    label: 'Searching your notes',
    detail: 'Scanning your stored reflections for the most relevant context.',
  },
  {
    label: 'Ranking relevant context',
    detail: 'Comparing chunks to your question and selecting the strongest matches.',
  },
  {
    label: 'Generating grounded answer',
    detail: 'Drafting a response based on the retrieved evidence.',
  },
]

const formatSimilarityPercentage = (similarity) => {
  const value = Number(similarity)
  if (Number.isNaN(value)) return '0%'
  return `${Math.max(0, Math.min(100, value * 100)).toFixed(1)}%`
}

function App() {
  const [noteContent, setNoteContent] = useState('')
  const [question, setQuestion] = useState('')

  const [isSubmittingNote, setIsSubmittingNote] = useState(false)
  const [isAskingQuestion, setIsAskingQuestion] = useState(false)

  const [noteMessage, setNoteMessage] = useState({ type: '', text: '' })
  const [askMessage, setAskMessage] = useState({ type: '', text: '' })

  const [answer, setAnswer] = useState('')
  const [retrievedChunks, setRetrievedChunks] = useState([])
  const [thinkingStepIndex, setThinkingStepIndex] = useState(0)
  const [isHoveringSource, setIsHoveringSource] = useState(false)
  const [hoveredSourceDoc, setHoveredSourceDoc] = useState(null)

  useEffect(() => {
    if (!isAskingQuestion) {
      setThinkingStepIndex(0)
      return
    }

    const interval = setInterval(() => {
      setThinkingStepIndex((current) => (current + 1) % THINKING_STEPS.length)
    }, 1400)

    return () => clearInterval(interval)
  }, [isAskingQuestion])

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
    setThinkingStepIndex(0)
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
      const normalizedMatches = (Array.isArray(data.matches) ? data.matches : []).map(
        (match, index) => ({
          content:
            typeof match === 'string' ? match : (match?.content ?? match?.text ?? ''),
          similarity:
            typeof match?.similarity === 'number'
              ? match.similarity
              : (typeof match?.score === 'number' ? match.score : 0),
          document_id:
            typeof match === 'object' && match !== null
              ? (match.document_id ?? match.doc_id ?? index + 1)
              : index + 1,
          chunk_index:
            typeof match === 'object' && match !== null
              ? (match.chunk_index ?? match.id ?? index)
              : index,
        }),
      )
      setRetrievedChunks(normalizedMatches)
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

  const activeThinkingStep = THINKING_STEPS[thinkingStepIndex]

  return (
    <main className="app-shell">
      <div className="app-container">
      <section className="hero-layout layout-top">
        <div className="hero-copy">
          <p className="eyebrow">Personal Intelligence System</p>
          <h1>Ask your notes. Get grounded answers you can act on.</h1>
          <p className="subtitle">
            Capture your thinking, run retrieval across your knowledge base, and generate responses
            backed by relevant source chunks.
          </p>
          <p className="supporting-line">
            Clean RAG workflow for turning stored context into clear next-step insight.
          </p>
          <div className="hero-value-strip" aria-label="Core product value points">
            <div className="value-pill">
              <span className="value-icon" aria-hidden="true">
                ◌
              </span>
              <span>Store insights</span>
            </div>
            <div className="value-pill">
              <span className="value-icon" aria-hidden="true">
                ◌
              </span>
              <span>Retrieve relevant context</span>
            </div>
            <div className="value-pill">
              <span className="value-icon" aria-hidden="true">
                ◌
              </span>
              <span>Generate grounded answers</span>
            </div>
          </div>
        </div>

        <aside className="hero-aside">
          <p className="hero-aside-label">Clarity Path</p>
          <div className="architecture-ribbon" aria-label="RAG architecture steps">
            {PIPELINE_STEPS.map((step, index) => (
              <div key={step} className="ribbon-step">
                <span className="step-icon" aria-hidden="true">
                  {STEP_META[step]?.icon || '•'}
                </span>
                <span className="step-index">{index + 1}</span>
                <span className="step-copy">
                  <span className="step-label">{step}</span>
                  <span className="step-detail">{STEP_META[step]?.detail}</span>
                </span>
                <span className="flow-arrow">›</span>
              </div>
            ))}
          </div>
        </aside>
      </section>

      <section className="workspace-grid layout-middle">
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
              {isAskingQuestion ? 'Thinking...' : 'Get Insight'}
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
            {askMessage.text ? (
              <p className={`status ${askMessage.type}`}>{askMessage.text}</p>
            ) : null}
          </form>
        </article>
      </section>

      <section className="insight-stage layout-bottom">
        <div className={`answer-card${isHoveringSource ? ' answer-card-linked' : ''}`}>
          <h3>Generated Answer</h3>
          <p className="section-caption">Primary response generated from your retrieved context.</p>

          {isAskingQuestion ? (
            <div className="thinking-state" aria-live="polite" aria-label="Generating answer">
              <div className="thinking-badge">
                <span className="thinking-dot" aria-hidden="true" />
                <span>{activeThinkingStep.label}</span>
              </div>
              <p className="thinking-detail">{activeThinkingStep.detail}</p>

              <div className="skeleton-stack" aria-hidden="true">
                <div className="skeleton-line skeleton-line-lg" />
                <div className="skeleton-line" />
                <div className="skeleton-line" />
                <div className="skeleton-line skeleton-line-sm" />
              </div>
            </div>
          ) : answer ? (
            <>
              <p className="grounding-label">Based on {retrievedChunks.length} retrieved notes</p>
              {hoveredSourceDoc !== null ? (
                <p className="source-reference-label">Referencing Doc {hoveredSourceDoc}</p>
              ) : null}
              <p>{answer}</p>
            </>
          ) : (
            <div className="empty-state-card">
              <h3>Answer will appear here</h3>
              <p>Ask a question to generate a grounded response based on your stored notes.</p>
            </div>
          )}
        </div>

        <div className="chunks-section">
          <h3>Retrieved Sources</h3>
          <p className="section-caption">Supporting evidence with source metadata and similarity.</p>

          {isAskingQuestion ? (
            <>
              <div className="thinking-badge thinking-badge-secondary" aria-live="polite">
                <span className="thinking-dot" aria-hidden="true" />
                <span>Preparing source evidence</span>
              </div>

              <div className="chunks-grid" aria-label="Loading retrieved sources">
                {[1, 2, 3].map((item) => (
                  <article key={item} className="chunk-card chunk-skeleton">
                    <div className="chunk-meta">
                      <span className="chip-skeleton" />
                      <span className="chip-skeleton" />
                      <span className="chip-skeleton chip-skeleton-score" />
                    </div>
                    <div className="skeleton-stack">
                      <div className="skeleton-line" />
                      <div className="skeleton-line" />
                      <div className="skeleton-line skeleton-line-sm" />
                    </div>
                  </article>
                ))}
              </div>
            </>
          ) : retrievedChunks.length === 0 ? (
            <div className="empty-state-card">
              <h3>Source evidence will appear here</h3>
              <p>
                Retrieved chunks and similarity scores are shown after you run a question so you can
                verify what grounded the answer.
              </p>
            </div>
          ) : (
            <div className="chunks-grid">
              {retrievedChunks.map((chunk, index) => (
                <article
                  key={`${chunk.document_id}-${chunk.chunk_index}-${index}`}
                  className="chunk-card"
                  onMouseEnter={() => {
                    setIsHoveringSource(true)
                    setHoveredSourceDoc(chunk.document_id ?? index + 1)
                  }}
                  onMouseLeave={() => {
                    setIsHoveringSource(false)
                    setHoveredSourceDoc(null)
                  }}
                >
                  <div className="chunk-meta">
                    <span>Doc {chunk.document_id}</span>
                    <span>Chunk {chunk.chunk_index}</span>
                    <span>Similarity {formatSimilarityPercentage(chunk.similarity)}</span>
                  </div>
                  <p>{chunk.content}</p>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
      </div>
    </main>
  )
}

export default App