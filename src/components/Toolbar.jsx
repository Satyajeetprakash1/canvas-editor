export default function Toolbar({
  activeTool,
  onToolChange,
  fillColor,
  onFillColorChange,
  strokeColor,
  onStrokeColorChange,
  brushSize,
  onBrushSizeChange,
  onDelete,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onImageUpload,
  aiPrompt,
  setAiPrompt,
  onAiGenerate,
  isAiLoading,
  showAiBar,
  setShowAiBar
}) {
  return (
    <>
      {/* Floating AI Input Bar */}
      <div className={`ai-prompt-bar ${showAiBar ? 'visible' : ''}`}>
        <input 
          type="text" 
          className="ai-input" 
          placeholder="Describe an image to generate (e.g., A neon banana)..." 
          value={aiPrompt}
          onChange={(e) => setAiPrompt(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onAiGenerate()}
          disabled={isAiLoading}
        />
        <button className="btn" onClick={onAiGenerate} disabled={isAiLoading || !aiPrompt}>
          {isAiLoading ? 'Generating...' : 'Create'}
        </button>
      </div>

      <div className="toolbar floating-pill">
        <div className="tool-group">
          <button className={`tool-btn ${activeTool === 'select' ? 'active' : ''}`} onClick={() => onToolChange('select')} data-tooltip="Select (V)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/><path d="M13 13l6 6"/></svg>
          </button>

          <button className={`tool-btn ${activeTool === 'pen' ? 'active' : ''}`} onClick={() => onToolChange('pen')} data-tooltip="Sketch Pen (P)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.586 7.586"/><circle cx="11" cy="11" r="2"/></svg>
          </button>
          
          <button className={`tool-btn ${activeTool === 'highlighter' ? 'active' : ''}`} onClick={() => onToolChange('highlighter')} data-tooltip="Highlighter (H)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/><path d="M15 5l4 4"/></svg>
          </button>

          <button className={`tool-btn ${activeTool === 'eraser' ? 'active' : ''}`} onClick={() => onToolChange('eraser')} data-tooltip="Eraser (E)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 20H7L3 16C2.5 15.5 2.5 14.5 3 14L13 4C13.5 3.5 14.5 3.5 15 4L20 9C20.5 9.5 20.5 10.5 20 11L11 20"/><path d="M17 14L7 20"/></svg>
          </button>
          
          {(activeTool === 'pen' || activeTool === 'highlighter' || activeTool === 'eraser') && (
            <div className="brush-slider-container" data-tooltip="Adjust Brush Size">
              <input type="range" className="brush-slider" min="1" max="50" value={brushSize} onChange={(e) => onBrushSizeChange(parseInt(e.target.value))} />
            </div>
          )}

          <button className={`tool-btn ${activeTool === 'text' ? 'active' : ''}`} onClick={() => onToolChange('text')} data-tooltip="Add Text (T)" style={{ marginLeft: '4px' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>
          </button>

          <div data-tooltip="Insert Shape" style={{ display: 'flex' }}>
            <select className="tool-select" style={{ marginLeft: '4px' }} value={['rect', 'circle', 'triangle', 'ellipse', 'line'].includes(activeTool) ? activeTool : ''} onChange={(e) => onToolChange(e.target.value)}>
              <option value="" disabled>Shapes</option>
              <option value="rect">Rectangle</option>
              <option value="circle">Circle</option>
              <option value="triangle">Triangle</option>
              <option value="ellipse">Ellipse</option>
              <option value="line">Line</option>
            </select>
          </div>
          
          <label className="tool-btn" data-tooltip="Upload Image" style={{ cursor: 'pointer', marginLeft: '4px' }}>
            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={onImageUpload} />
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
          </label>

          {/* AI Diagram Generation Toggle */}
          <button 
            className={`tool-btn ${showAiBar ? 'active' : ''}`} 
            onClick={() => setShowAiBar(!showAiBar)} 
            data-tooltip="Generate AI Image"
            style={{ color: 'var(--accent)' }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l3 6 6 3-6 3-3 6-3-6-6-3 6-3z"/><path d="M19 4l1 2 2 1-2 1-1 2-1-2-2-1 2-1z"/></svg>
          </button>
        </div>

        <div className="tool-sep"></div>

        <div className="tool-group">
          <div data-tooltip="Fill Color" style={{ display: 'flex' }}>
            <input type="color" className="color-input" value={fillColor} onChange={(e) => onFillColorChange(e.target.value)} />
          </div>
          <div data-tooltip="Stroke/Brush Color" style={{ display: 'flex', marginLeft: '4px' }}>
            <input type="color" className="color-input" value={strokeColor} onChange={(e) => onStrokeColorChange(e.target.value)} />
          </div>
        </div>

        <div className="tool-sep"></div>

        <div className="tool-group">
          <button className="tool-btn" onClick={onUndo} disabled={!canUndo} data-tooltip="Undo (Ctrl+Z)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 00-9-9 9 9 0 00-6 2.3L3 13"/></svg>
          </button>
          <button className="tool-btn" onClick={onRedo} disabled={!canRedo} data-tooltip="Redo (Ctrl+Y)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 7v6h-6"/><path d="M3 17a9 9 0 019-9 9 9 0 016 2.3l3 2.7"/></svg>
          </button>
        </div>

        <div className="tool-sep"></div>

        <button className="tool-btn danger" onClick={onDelete} data-tooltip="Delete Selected (Del)">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
        </button>
      </div>
    </>
  )
}