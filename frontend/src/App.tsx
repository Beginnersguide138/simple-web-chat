import { useState } from "react"
import { Toaster } from "@/components/ui/toaster"
import { IngestionForm } from "@/components/IngestionForm"
import { Chat } from "@/components/Chat"
import { ContextSelector } from "@/components/ContextSelector"

function App() {
  const [selectedContext, setSelectedContext] = useState<string | null>(null)

  // A key can be used to force a re-render of the IngestionForm to refetch contexts
  const [ingestionKey, setIngestionKey] = useState(0)

  const handleIngestionSuccess = () => {
    // Increment the key to trigger a refetch in the ContextSelector
    setIngestionKey(prevKey => prevKey + 1)
  }

  return (
    <div className="min-h-screen bg-background text-foreground dark">
      <div className="container mx-auto p-4 md:p-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold tracking-tight">RAG Web Application</h1>
          <p className="text-muted-foreground mt-2">
            Powered by Ollama, Milvus, and FastAPI.
          </p>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
          <div className="lg:col-span-2 flex flex-col gap-8">
            <IngestionForm onIngestionSuccess={handleIngestionSuccess} />
            <ContextSelector
              key={ingestionKey} // Force re-render and refetch when a new URL is ingested
              selectedContext={selectedContext}
              onContextChange={setSelectedContext}
            />
          </div>

          <div className="lg:col-span-3">
            <Chat selectedContext={selectedContext} />
          </div>
        </main>

      </div>
      <Toaster />
    </div>
  )
}

export default App
