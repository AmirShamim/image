import './App.css'
import ImageProcessor from './ImageProcessor.jsx';

function App() {
  return (
    <div className="app">
      <div className="background-shapes">
        <div className="shape shape-1"></div>
        <div className="shape shape-2"></div>
        <div className="shape shape-3"></div>
        <div className="shape shape-4"></div>
      </div>
      <ImageProcessor />
    </div>
  )
}

export default App
