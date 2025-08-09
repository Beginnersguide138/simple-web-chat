import { useEffect, useState } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"

interface ContextSelectorProps {
  selectedContext: string | null
  onContextChange: (context: string) => void
}

export function ContextSelector({ selectedContext, onContextChange }: ContextSelectorProps) {
  const [contexts, setContexts] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    async function fetchContexts() {
      try {
        setIsLoading(true)
        const response = await fetch("/api/v1/contexts")
        if (!response.ok) {
          throw new Error("Failed to fetch contexts")
        }
        const data: string[] = await response.json()
        setContexts(data)
        // Automatically select the first context if none is selected
        if (!selectedContext && data.length > 0) {
          onContextChange(data[0])
        }
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not load the list of ingested websites.",
        })
      } finally {
        setIsLoading(false)
      }
    }
    fetchContexts()
  }, []) // The dependency array is empty, so it runs once on mount.
         // A more advanced version might refetch periodically or on a trigger.

  return (
    <div className="mb-4">
      <label htmlFor="context-selector" className="block text-sm font-medium text-muted-foreground mb-1">
        Select a context to chat with:
      </label>
      <Select
        value={selectedContext ?? ""}
        onValueChange={onContextChange}
        disabled={isLoading || contexts.length === 0}
      >
        <SelectTrigger id="context-selector">
          <SelectValue placeholder={isLoading ? "Loading contexts..." : "Select a website"} />
        </SelectTrigger>
        <SelectContent>
          {contexts.length > 0 ? (
            contexts.map((context) => (
              <SelectItem key={context} value={context}>
                {context}
              </SelectItem>
            ))
          ) : (
            <SelectItem value="none" disabled>
              No websites ingested yet.
            </SelectItem>
          )}
        </SelectContent>
      </Select>
    </div>
  )
}
