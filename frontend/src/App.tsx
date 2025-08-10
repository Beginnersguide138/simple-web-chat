import { useState } from "react"
import { Toaster } from "@/components/ui/toaster"
import { IngestionForm } from "@/components/IngestionForm"
import { Chat } from "@/components/Chat"
import { ContextSelector } from "@/components/ContextSelector"
import { Sparkles, Bot, Globe } from "lucide-react"

function App() {
  const [selectedContext, setSelectedContext] = useState<string | null>(null)

  // A key can be used to force a re-render of the IngestionForm to refetch contexts
  const [ingestionKey, setIngestionKey] = useState(0)

  const handleIngestionSuccess = () => {
    // Increment the key to trigger a refetch in the ContextSelector
    setIngestionKey(prevKey => prevKey + 1)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="container mx-auto p-4 md:p-8 relative z-10">
        <header className="text-center mb-12 animate-fade-in">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl shadow-2xl transform hover:scale-110 transition-transform animate-glow animate-float">
              <Bot className="h-12 w-12 text-white" />
            </div>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-200 to-pink-200 mb-4">
            RAG Web Assistant
          </h1>
          <p className="text-gray-300 mt-2 text-lg flex items-center justify-center gap-2">
            <Sparkles className="h-5 w-5 text-yellow-400 animate-pulse" />
            Powered by AI, Milvus, and FastAPI
            <Sparkles className="h-5 w-5 text-yellow-400 animate-pulse" />
          </p>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
          <div className="lg:col-span-2 flex flex-col gap-6 animate-slide-in-left">
            <div className="backdrop-blur-lg bg-white/10 rounded-2xl shadow-2xl border border-white/20 hover:shadow-purple-500/20 transition-all duration-300">
              <IngestionForm onIngestionSuccess={handleIngestionSuccess} />
            </div>
            <div className="backdrop-blur-lg bg-white/10 rounded-2xl shadow-2xl border border-white/20 hover:shadow-blue-500/20 transition-all duration-300">
              <ContextSelector
                key={ingestionKey} // Force re-render and refetch when a new URL is ingested
                selectedContext={selectedContext}
                onContextChange={setSelectedContext}
              />
            </div>
          </div>

          <div className="lg:col-span-3 animate-slide-in-right">
            <div className="backdrop-blur-lg bg-white/10 rounded-2xl shadow-2xl border border-white/20 hover:shadow-indigo-500/20 transition-all duration-300">
              <Chat selectedContext={selectedContext} />
            </div>
          </div>
        </main>

        <footer className="text-center mt-12 text-gray-400 text-sm animate-fade-in animation-delay-1000">
          <div className="flex items-center justify-center gap-2">
            <Globe className="h-4 w-4" />
            <span>Intelligent Document Processing & Conversation</span>
          </div>
        </footer>
      </div>
      <Toaster />
    </div>
  )
}

export default App
