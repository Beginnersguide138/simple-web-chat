import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"

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
    <Card>
      <CardHeader>
        <CardTitle>1. Ingest a Website</CardTitle>
        <CardDescription>Enter a URL to scrape and add its content to the knowledge base.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            type="url"
            placeholder="https://example.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={isLoading}
          />
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? "Processing..." : "Process URL"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
