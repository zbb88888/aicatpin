import React from 'react'
import ReactDOM from 'react-dom/client'
import { CatPinEditor } from './components/editor/CatPinEditor'
import './styles/globals.css'

function TestApp() {
  const [content, setContent] = React.useState('')

  return (
    <div className="min-h-screen bg-background p-8">
      <h1 className="text-2xl font-bold text-cyan-400 mb-4">
        CatPinEditor 测试
      </h1>
      <div className="h-[600px]">
        <CatPinEditor
          content={content}
          onChange={setContent}
          placeholder="开始输入测试内容..."
        />
      </div>
      <div className="mt-4 p-4 bg-card rounded-lg">
        <h2 className="text-lg font-semibold text-cyan-400 mb-2">
          输出内容
        </h2>
        <pre className="text-sm text-cyan-400/60 overflow-auto max-h-40">
          {content || '暂无内容'}
        </pre>
      </div>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <TestApp />
  </React.StrictMode>
)