import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createCanvas } from '../lib/firebase.js'

export default function Home() {
  const navigate = useNavigate()
  const [isCreating, setIsCreating] = useState(false)

  const handleCreate = async () => {
    setIsCreating(true)
    try {
      const newCanvasId = await createCanvas()
      navigate(`/canvas/${newCanvasId}`)
    } catch (error) {
      console.error("Failed to create canvas in Firestore:", error)
      alert("Database error: Check your browser console.")
      setIsCreating(false)
    }
  }

  return (
    <div className="home-landing-wrapper">
      {/* Dynamic 3D Floating Orbs */}
      <div className="orb orb-1"></div>
      <div className="orb orb-2"></div>
      <div className="orb orb-3"></div>

      <main className="landing-container">
        {/* Hero Section with 3D Depth */}
        <div className="hero-card-3d">
          <div className="hero-badge">
            <span className="pulse-dot"></span> Next-Gen Visual Workspace
          </div>
          
          <h1 className="hero-title">
            Craft Ideas Without <br />
            <span className="text-gradient">Boundaries</span>
          </h1>
          
          <p className="hero-description">
            An advanced, cloud-synchronized 2D canvas workspace engineered with React and Fabric.js v6. Experience fluid vector manipulation, real-time Firestore persistence, and modular page layouts.
          </p>

          <div className="hero-cta-group">
            <button 
              className={`launch-btn ${isCreating ? 'loading' : ''}`} 
              onClick={handleCreate} 
              disabled={isCreating}
            >
              {isCreating ? 'Initializing Workspace...' : 'Create New Canvas'}
              {!isCreating && (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* 3D Interactive Feature Cards */}
        <div className="features-grid-3d">
          <div className="feature-box-3d">
            <div className="icon-wrapper blue">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg>
            </div>
            <h3>Fabric.js v6 Engine</h3>
            <p>Object-oriented canvas rendering featuring high-performance vector manipulation and smooth path creation.</p>
          </div>

          <div className="feature-box-3d">
            <div className="icon-wrapper purple">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"></path></svg>
            </div>
            <h3>History & State Management</h3>
            <p>Custom React hooks tracking JSON serialization state to build a reliable snapshot stack for Undo/Redo actions.</p>
          </div>

          <div className="feature-box-3d">
            <div className="icon-wrapper green">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
            </div>
            <h3>Cloud Synchronization</h3>
            <p>Debounced autosaving architecture with live NoSQL database document persistence and unique URLs.</p>
          </div>
        </div>
      </main>
    </div>
  )
}