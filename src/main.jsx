import React from 'react'
import { registerSW } from 'virtual:pwa-register'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <CartProvider>
        <App />
      </CartProvider>
    </AuthProvider>
  </React.StrictMode>,
)


// Register PWA service worker only on Web; skip in Electron to prevent file:// protocol issues
if ('serviceWorker' in navigator && !window.electronAPI?.isElectron) {
  registerSW({ immediate: true })
}
