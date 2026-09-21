import { Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/Home.jsx'
import CanvasEditor from './pages/CanvasEditor.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/canvas/:canvasId" element={<CanvasEditor />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
