import { useAppRouter } from '@/stores/appRouter'
import { ChatView } from '@/components/chat/ChatView'
import { EditorView } from '@/components/editor/EditorView'

function App() {
  const { currentView } = useAppRouter()

  return (
    <div className="h-screen w-screen overflow-hidden">
      {currentView === 'chat' ? <ChatView /> : <EditorView />}
    </div>
  )
}

export default App
