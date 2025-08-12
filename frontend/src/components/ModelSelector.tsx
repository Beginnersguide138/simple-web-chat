import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { Brain, Cpu, Cloud, Loader2 } from "lucide-react"

interface ModelInfo {
  name: string
  display_name: string
  provider: string
  requires_api_key: boolean
  context_length: number
}

interface ModelSelectorProps {
  selectedModel: string | null
  onModelChange: (model: string) => void
}

export function ModelSelector({ selectedModel, onModelChange }: ModelSelectorProps) {
  const [models, setModels] = useState<Record<string, ModelInfo>>({})
  const [defaultModel, setDefaultModel] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchModels()
  }, [])

  const fetchModels = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/v1/models")
      
      if (!response.ok) {
        throw new Error(`Failed to fetch models: ${response.status}`)
      }

      const data = await response.json()
      setModels(data.models || {})
      setDefaultModel(data.default_model || "")
      
      // Set default model if no model is currently selected
      if (!selectedModel && data.default_model) {
        onModelChange(data.default_model)
      }
    } catch (error) {
      console.error("Error fetching models:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load available models",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case "ollama":
        return <Cpu className="h-4 w-4" />
      case "openai":
      case "anthropic":
      case "google":
        return <Cloud className="h-4 w-4" />
      default:
        return <Brain className="h-4 w-4" />
    }
  }

  const getProviderColor = (provider: string) => {
    switch (provider) {
      case "ollama":
        return "text-green-400"
      case "openai":
        return "text-blue-400"
      case "anthropic":
        return "text-orange-400"
      case "google":
        return "text-yellow-400"
      default:
        return "text-gray-400"
    }
  }

  const groupedModels = Object.entries(models).reduce((acc, [key, model]) => {
    const provider = model.provider
    if (!acc[provider]) {
      acc[provider] = []
    }
    acc[provider].push({ key, ...model })
    return acc
  }, {} as Record<string, Array<ModelInfo & { key: string }>>)

  const formatContextLength = (length: number) => {
    if (length >= 1000000) {
      return `${Math.round(length / 1000000)}M`
    } else if (length >= 1000) {
      return `${Math.round(length / 1000)}K`
    }
    return length.toString()
  }

  return (
    <Card className="bg-transparent border-white/20 hover:border-white/30 transition-colors">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-purple-300" />
          <CardTitle className="text-white">AI Model</CardTitle>
        </div>
        <CardDescription className="text-gray-300">
          Choose your preferred AI model for responses
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center gap-2 p-4">
            <Loader2 className="h-4 w-4 animate-spin text-purple-300" />
            <span className="text-gray-300">Loading models...</span>
          </div>
        ) : (
          <Select
            value={selectedModel || defaultModel}
            onValueChange={onModelChange}
          >
            <SelectTrigger className="bg-white/10 border-white/20 text-white hover:bg-white/15">
              <SelectValue placeholder="Select a model" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-600">
              {Object.entries(groupedModels).map(([provider, providerModels]) => (
                <div key={provider}>
                  <div className="px-2 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    <div className="flex items-center gap-1">
                      {getProviderIcon(provider)}
                      <span className={getProviderColor(provider)}>
                        {provider === "ollama" ? "Local (Ollama)" :
                         provider === "openai" ? "OpenAI" :
                         provider === "anthropic" ? "Anthropic" :
                         provider === "google" ? "Google" :
                         provider}
                      </span>
                    </div>
                  </div>
                  {providerModels.map(({ key, display_name, context_length, requires_api_key }) => (
                    <SelectItem
                      key={key}
                      value={key}
                      className="text-white hover:bg-gray-700 focus:bg-gray-700"
                    >
                      <div className="flex items-center justify-between w-full">
                        <span>{display_name}</span>
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          {requires_api_key && (
                            <span className="px-1 py-0.5 bg-yellow-600 text-yellow-100 rounded text-xs">
                              API Key
                            </span>
                          )}
                          <span>{formatContextLength(context_length)} ctx</span>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </div>
              ))}
            </SelectContent>
          </Select>
        )}
        
        {selectedModel && models[selectedModel] && (
          <div className="mt-3 p-3 bg-white/5 rounded-lg border border-white/10">
            <div className="text-sm text-gray-300">
              <div className="flex items-center gap-2 mb-1">
                {getProviderIcon(models[selectedModel].provider)}
                <span className="font-medium text-white">
                  {models[selectedModel].display_name}
                </span>
              </div>
              <div className="text-xs text-gray-400">
                Provider: {models[selectedModel].provider} • 
                Context: {formatContextLength(models[selectedModel].context_length)} tokens
                {models[selectedModel].requires_api_key && " • Requires API Key"}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}