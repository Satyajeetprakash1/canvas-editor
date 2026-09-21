import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import * as fabric from 'fabric'
import { getCanvas, saveCanvas } from '../lib/firebase.js'
import useCanvasHistory from '../hooks/useCanvasHistory.js'
import Toolbar from '../components/Toolbar.jsx'

const AUTOSAVE_DELAY = 700
const DEFAULT_W = 794
const DEFAULT_H = 1123

export default function CanvasEditor() {
  const { canvasId } = useParams()
  const navigate = useNavigate()

  const wrapperRef = useRef(null)
  const containerRef = useRef(null)
  const fabricRef = useRef(null)
  const loadedRef = useRef(false)
  const debounceRef = useRef(null)
  const clipboardRef = useRef(null)

  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [activeTool, setActiveTool] = useState('select')
  const [saveState, setSaveState] = useState('saved')
  
  const [fillColor, setFillColor] = useState('#4f6ef7')
  const [strokeColor, setStrokeColor] = useState('#1f2937')
  const [brushSize, setBrushSize] = useState(4)
  
  const [canvasSize, setCanvasSize] = useState({ width: DEFAULT_W, height: DEFAULT_H })
  const [pageStyle, setPageStyle] = useState('fullscreen-dots') 
  const [bgColor, setBgColor] = useState('#ffffff') 
  
  // AI Generation States
  const [showAiBar, setShowAiBar] = useState(false)
  const [aiPrompt, setAiPrompt] = useState('')
  const [isAiLoading, setIsAiLoading] = useState(false)

  const [isDarkMode, setIsDarkMode] = useState(false)

  const sizeRef = useRef(canvasSize)
  const styleRef = useRef(pageStyle)
  const bgRef = useRef(bgColor)

  useEffect(() => { sizeRef.current = canvasSize }, [canvasSize])
  useEffect(() => { styleRef.current = pageStyle }, [pageStyle])
  useEffect(() => { bgRef.current = bgColor }, [bgColor])

  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark')
    } else {
      document.body.classList.remove('dark')
    }
  }, [isDarkMode])

  const [fcState, setFcState] = useState(null)
  const { undo, redo, canUndo, canRedo } = useCanvasHistory(fcState)

  /* ---------- persistence ---------- */
  const persist = useCallback(async () => {
    const fc = fabricRef.current
    if (!fc || !loadedRef.current) return
    setSaveState('saving')
    try {
      const payload = {
        ...fc.toJSON(),
        customWidth: sizeRef.current.width,
        customHeight: sizeRef.current.height,
        pageStyle: styleRef.current,
        canvasBgColor: bgRef.current
      }
      await saveCanvas(canvasId, JSON.stringify(payload))
      setSaveState('saved')
    } catch (err) {
      console.error('Save failed:', err)
      setSaveState('error')
    }
  }, [canvasId]) 

  const scheduleSave = useCallback(() => {
    clearTimeout(debounceRef.current)
    setSaveState('saving')
    debounceRef.current = setTimeout(persist, AUTOSAVE_DELAY)
  }, [persist])

  const handleCanvasSizeChange = (newSize) => {
    setCanvasSize(newSize)
    if (fabricRef.current) {
      fabricRef.current.setDimensions(newSize)
    }
    scheduleSave()
  }

  const handlePageStyleChange = (newStyle) => {
    setPageStyle(newStyle)
    if (!newStyle.startsWith('fullscreen')) {
      handleCanvasSizeChange({ width: 794, height: 1123 })
    }
    scheduleSave()
  }

  const handleBgColorChange = (color) => {
    setBgColor(color)
    scheduleSave()
  }

  /* ---------- Safe Drag-to-Resize Observer ---------- */
  useEffect(() => {
    if (!wrapperRef.current) return;
    
    const observer = new ResizeObserver((entries) => {
      if (!loadedRef.current) return; 
      
      for (let entry of entries) {
        const newW = Math.round(entry.contentRect.width);
        const newH = Math.round(entry.contentRect.height);
        
        setCanvasSize((prev) => {
          if (Math.abs(prev.width - newW) > 2 || Math.abs(prev.height - newH) > 2) {
            if (fabricRef.current) {
              fabricRef.current.setDimensions({ width: newW, height: newH });
            }
            scheduleSave();
            return { width: newW, height: newH };
          }
          return prev;
        });
      }
    });
    
    observer.observe(wrapperRef.current);
    return () => observer.disconnect();
  }, [scheduleSave])

  /* ---------- init & load ---------- */
  useEffect(() => {
    if (!containerRef.current) return;
    let isActive = true;

    containerRef.current.innerHTML = '';
    const canvasElement = document.createElement('canvas');
    containerRef.current.appendChild(canvasElement);

    const fc = new fabric.Canvas(canvasElement, {
      width: canvasSize.width,
      height: canvasSize.height,
      backgroundColor: 'transparent',
      preserveObjectStacking: true,
    })
    
    fabricRef.current = fc
    setFcState(fc) 

    const events = ['object:added', 'object:modified', 'object:removed']
    events.forEach((e) => fc.on(e, scheduleSave))
    
    fc.on('path:created', (opt) => {
      if (fc.__currentTool === 'eraser') {
        opt.path.set({
          globalCompositeOperation: 'destination-out',
          selectable: false,
          evented: false,
          stroke: 'rgba(0,0,0,1)' 
        });
        fc.requestRenderAll();
      }
      scheduleSave();
    })

    fc.on('mouse:wheel', function (opt) {
      if (opt.e.ctrlKey || opt.e.metaKey) {
        const delta = opt.e.deltaY
        let zoom = fc.getZoom()
        zoom *= 0.999 ** delta
        if (zoom > 5) zoom = 5 
        if (zoom < 0.2) zoom = 0.2 
        fc.zoomToPoint({ x: opt.e.offsetX, y: opt.e.offsetY }, zoom)
        opt.e.preventDefault()
        opt.e.stopPropagation()
      }
    })

    fc.on('mouse:down', function (opt) {
      const evt = opt.e
      
      if (fc.__currentTool === 'eraser' && opt.target) {
        fc.remove(opt.target)
        fc.discardActiveObject()
        fc.requestRenderAll()
        scheduleSave()
        return
      }

      if (evt.altKey === true) {
        this.isDragging = true
        this.selection = false
        this.lastPosX = evt.clientX
        this.lastPosY = evt.clientY
      }
    })
    
    fc.on('mouse:move', function (opt) {
      if (this.isDragging) {
        const e = opt.e
        const vpt = this.viewportTransform
        vpt[4] += e.clientX - this.lastPosX
        vpt[5] += e.clientY - this.lastPosY
        this.requestRenderAll()
        this.lastPosX = e.clientX
        this.lastPosY = e.clientY
      }
    })
    
    fc.on('mouse:up', function () {
      this.setViewportTransform(this.viewportTransform)
      this.isDragging = false
      if (fc.__currentTool !== 'eraser' && fc.__currentTool !== 'pen' && fc.__currentTool !== 'highlighter') {
        this.selection = true
      }
    })

    ;(async () => {
      try {
        const data = await getCanvas(canvasId)
        if (!isActive) return;

        if (!data) {
          setNotFound(true)
          return
        }
        
        if (data.json) {
          const parsedData = JSON.parse(data.json)
          
          if (parsedData.customWidth && parsedData.customHeight) {
             setCanvasSize({ width: parsedData.customWidth, height: parsedData.customHeight })
             fc.setDimensions({ width: parsedData.customWidth, height: parsedData.customHeight })
          }
          if (parsedData.pageStyle) {
             setPageStyle(parsedData.pageStyle)
          }
          if (parsedData.canvasBgColor) {
             setBgColor(parsedData.canvasBgColor)
          }

          await fc.loadFromJSON(parsedData)
          if (!isActive) return; 
          fc.renderAll()
        }
      } catch (err) {
        if (!isActive) return;
        console.error('Load failed:', err)
        setNotFound(true)
      } finally {
        if (isActive) {
          setTimeout(() => { loadedRef.current = true }, 100)
          setLoading(false)
        }
      }
    })()

    return () => {
      isActive = false; 
      clearTimeout(debounceRef.current)
      if (fabricRef.current) {
        try { fabricRef.current.dispose() } catch(e) {}
      }
      fabricRef.current = null
      setFcState(null)
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    }
  }, [canvasId, scheduleSave]) 

  /* ---------- tools ---------- */
  const hexToRgbA = (hex, alpha) => {
    let c;
    if(/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)){
        c= hex.substring(1).split('');
        if(c.length === 3){
            c= [c[0], c[0], c[1], c[1], c[2], c[2]];
        }
        c= '0x'+c.join('');
        return 'rgba('+[(c>>16)&255, (c>>8)&255, c&255].join(',')+','+alpha+')';
    }
    return `rgba(0,0,0,${alpha})`;
  }

  const handleToolChange = (rawToolName) => {
    const fc = fabricRef.current
    if (!fc) return

    const tool = typeof rawToolName === 'string' ? rawToolName.toLowerCase().trim() : 'select'
    fc.__currentTool = tool 

    const shapeTools = ['rectangle', 'rect', 'circle', 'triangle', 'ellipse', 'line', 'text']

    if (shapeTools.includes(tool)) {
      let obj = null
      const center = fc.getVpCenter()
      
      if (tool === 'rectangle' || tool === 'rect') {
        obj = new fabric.Rect({ left: center.x - 80, top: center.y - 50, width: 160, height: 100, fill: fillColor, stroke: strokeColor, strokeWidth: 2, rx: 4, ry: 4 })
      } else if (tool === 'circle') {
        obj = new fabric.Circle({ left: center.x - 60, top: center.y - 60, radius: 60, fill: fillColor, stroke: strokeColor, strokeWidth: 2 })
      } else if (tool === 'triangle') {
        obj = new fabric.Triangle({ left: center.x - 60, top: center.y - 60, width: 120, height: 120, fill: fillColor, stroke: strokeColor, strokeWidth: 2 })
      } else if (tool === 'ellipse') {
        obj = new fabric.Ellipse({ left: center.x - 80, top: center.y - 50, rx: 80, ry: 50, fill: fillColor, stroke: strokeColor, strokeWidth: 2 })
      } else if (tool === 'line') {
        obj = new fabric.Line([0, 0, 150, 0], { left: center.x - 75, top: center.y, stroke: strokeColor, strokeWidth: 4 })
      } else if (tool === 'text') {
        obj = new fabric.IText('Double-click to edit', { left: center.x - 100, top: center.y - 12, fill: fillColor, fontSize: 24 })
      }
      
      if (obj) {
        fc.add(obj)
        fc.setActiveObject(obj)
        fc.requestRenderAll()
        scheduleSave()
      }
      
      fc.isDrawingMode = false
      setActiveTool('select') 
      fc.__currentTool = 'select'
    } else {
      setActiveTool(rawToolName)
      fc.isDrawingMode = (tool === 'pen' || tool === 'eraser' || tool === 'highlighter')
      
      if (tool === 'eraser') {
        const eraserBrush = new fabric.PencilBrush(fc)
        eraserBrush.color = 'rgba(255, 255, 255, 0.5)' 
        eraserBrush.width = brushSize * 4
        fc.freeDrawingBrush = eraserBrush

        fc.selection = false;
        fc.hoverCursor = 'crosshair';
        fc.forEachObject(obj => obj.set('selectable', false));
      } 
      else if (tool === 'pen') {
        const brush = new fabric.PencilBrush(fc)
        brush.color = strokeColor 
        brush.width = brushSize
        fc.freeDrawingBrush = brush

        fc.selection = false;
        fc.hoverCursor = 'crosshair';
        fc.forEachObject(obj => obj.set('selectable', false));
      } 
      else if (tool === 'highlighter') {
        const brush = new fabric.PencilBrush(fc)
        brush.color = hexToRgbA(strokeColor, 0.4) 
        brush.width = brushSize * 3
        fc.freeDrawingBrush = brush

        fc.selection = false;
        fc.hoverCursor = 'crosshair';
        fc.forEachObject(obj => obj.set('selectable', false));
      }
      else {
        fc.selection = true;
        fc.hoverCursor = 'move';
        fc.forEachObject(obj => obj.set('selectable', true));
      }
      
      fc.discardActiveObject()
      fc.requestRenderAll()
    }
  }

  const handleBrushSizeChange = (newSize) => {
    setBrushSize(newSize)
    const fc = fabricRef.current
    if (fc && fc.freeDrawingBrush) {
      if (fc.__currentTool === 'eraser') {
        fc.freeDrawingBrush.width = newSize * 4;
      } else if (fc.__currentTool === 'highlighter') {
        fc.freeDrawingBrush.width = newSize * 3;
      } else {
        fc.freeDrawingBrush.width = newSize;
      }
    }
  }

  const handleFillColorChange = (newColor) => {
    setFillColor(newColor)
    const fc = fabricRef.current
    const active = fc?.getActiveObjects()
    if (active && active.length > 0) {
      active.forEach(obj => {
        if (obj.type !== 'path' && obj.type !== 'line') {
          obj.set('fill', newColor)
        } else if (obj.type === 'i-text' || obj.type === 'text') {
          obj.set('fill', newColor)
        }
      })
      fc.requestRenderAll()
      scheduleSave()
    }
  }

  const handleStrokeColorChange = (newColor) => {
    setStrokeColor(newColor)
    const fc = fabricRef.current
    const active = fc?.getActiveObjects()
    if (active && active.length > 0) {
      active.forEach(obj => {
        obj.set('stroke', newColor)
      })
      fc.requestRenderAll()
      scheduleSave()
    }
    if (fc?.isDrawingMode && fc.freeDrawingBrush && fc.__currentTool === 'pen') {
      fc.freeDrawingBrush.color = newColor
    } else if (fc?.isDrawingMode && fc.freeDrawingBrush && fc.__currentTool === 'highlighter') {
      fc.freeDrawingBrush.color = hexToRgbA(newColor, 0.4)
    }
  }

  const handleDelete = useCallback(() => {
    const fc = fabricRef.current
    const active = fc?.getActiveObjects()
    if (fc && active?.length) {
      active.forEach((o) => fc.remove(o))
      fc.discardActiveObject()
      fc.requestRenderAll()
      scheduleSave()
    }
  }, [scheduleSave])

  const handleClearCanvas = () => {
    const fc = fabricRef.current
    if (fc && window.confirm("Are you sure you want to clear the entire canvas? This cannot be undone.")) {
      fc.clear()
      fc.backgroundColor = 'transparent'
      fc.requestRenderAll()
      scheduleSave()
    }
  }

  const handleExport = () => {
    const fc = fabricRef.current
    if (!fc) return
    const prevBg = fc.backgroundColor
    fc.set('backgroundColor', bgColor !== '#ffffff' ? bgColor : (isDarkMode ? '#1a1d24' : '#ffffff'))
    fc.requestRenderAll()
    
    const dataURL = fc.toDataURL({ format: 'png', multiplier: 2 }) 
    
    fc.set('backgroundColor', prevBg)
    fc.requestRenderAll()

    const link = document.createElement('a')
    link.download = `canvas-${canvasId}.png`
    link.href = dataURL
    link.click()
  }

  const handleImageUpload = (e) => {
    const file = e.target.files[0]
    if (!file || !fabricRef.current) return

    const reader = new FileReader()
    reader.onload = async (f) => {
      const data = f.target.result
      try {
        const img = await fabric.Image.fromURL(data)
        img.scaleToWidth(300)
        const center = fabricRef.current.getVpCenter()
        img.set({ left: center.x - 150, top: center.y - 150 })
        fabricRef.current.add(img)
        fabricRef.current.setActiveObject(img)
        fabricRef.current.requestRenderAll()
        scheduleSave()
      } catch (err) {
        console.error("Failed to load image", err)
      }
    }
    reader.readAsDataURL(file)
    e.target.value = null
  }

  // FIXED: Using a reliable CORS proxy and standard Fabric v6 loading
  const handleAIGenerate = async () => {
    if (!aiPrompt || !fabricRef.current) return;
    setIsAiLoading(true);
    
    try {
      const promptSafe = encodeURIComponent(aiPrompt);
      const seed = Math.floor(Math.random() * 1000000);
      
      // Route through a reliable CORS proxy to prevent Canvas Tainting
      const imageUrl = `https://image.pollinations.ai/prompt/${promptSafe}?width=512&height=512&nologo=true&seed=${seed}`;
      const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(imageUrl)}`;
      
      // Fabric v6 native async loading with anonymous crossOrigin
      const img = await fabric.Image.fromURL(proxyUrl, { crossOrigin: 'anonymous' });
      
      img.scaleToWidth(400);
      const center = fabricRef.current.getVpCenter();
      img.set({ left: center.x - 200, top: center.y - 200 });
      
      fabricRef.current.add(img);
      fabricRef.current.setActiveObject(img);
      fabricRef.current.requestRenderAll();
      scheduleSave();
      
      setShowAiBar(false);
      setAiPrompt('');
      
    } catch (err) {
      console.error("AI Generation Error:", err);
      alert("AI Generation failed. The proxy might be overloaded, try again in a few seconds.");
    } finally {
      setIsAiLoading(false);
    }
  }

  /* ---------- keyboard shortcuts ---------- */
  useEffect(() => {
    const onKey = (e) => {
      const target = e.target
      const typing = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable
      if (typing) return

      const fc = fabricRef.current
      if (!fc) return

      if ((e.key === 'Delete' || e.key === 'Backspace') && fc.getActiveObject()) {
        e.preventDefault()
        handleDelete()
      } 
      else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault()
        undo()
      } 
      else if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey))) {
        e.preventDefault()
        redo()
      }
      else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
        const activeObj = fc.getActiveObject();
        if (activeObj) {
          e.preventDefault();
          activeObj.clone().then((cloned) => {
            clipboardRef.current = cloned;
          });
        }
      }
      else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v') {
        if (clipboardRef.current) {
          e.preventDefault();
          clipboardRef.current.clone().then((clonedObj) => {
            fc.discardActiveObject();
            
            clonedObj.set({
              left: clonedObj.left + 20,
              top: clonedObj.top + 20,
              evented: true,
            });
            
            if (clonedObj.type === 'activeSelection') {
              clonedObj.canvas = fc;
              clonedObj.forEachObject((obj) => {
                fc.add(obj);
              });
              clonedObj.setCoords();
            } else {
              fc.add(clonedObj);
            }
            
            clipboardRef.current.top += 20;
            clipboardRef.current.left += 20;
            
            fc.setActiveObject(clonedObj);
            fc.requestRenderAll();
            scheduleSave();
          });
        }
      }
    }
    
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [handleDelete, undo, redo, scheduleSave])

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setSaveState('saved')
    } catch {
      // clipboard blocked
    }
  }

  if (notFound) {
    return (
      <div className="editor">
        <div className="editor-error">
          <div style={{ textAlign: 'center' }}>
            <h2>Canvas not found</h2>
            <p style={{ margin: '8px 0 16px' }}>This link doesn’t match any canvas in Firestore.</p>
            <button className="btn" onClick={() => navigate('/')}>← Back home</button>
          </div>
        </div>
      </div>
    )
  }

  const isFullScreen = pageStyle.startsWith('fullscreen');

  return (
    <div className="editor">
      <header className="editor-header">
        <div className="left">
          <button className="btn secondary" onClick={() => navigate('/')} data-tooltip-bottom="Back to Home">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          </button>
          <span className="editor-title">Workspace</span>
          <span className="doc-id" data-tooltip-bottom="Document ID">{canvasId}</span>
          
          <div className="tool-sep" style={{ margin: '0 8px', height: '16px' }}></div>
          
          <div data-tooltip-bottom="Page Style">
            <select className="tool-select" value={pageStyle} onChange={(e) => handlePageStyleChange(e.target.value)}>
              <option value="fullscreen-dots">Full Screen (Dots)</option>
              <option value="fullscreen-grid">Full Screen (Grid)</option>
              <option value="fullscreen-blank">Full Screen (Blank)</option>
              <option value="blank">A4 Blank</option>
              <option value="ruled">A4 Ruled</option>
              <option value="grid">A4 Grid</option>
            </select>
          </div>
          
          <div data-tooltip-bottom="Canvas Background Color" style={{ display: 'flex', marginLeft: '4px' }}>
            <input type="color" className="bg-color-picker" value={bgColor} onChange={(e) => handleBgColorChange(e.target.value)} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '8px' }}>
            <div data-tooltip-bottom={isFullScreen ? "Width (Auto)" : "Width"}>
              <input type="number" disabled={isFullScreen} value={canvasSize?.width || 794} onChange={(e) => handleCanvasSizeChange({ ...canvasSize, width: parseInt(e.target.value) || 100 })} className="size-input" />
            </div>
            <span className="size-label" style={{ margin: '0 2px' }}>×</span>
            <div data-tooltip-bottom={isFullScreen ? "Height (Auto)" : "Height"}>
              <input type="number" disabled={isFullScreen} value={canvasSize?.height || 1123} onChange={(e) => handleCanvasSizeChange({ ...canvasSize, height: parseInt(e.target.value) || 100 })} className="size-input" />
            </div>
          </div>
        </div>
        
        <div className="right">
          <button className="tool-btn danger" onClick={handleClearCanvas} data-tooltip-bottom="Clear Canvas" style={{ width: 'auto', padding: '0 8px' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '16px', marginRight: '4px' }}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="9.5" y1="12.5" x2="14.5" y2="17.5"></line><line x1="14.5" y1="12.5" x2="9.5" y2="17.5"></line></svg>
            Clear
          </button>

          <button className="tool-btn" onClick={handleExport} data-tooltip-bottom="Export PNG" style={{ width: 'auto', padding: '0 8px' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '16px', marginRight: '4px' }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Export
          </button>

          <div className="tool-sep" style={{ margin: '0 8px', height: '16px' }}></div>

          <span className={`save-status ${saveState}`} style={{ marginRight: '8px' }}>
            <span className="dot" />
            {saveState === 'saving' ? 'Saving…' : saveState === 'error' ? 'Save failed' : 'Saved'}
          </span>
          
          <button className="theme-toggle" onClick={() => setIsDarkMode(!isDarkMode)} data-tooltip-bottom={isDarkMode ? "Light Mode" : "Dark Mode"}>
            {isDarkMode ? (
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
            ) : (
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
            )}
          </button>

          <button className="btn secondary" onClick={copyLink}>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
            Copy link
          </button>
          
          <button className="btn" onClick={persist} disabled={saveState === 'saving'}>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
              <polyline points="17 21 17 13 7 13 7 21"></polyline>
              <polyline points="7 3 7 8 15 8"></polyline>
            </svg>
            {saveState === 'saving' ? 'Saving…' : 'Save'}
          </button>
        </div>
      </header>

      <main className="canvas-stage">
        {loading && <div className="editor-loading">Loading canvas…</div>}
        
        <div 
          ref={wrapperRef} 
          className={`canvas-resizer-wrapper page-style-${pageStyle}`}
          style={{ 
            visibility: loading ? 'hidden' : 'visible',
            width: isFullScreen ? '100%' : `${canvasSize.width}px`, 
            height: isFullScreen ? '100%' : `${canvasSize.height}px`,
            margin: isFullScreen ? '0' : '40px',
            border: isFullScreen ? 'none' : undefined,
            borderRadius: isFullScreen ? '0' : undefined,
            resize: isFullScreen ? 'none' : 'both',
            boxShadow: isFullScreen ? 'none' : undefined,
            // FIXED: Applies to ALL page styles flawlessly
            backgroundColor: bgColor !== '#ffffff' ? bgColor : undefined
          }}
        >
          <div className="canvas-container" ref={containerRef} />
        </div>
      </main>

      <Toolbar
        activeTool={activeTool}
        onToolChange={handleToolChange}
        fillColor={fillColor}
        onFillColorChange={handleFillColorChange}
        strokeColor={strokeColor}
        onStrokeColorChange={handleStrokeColorChange}
        brushSize={brushSize}
        onBrushSizeChange={handleBrushSizeChange}
        onDelete={handleDelete}
        onUndo={undo}
        onRedo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
        onImageUpload={handleImageUpload}
        aiPrompt={aiPrompt}
        setAiPrompt={setAiPrompt}
        onAiGenerate={handleAIGenerate}
        isAiLoading={isAiLoading}
        showAiBar={showAiBar}
        setShowAiBar={setShowAiBar}
      />
    </div>
  )
}