import { useState } from 'react'
import './App.css'
import StarknetApp from './components/StarknetApp'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="App" style={{
      minHeight: '100vh',
      background: '#f3f4f6',
      padding: '1rem'
    }}>
      <StarknetApp />
    </div>
  )
}

export default App
