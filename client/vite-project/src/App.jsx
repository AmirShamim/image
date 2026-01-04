import './App.css'
import { AuthProvider } from './context/AuthContext';
import ImageProcessor from './ImageProcessor.jsx';

function App() {
  return (
    <AuthProvider>
      <div className="app">
        <div className="background-shapes">
          <div className="shape shape-1"></div>
          <div className="shape shape-2"></div>
          <div className="shape shape-3"></div>
          <div className="shape shape-4"></div>
        </div>
        <ImageProcessor />
      </div>
    </AuthProvider>
  )
}

export default App
