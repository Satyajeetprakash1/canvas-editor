import { useCallback, useEffect, useRef, useReducer } from 'react'

/**
 * Undo/redo via a snapshot stack of canvas JSON.
 * Snapshots are pushed on object:added / object:modified / object:removed,
 * throttled so a drag-resize doesn't flood the stack.
 */
export default function useCanvasHistory(canvas) {
  const undoStack = useRef([])
  const redoStack = useRef([])
  const throttling = useRef(false)
  
  // CRITICAL FIX: Lock prevents loadFromJSON from triggering new snapshots
  const isLocked = useRef(false) 
  
  const [, forceRender] = useReducer((x) => x + 1, 0)

  const snapshot = useCallback(() => {
    // If we are currently undoing/redoing, ignore the canvas mutation events
    if (!canvas || throttling.current || isLocked.current) return
    
    throttling.current = true
    setTimeout(() => (throttling.current = false), 300)
    
    undoStack.current.push(JSON.stringify(canvas.toJSON()))
    if (undoStack.current.length > 50) undoStack.current.shift()
    
    redoStack.current = []
    forceRender()
  }, [canvas])

  const undo = useCallback(async () => {
    if (!canvas || undoStack.current.length === 0) return
    
    isLocked.current = true // Lock the event listeners
    
    redoStack.current.push(JSON.stringify(canvas.toJSON()))
    const prev = undoStack.current.pop()
    
    // Parse the JSON string into an object for Fabric v6 compatibility
    await canvas.loadFromJSON(JSON.parse(prev))
    canvas.renderAll()
    
    isLocked.current = false // Unlock the event listeners
    forceRender()
  }, [canvas])

  const redo = useCallback(async () => {
    if (!canvas || redoStack.current.length === 0) return
    
    isLocked.current = true // Lock the event listeners
    
    undoStack.current.push(JSON.stringify(canvas.toJSON()))
    const next = redoStack.current.pop()
    
    // Parse the JSON string into an object for Fabric v6 compatibility
    await canvas.loadFromJSON(JSON.parse(next))
    canvas.renderAll()
    
    isLocked.current = false // Unlock the event listeners
    forceRender()
  }, [canvas])

  useEffect(() => {
    if (!canvas) return
    const events = ['object:added', 'object:modified', 'object:removed']
    events.forEach((e) => canvas.on(e, snapshot))
    return () => events.forEach((e) => canvas.off(e, snapshot))
  }, [canvas, snapshot])

  return { 
    undo, 
    redo, 
    canUndo: undoStack.current.length > 0, 
    canRedo: redoStack.current.length > 0 
  }
}