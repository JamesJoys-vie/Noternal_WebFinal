import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { LayoutProvider } from './contexts/layout-context.jsx';
import { ThemeProvider } from './contexts/theme-context.jsx';
import './index.css'
import App from './app.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <LayoutProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </LayoutProvider>
    </ThemeProvider>
  </StrictMode>,
)
