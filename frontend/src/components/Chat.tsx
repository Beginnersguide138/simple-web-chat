import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, Send } from "lucide-react"

interface Message {
  role: "user" | "bot"
  content: string
  sources?: { url: string; text: string }[]
}

interface ChatProps {
  selectedContext: string | null;
}

export function Chat({ selectedContext }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(scrollToBottom, [messages]);

  // Clear messages when the context changes
  useEffect(() => {
    setMessages([]);
  }, [selectedContext]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || !selectedContext) {
      if (!selectedContext) {
        toast({
          variant: "destructive",
          title: "No context selected",
          description: "Please select a website to chat with first.",
        })
      }
      return
    }

    const userMessage: Message = { role: "user", content: input }
    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      const response = await fetch("/api/v1/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: input, context_url: selectedContext }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.detail || "An unknown error occurred")
      }

      const botMessage: Message = {
        role: "bot",
        content: data.answer,
        sources: data.sources,
      }
      setMessages((prev) => [...prev, botMessage])
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to get chat response: ${errorMessage}`,
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="flex flex-col h-[70vh]">
      <CardHeader>
        <CardTitle>2. Chat</CardTitle>
        <CardDescription>Ask questions about the selected website.</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow overflow-y-auto p-4 space-y-4">
        {messages.map((msg, index) => (
          <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`p-3 rounded-lg max-w-md ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
              <p className="whitespace-pre-wrap">{msg.content}</p>
              {msg.role === 'bot' && msg.sources && msg.sources.length > 0 && (
                <div className="mt-2 text-xs border-t border-muted-foreground/20 pt-2">
                  <p className="font-bold mb-1">Sources:</p>
                  {msg.sources.map((source, i) => (
                    <a key={i} href={source.url} target="_blank" rel="noopener noreferrer" className="block truncate text-blue-400 hover:underline">
                      {source.url}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="p-3 rounded-lg bg-muted">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          </div>
        )}
        {!selectedContext && messages.length === 0 && (
            <div className="text-center text-muted-foreground">
                Please ingest a website and select a context to begin chatting.
            </div>
        )}
        <div ref={messagesEndRef} />
      </CardContent>
      <div className="p-4 border-t">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={selectedContext ? "Ask a question..." : "Select a context first"}
            disabled={isLoading || !selectedContext}
          />
          <Button type="submit" disabled={isLoading || !input.trim() || !selectedContext} size="icon">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </Card>
  )
}
