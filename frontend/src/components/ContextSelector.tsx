import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, Database, CheckCircle2, Globe2, Trash2, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ContextSelectorProps {
  selectedContext: string | null;
  onContextChange: (context: string | null) => void;
}

export function ContextSelector({ selectedContext, onContextChange }: ContextSelectorProps) {
  const [contexts, setContexts] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [contextToDelete, setContextToDelete] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchContexts()
  }, [])

  const fetchContexts = async () => {
    try {
      const response = await fetch("/api/v1/contexts")
      
      if (!response.ok) {
        throw new Error(`Backend unavailable (${response.status})`)
      }

      const contentType = response.headers.get("content-type")
      if (!contentType?.includes("application/json")) {
        throw new Error("Backend returned non-JSON response")
      }

      const data = await response.json()
      setContexts(data || [])
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.warn(`Context fetch failed: ${errorMessage}`)
      // Don't show toast for backend connectivity issues to avoid spamming user
      setContexts([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteContext = async (contextUrl: string) => {
    setIsDeleting(true)
    try {
      const encodedUrl = encodeURIComponent(contextUrl)
      const response = await fetch(`/api/v1/contexts/${encodedUrl}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error(`Failed to delete context (${response.status})`)
      }

      // Update contexts list and clear selection if deleted context was selected
      setContexts(prev => prev.filter(ctx => ctx !== contextUrl))
      if (selectedContext === contextUrl) {
        onContextChange(null)
      }

      toast({
        title: "Context deleted",
        description: `Successfully deleted: ${contextUrl}`,
        variant: "default"
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      toast({
        title: "Failed to delete context",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setIsDeleting(false)
      setShowDeleteConfirm(false)
      setContextToDelete(null)
    }
  }

  const confirmDelete = (contextUrl: string) => {
    setContextToDelete(contextUrl)
    setShowDeleteConfirm(true)
  }

  const cancelDelete = () => {
    setShowDeleteConfirm(false)
    setContextToDelete(null)
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
            
            {/* Context Management Section */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-300">Manage Contexts</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {contexts.map((context) => (
                  <div key={context} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10 hover:border-white/20 transition-all duration-200">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <Globe2 className="h-4 w-4 text-blue-400 shrink-0" />
                      <span className="text-sm text-gray-300 truncate" title={context}>
                        {context}
                      </span>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => confirmDelete(context)}
                      disabled={isDeleting}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10 p-2 h-8 w-8 shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Delete Confirmation Dialog */}
            {showDeleteConfirm && contextToDelete && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
                <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 max-w-md w-full mx-4 animate-slide-in">
                  <div className="flex items-center gap-3 mb-4">
                    <AlertTriangle className="h-6 w-6 text-orange-400" />
                    <h3 className="text-lg font-semibold text-white">Delete Context</h3>
                  </div>
                  <p className="text-gray-300 mb-4">
                    Are you sure you want to delete this context? This action cannot be undone.
                  </p>
                  <div className="bg-gray-800/50 p-3 rounded-lg mb-6">
                    <p className="text-sm text-blue-300 break-all">{contextToDelete}</p>
                  </div>
                  <div className="flex gap-3 justify-end">
                    <Button
                      variant="ghost"
                      onClick={cancelDelete}
                      disabled={isDeleting}
                      className="text-gray-300 hover:text-white"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={() => handleDeleteContext(contextToDelete)}
                      disabled={isDeleting}
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      {isDeleting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Deleting...
                        </>
                      ) : (
                        <>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
