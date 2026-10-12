import React from 'react'
import ReactDOM from 'react-dom/client'
import './style.css'

function App() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#07110f',
        color: '#ffffff',
        padding: '40px',
        fontFamily: 'Arial, sans-serif',
      }}
    >
      <h1 style={{ color: '#39ff88' }}>Central Truck CRM</h1>
      <p>CRM conectado e aplicação carregada com sucesso.</p>
    </div>
  )
}

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Elemento #root não encontrado no index.html')
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
