import { useState, useCallback, useRef } from 'react'

const MAX_STACK = 50

export default function useCanvasHistory(canvas) {
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)
  
  const undoStack = useRef([])
  const redoStack = useRef([])
  const isPerformingAction = useRef(false)

  // Push a state snapshot
  const saveState = useCallback(() => {
    if (!canvas || isPerformingAction.current) return
    const json = JSON.stringify(canvas.toJSON(['globalCompositeOperation', 'selectable', 'evented']))
    
    // Avoid duplicate consecutive saves
    const currentTop = undoStack.current[undoStack.current.length - 1]
    if (currentTop === json) return

    undoStack.current.push(json)
    if (undoStack.current.length > MAX_STACK) {
      undoStack.current.shift()
    }
    
    // Clear redo stack on new actions
    redoStack.current = []
    setCanUndo(undoStack.current.length > 1)
    setCanRedo(false)
  }, [canvas])

  // Attach auto-listeners
  if (canvas && !canvas.__historyInitialized) {
    canvas.__historyInitialized = true
    canvas.on('object:added', () => saveState())
    canvas.on('object:modified', () => saveState())
    canvas.on('object:removed', () => saveState())
    canvas.on('path:created', () => saveState())
    // Initial snapshot baseline
    if (undoStack.current.length === 0) {
      undoStack.current.push(JSON.stringify(canvas.toJSON(['globalCompositeOperation', 'selectable', 'evented'])))
      setCanUndo(false)
    }
  }

  const undo = useCallback(() => {
    if (!canvas || undoStack.current.length <= 1) return
    isPerformingAction.current = true

    const currentState = undoStack.current.pop()
    redoStack.current.push(currentState)

    const previousState = undoStack.current[undoStack.current.length - 1]
    
    canvas.loadFromJSON(previousState, () => {
      // Force clearing composite buffers to prevent white cast artifacts
      canvas.requestRenderAll()
      isPerformingAction.current = false
      setCanUndo(undoStack.current.length > 1)
      setCanRedo(redoStack.current.length > 0)
    })
  }, [canvas])

  const redo = useCallback(() => {
    if (!canvas || redoStack.current.length === 0) return
    isPerformingAction.current = true

    const nextState = redoStack.current.pop()
    undoStack.current.push(nextState)

    canvas.loadFromJSON(nextState, () => {
      canvas.requestRenderAll()
      isPerformingAction.current = false
      setCanUndo(undoStack.current.length > 1)
      setCanRedo(redoStack.current.length > 0)
    })
  }, [canvas])

  return { undo, redo, canUndo, canRedo, saveState }
}