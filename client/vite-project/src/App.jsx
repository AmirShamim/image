import './App.css'
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ImageProcessor from './ImageProcessor.jsx';

function App() {
  return (
    <ThemeProvider>
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
    </ThemeProvider>
  )
}

export default App
