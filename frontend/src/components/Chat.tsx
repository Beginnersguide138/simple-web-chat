import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, Send, Bot, User, Link, MessageSquare } from "lucide-react"

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
    <Card className="flex flex-col h-[70vh] bg-transparent border-0">
      <CardHeader className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 backdrop-blur-sm rounded-t-2xl animate-fade-in">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-6 w-6 text-purple-300" />
          <CardTitle className="text-2xl text-white">Chat Assistant</CardTitle>
        </div>
        <CardDescription className="text-gray-300">
          Ask questions about the selected website
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-purple-900/10 to-transparent">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
          >
            <div className={`flex gap-3 max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                msg.role === 'user' 
                  ? 'bg-gradient-to-br from-purple-500 to-pink-500' 
                  : 'bg-gradient-to-br from-blue-500 to-cyan-500'
              } shadow-lg`}>
                {msg.role === 'user' ? (
                  <User className="h-5 w-5 text-white" />
                ) : (
                  <Bot className="h-5 w-5 text-white" />
                )}
              </div>
              <div
                className={`p-4 rounded-2xl shadow-lg ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-br from-purple-600 to-pink-600 text-white'
                    : 'bg-white/10 backdrop-blur-sm text-white border border-white/20'
                } transition-all hover:shadow-xl`}
              >
                <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                {msg.role === 'bot' && msg.sources && msg.sources.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-white/20">
                    <p className="text-xs font-semibold mb-2 text-purple-200 flex items-center gap-1">
                      <Link className="h-3 w-3" />
                      Sources:
                    </p>
                    <div className="space-y-1">
                      {msg.sources.map((source, i) => (
                        <a
                          key={i}
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block text-xs text-blue-300 hover:text-blue-100 truncate transition-colors hover:underline"
                        >
                          {source.url}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start animate-fade-in">
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin text-purple-300" />
                  <span className="text-purple-200 text-sm">Thinking...</span>
                </div>
              </div>
            </div>
          </div>
        )}
        {!selectedContext && messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-4 animate-fade-in">
              <div className="p-6 bg-gradient-to-br from-purple-600/20 to-blue-600/20 rounded-3xl backdrop-blur-sm">
                <MessageSquare className="h-16 w-16 text-purple-300 mx-auto mb-4" />
                <p className="text-gray-300 text-lg">Please ingest a website and select a context</p>
                <p className="text-gray-400 text-sm mt-2">to begin your conversation</p>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </CardContent>
      <div className="p-4 border-t border-white/10 bg-gradient-to-r from-purple-900/20 to-blue-900/20 backdrop-blur-sm rounded-b-2xl">
        <form onSubmit={handleSubmit} className="flex gap-3">
          <Input
                       value={input}
                       onChange={(e) => setInput(e.target.value)}
                       placeholder={selectedContext ? "Ask me anything..." : "Select a context first"}
                       disabled={isLoading || !selectedContext}
                       className="bg-white/10 border-transparent placeholder-gray-400 text-white py-2 px-4 rounded-xl shadow-inner hover:shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-300"
          />
          <Button
                       type="submit"
                       disabled={isLoading || !input.trim() || !selectedContext}
                       size="icon"
                       className="bg-gradient-to-br from-pink-500 to-indigo-500 hover:from-pink-600 hover:to-indigo-600 text-white font-semibold py-2 px-4 rounded-xl shadow-lg transform hover:scale-105 transition-transform duration-200 disabled:opacity-50"
                     >
                       <Send className="h-4 w-4" />
                     </Button>
        </form>
      </div>
    </Card>
  )
}
