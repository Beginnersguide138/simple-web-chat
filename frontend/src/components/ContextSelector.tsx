import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, Database, CheckCircle2, Globe2 } from "lucide-react"

interface ContextSelectorProps {
  selectedContext: string | null;
  onContextChange: (context: string | null) => void;
}

export function ContextSelector({ selectedContext, onContextChange }: ContextSelectorProps) {
  const [contexts, setContexts] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchContexts()
  }, [])

  const fetchContexts = async () => {
    try {
      const response = await fetch("/api/v1/contexts")
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.detail || "Failed to fetch contexts")
      }
      
      setContexts(data.contexts || [])
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to load contexts: ${errorMessage}`,
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="bg-transparent border-0">
      <CardHeader className="bg-gradient-to-r from-blue-600/20 to-cyan-600/20 backdrop-blur-sm rounded-t-2xl animate-fade-in animate-slide-in-right">
        <div className="flex items-center gap-2">
          <Database className="h-6 w-6 text-blue-300" />
          <CardTitle className="text-xl text-white">2. Select Context</CardTitle>
        </div>
        <CardDescription className="text-gray-300">
          Choose a website to use as context for your questions.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6 bg-gradient-to-b from-blue-900/10 to-transparent rounded-b-2xl">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
          </div>
        ) : contexts.length === 0 ? (
          <div className="text-center py-8">
            <div className="p-4 bg-gradient-to-br from-blue-600/20 to-cyan-600/20 rounded-2xl backdrop-blur-sm inline-block">
              <Globe2 className="h-12 w-12 text-blue-300 mx-auto mb-3" />
              <p className="text-gray-300 text-sm">No websites ingested yet.</p>
              <p className="text-gray-400 text-xs mt-1">Process a URL first to get started.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <Select value={selectedContext || undefined} onValueChange={onContextChange}>
              <SelectTrigger className="bg-white/10 border-transparent text-white py-2 px-4 rounded-xl shadow-inner hover:shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400">
                <SelectValue placeholder="Select a website..." />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border-gray-700">
                {contexts.map((context) => (
                  <SelectItem
                    key={context}
                    value={context}
                    className="text-white hover:bg-purple-600/20 focus:bg-purple-600/30 transition-all duration-150"
                  >
                    <div className="flex items-center gap-2">
                      <Globe2 className="h-4 w-4 text-blue-400" />
                      <span className="truncate">{context}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedContext && (
              <div className="flex items-center gap-2 p-3 bg-green-500/10 rounded-lg border border-green-500/20 animate-fade-in">
                <CheckCircle2 className="h-5 w-5 text-green-400" />
                <p className="text-sm text-green-300">Context selected and ready for chat!</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
