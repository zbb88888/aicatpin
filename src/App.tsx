import { useState } from 'react'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="p-4 border-b">
        <h1 className="text-2xl font-bold">AICatPin</h1>
        <p className="text-muted-foreground">AI原生知识IDE</p>
      </header>
      
      <main className="container mx-auto p-4">
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <h2 className="text-4xl font-bold mb-4">欢迎使用 AICatPin</h2>
          <p className="text-lg text-muted-foreground mb-8">
            本地优先、AI原生的知识管理工具
          </p>
          
          <button
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            onClick={() => setCount((count) => count + 1)}
          >
            计数: {count}
          </button>
          
          <div className="mt-8 p-4 bg-muted rounded-lg">
            <p>技术栈: React + Tauri + Supabase + Ollama</p>
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
