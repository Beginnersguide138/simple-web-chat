import { useState, useRef, useEffect } from "react"
import { createPortal } from "react-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, Send, Bot, User, Link, MessageSquare, Maximize2, Minimize2 } from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

interface Message {
  role: "user" | "bot"
  content: string
  sources?: { url: string; text: string }[]
}

interface ChatProps {
  selectedContext: string | null;
  selectedModel: string | null;
}

export function Chat({ selectedContext, selectedModel }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [streamingContent, setStreamingContent] = useState("")
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
    setStreamingContent("")

    // Add a placeholder bot message for streaming
    const botMessage: Message = { role: "bot", content: "", sources: [] }
    setMessages((prev) => [...prev, botMessage])

    try {
      const response = await fetch("/api/v1/chat-stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: userMessage.content,
          context_url: selectedContext,
          model: selectedModel || "gpt-oss:20b",  // Use selected model or default
          messages: messages  // Send conversation history
        }),
      })

      if (!response.ok) {
        throw new Error(`Backend unavailable (${response.status})`)
      }

      if (!response.body) {
        throw new Error("No response body")
      }

      const reader = response.body.getReader()
      let accumulatedContent = ""
      let sources: { url: string; text: string }[] = []

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = new TextDecoder().decode(value)
        const lines = chunk.split('\n')
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              
              if (data.type === 'sources') {
                sources = data.sources
              } else if (data.type === 'content') {
                accumulatedContent += data.content
                setStreamingContent(accumulatedContent)
                
                // Update the last message with streaming content
                setMessages((prev) => {
                  const newMessages = [...prev]
                  if (newMessages.length > 0 && newMessages[newMessages.length - 1].role === 'bot') {
                    newMessages[newMessages.length - 1] = {
                      ...newMessages[newMessages.length - 1],
                      content: accumulatedContent,
                      sources: sources
                    }
                  }
                  return newMessages
                })
              } else if (data.type === 'error') {
                throw new Error(data.content)
              } else if (data.type === 'end') {
                break
              }
            } catch (parseError) {
              console.warn('Failed to parse SSE data:', line)
            }
          }
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to get chat response: ${errorMessage}`,
      })
      
      // Remove the placeholder bot message on error
      setMessages((prev) => prev.slice(0, -1))
    } finally {
      setIsLoading(false)
      setStreamingContent("")
    }
  }

  // Create fullscreen content for React Portal
  const fullscreenContent = (
    <div className="fixed inset-0 z-[99999] bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900" style={{ zIndex: 99999 }}>
      <Card className="flex flex-col bg-transparent border-0 h-screen rounded-none w-screen">
        <CardHeader className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 backdrop-blur-sm animate-fade-in rounded-none">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-6 w-6 text-purple-300" />
              <CardTitle className="text-2xl text-white">Chat Assistant - Full Screen</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsFullscreen(false)}
              className="text-purple-300 hover:text-white hover:bg-purple-600/20 rounded-xl"
            >
              <Minimize2 className="h-5 w-5" />
            </Button>
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
                  {msg.role === 'bot' ? (
                    <div className="prose prose-invert prose-sm max-w-none leading-relaxed text-white">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
                          h1: ({ children }) => <h1 className="text-xl font-bold mb-2 text-purple-200">{children}</h1>,
                          h2: ({ children }) => <h2 className="text-lg font-semibold mb-2 text-purple-200">{children}</h2>,
                          h3: ({ children }) => <h3 className="text-base font-medium mb-2 text-purple-200">{children}</h3>,
                          ul: ({ children }) => <ul className="list-disc list-inside mb-3 space-y-1">{children}</ul>,
                          ol: ({ children }) => <ol className="list-decimal list-inside mb-3 space-y-1">{children}</ol>,
                          li: ({ children }) => <li className="text-white">{children}</li>,
                          table: ({ children }) => <table className="border-collapse table-auto w-full text-sm mb-4 border border-gray-600">{children}</table>,
                          thead: ({ children }) => <thead className="bg-gray-700">{children}</thead>,
                          tbody: ({ children }) => <tbody className="bg-gray-800/50">{children}</tbody>,
                          tr: ({ children }) => <tr className="border-b border-gray-600">{children}</tr>,
                          th: ({ children }) => <th className="border border-gray-600 px-4 py-2 text-left font-semibold text-purple-200">{children}</th>,
                          td: ({ children }) => <td className="border border-gray-600 px-4 py-2 text-white">{children}</td>,
                          code: ({ children, className }) => {
                            const isInline = !className;
                            return isInline ?
                              <code className="bg-purple-600/30 text-purple-200 px-1 rounded text-sm">{children}</code> :
                              <code className="block bg-gray-800 text-gray-200 p-3 rounded-lg mb-3 text-sm overflow-x-auto">{children}</code>
                          },
                          pre: ({ children }) => <pre className="bg-gray-800 p-3 rounded-lg mb-3 overflow-x-auto">{children}</pre>,
                          strong: ({ children }) => <strong className="font-semibold text-purple-200">{children}</strong>,
                          em: ({ children }) => <em className="italic text-blue-200">{children}</em>,
                          blockquote: ({ children }) => <blockquote className="border-l-4 border-purple-400 pl-4 mb-3 text-gray-300 italic">{children}</blockquote>,
                          a: ({ children, href }) => <a href={href} className="text-blue-300 hover:text-blue-200 underline" target="_blank" rel="noopener noreferrer">{children}</a>
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  )}
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
        <div className="p-4 border-t border-white/10 bg-gradient-to-r from-purple-900/20 to-blue-900/20 backdrop-blur-sm rounded-none">
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
    </div>
  )

  // Create React Portal for fullscreen mode
  const fullscreenPortal = isFullscreen ? createPortal(fullscreenContent, document.body) : null

  // Normal mode render with fullscreen portal
  return (
    <>
      {fullscreenPortal}
      <Card className="flex flex-col bg-transparent border-0 h-[70vh]">
      <CardHeader className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 backdrop-blur-sm animate-fade-in rounded-t-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-purple-300" />
            <CardTitle className="text-2xl text-white">Chat Assistant</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsFullscreen(true)}
            className="text-purple-300 hover:text-white hover:bg-purple-600/20 rounded-xl"
          >
            <Maximize2 className="h-5 w-5" />
          </Button>
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
                  {msg.role === 'bot' ? (
                    <div className="prose prose-invert prose-sm max-w-none leading-relaxed text-white">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
                          h1: ({ children }) => <h1 className="text-xl font-bold mb-2 text-purple-200">{children}</h1>,
                          h2: ({ children }) => <h2 className="text-lg font-semibold mb-2 text-purple-200">{children}</h2>,
                          h3: ({ children }) => <h3 className="text-base font-medium mb-2 text-purple-200">{children}</h3>,
                          ul: ({ children }) => <ul className="list-disc list-inside mb-3 space-y-1">{children}</ul>,
                          ol: ({ children }) => <ol className="list-decimal list-inside mb-3 space-y-1">{children}</ol>,
                          li: ({ children }) => <li className="text-white">{children}</li>,
                          table: ({ children }) => <table className="border-collapse table-auto w-full text-sm mb-4 border border-gray-600">{children}</table>,
                          thead: ({ children }) => <thead className="bg-gray-700">{children}</thead>,
                          tbody: ({ children }) => <tbody className="bg-gray-800/50">{children}</tbody>,
                          tr: ({ children }) => <tr className="border-b border-gray-600">{children}</tr>,
                          th: ({ children }) => <th className="border border-gray-600 px-4 py-2 text-left font-semibold text-purple-200">{children}</th>,
                          td: ({ children }) => <td className="border border-gray-600 px-4 py-2 text-white">{children}</td>,
                          code: ({ children, className }) => {
                            const isInline = !className;
                            return isInline ?
                              <code className="bg-purple-600/30 text-purple-200 px-1 rounded text-sm">{children}</code> :
                              <code className="block bg-gray-800 text-gray-200 p-3 rounded-lg mb-3 text-sm overflow-x-auto">{children}</code>
                          },
                          pre: ({ children }) => <pre className="bg-gray-800 p-3 rounded-lg mb-3 overflow-x-auto">{children}</pre>,
                          strong: ({ children }) => <strong className="font-semibold text-purple-200">{children}</strong>,
                          em: ({ children }) => <em className="italic text-blue-200">{children}</em>,
                          blockquote: ({ children }) => <blockquote className="border-l-4 border-purple-400 pl-4 mb-3 text-gray-300 italic">{children}</blockquote>,
                          a: ({ children, href }) => <a href={href} className="text-blue-300 hover:text-blue-200 underline" target="_blank" rel="noopener noreferrer">{children}</a>
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  )}
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
    </>
  )
}
