import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, Globe, CheckCircle, AlertCircle } from "lucide-react"

interface IngestionFormProps {
  onIngestionSuccess: () => void;
}

export function IngestionForm({ onIngestionSuccess }: IngestionFormProps) {
  const [url, setUrl] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!url) {
      toast({
        variant: "destructive",
        title: "URL is required",
        description: "Please enter a URL to process.",
      })
      return
    }
    setIsLoading(true)
    try {
      const response = await fetch("/api/v1/process-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.detail || "An unknown error occurred")
      }

      toast({
        title: "Success!",
        description: `Successfully processed and stored content from ${data.url}.`,
      })
      setUrl("")
      onIngestionSuccess() // Notify parent component
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to process URL: ${errorMessage}`,
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="bg-transparent border-0">
      <CardHeader className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 backdrop-blur-sm rounded-t-2xl animate-slide-in-left animate-fade-in">
        <div className="flex items-center gap-2">
          <Globe className="h-6 w-6 text-purple-300 animate-pulse" />
          <CardTitle className="text-xl text-white">1. Ingest a Website</CardTitle>
        </div>
        <CardDescription className="text-gray-300">
          Enter a URL to scrape and add its content to the knowledge base.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6 bg-gradient-to-b from-purple-900/10 to-transparent rounded-b-2xl">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="relative">
            <Input
              type="url"
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={isLoading}
              className="bg-white/10 border-transparent placeholder-gray-400 text-white py-2 px-4 rounded-xl shadow-inner hover:shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-pink-300"
            />
            {url && !isLoading && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                {url.startsWith("https://") || url.startsWith("http://") ? (
                  <CheckCircle className="h-5 w-5 text-green-400" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-yellow-400" />
                )}
              </div>
            )}
          </div>
          <Button
            type="submit"
            disabled={isLoading}
            className="bg-gradient-to-br from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-2 px-4 rounded-xl shadow-lg transform hover:scale-105 transition-transform duration-200 disabled:opacity-50"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? "Processing..." : "Process URL"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
