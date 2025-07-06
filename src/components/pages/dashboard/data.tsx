"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Upload, File, Trash2, Eye, Plus, LinkIcon, Type, Clock, AlertCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import type { DataSource } from "@/lib/types"
import { EnhancedUploadZone } from "@/components/ui/enhanced-upload-zone"
import { cn } from "@/lib/utils"
import { AnimatedCard } from "@/components/ui/animated-card"
import { GradientButton } from "@/components/ui/gradient-button"
import { useDataSources, useFileUpload, useDeleteDataSource, useUrlScraping, useQaPairs } from "@/hooks/use-data-sources"
import { useToast } from "@/hooks/use-toast"

const fileTypeIcons: Record<DataSource["type"], string> = {
  pdf: "📄",
  csv: "📊",
  xlsx: "📈",
  txt: "📄",
  docx: "📝",
  json: "🔧",
}

const statusColors: Record<DataSource["status"], string> = {
  processing: "bg-yellow-100 text-yellow-800",
  ready: "bg-green-100 text-green-800",
  error: "bg-red-100 text-red-800",
}

export default function DataSourcesClientPage() {
  const [urlInput, setUrlInput] = useState("")
  const [qaQuestion, setQaQuestion] = useState("")
  const [qaAnswer, setQaAnswer] = useState("")
  const [resetUploadZone, setResetUploadZone] = useState(0)
  const [isScrapingUrl, setIsScrapingUrl] = useState(false)
  const [isCreatingQa, setIsCreatingQa] = useState(false)
  
  // Use real hooks for data management
  const { dataSources, isLoading, error, mutate } = useDataSources()
  const { uploadFile, isUploading } = useFileUpload()
  const { deleteDataSource } = useDeleteDataSource()
  const { scrapeUrl } = useUrlScraping()
  const { createQaPair } = useQaPairs()
  const { toast } = useToast()
  const [isRefreshing, setIsRefreshing] = useState(false)
  
  // Force refresh data after uploads
  useEffect(() => {
    if (!isUploading && dataSources) {
      mutate()
    }
  }, [isUploading, dataSources, mutate])

  const handleFiles = async (files: FileList) => {
    const fileArray = Array.from(files)
    
    for (const file of fileArray) {
      try {
        const result = await uploadFile(file)
        
        if (result.success) {
          toast({
            title: "File uploaded successfully",
            description: `${file.name} has been uploaded and is being processed.`,
          })
          // Force refresh after a short delay to ensure data is synced
          setTimeout(() => mutate(), 1000)
        } else {
          toast({
            title: "Upload failed",
            description: result.error || "Failed to upload file",
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error('Upload error:', error)
        toast({
          title: "Upload failed",
          description: "An unexpected error occurred during upload",
          variant: "destructive",
        })
      }
    }
    
    // Reset upload zone state after all files are processed (success or failure)
    setResetUploadZone(prev => prev + 1)
  }

  const getFileType = (filename: string): DataSource["type"] => {
    const extension = filename.split(".").pop()?.toLowerCase()
    switch (extension) {
      case "pdf":
        return "pdf"
      case "csv":
        return "csv"
      case "xlsx":
      case "xls":
        return "xlsx"
      case "docx":
      case "doc":
        return "docx"
      case "json":
        return "json"
      default:
        return "txt"
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const handleDeleteDataSource = async (id: string) => {
    try {
      const result = await deleteDataSource(id)
      
      if (result.success) {
        toast({
          title: "Data source deleted",
          description: "The data source has been successfully deleted.",
        })
      } else {
        toast({
          title: "Delete failed",
          description: result.error || "Failed to delete data source",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Delete error:', error)
      toast({
        title: "Delete failed",
        description: "An unexpected error occurred while deleting",
        variant: "destructive",
      })
    }
  }

  const handleUrlSubmit = async () => {
    if (!urlInput.trim() || isScrapingUrl) return
    
    try {
      setIsScrapingUrl(true)
      const result = await scrapeUrl(urlInput.trim())
      
      if (result.success) {
        setUrlInput("")
      }
    } catch (error) {
      console.error('URL scraping error:', error)
    } finally {
      setIsScrapingUrl(false)
    }
  }

  const handleQaSubmit = async () => {
    if (!qaQuestion.trim() || !qaAnswer.trim() || isCreatingQa) return
    
    try {
      setIsCreatingQa(true)
      const result = await createQaPair(qaQuestion.trim(), qaAnswer.trim())
      
      if (result.success) {
        setQaQuestion("")
        setQaAnswer("")
      }
    } catch (error) {
      console.error('Q&A pair creation error:', error)
    } finally {
      setIsCreatingQa(false)
    }
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Data Sources</h2>
          <p className="text-muted-foreground">Upload and manage your knowledge base content</p>
        </div>
      </div>
      <Tabs defaultValue="upload" className="space-y-4">
        <TabsList>
          <TabsTrigger value="upload">File Upload</TabsTrigger>
          <TabsTrigger value="url">URL Scraping</TabsTrigger>
          <TabsTrigger value="qa">Q&A Pairs</TabsTrigger>
        </TabsList>
        <TabsContent value="upload" className="space-y-4">
          <AnimatedCard className="p-6" glow>
            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-semibold mb-2">Upload Files</h3>
                <p className="text-muted-foreground">
                  Add documents, spreadsheets, and other files to your knowledge base
                </p>
              </div>
              <EnhancedUploadZone 
                key={resetUploadZone} // Force re-render to reset state
                onFilesSelected={handleFiles} 
              />
            </div>
          </AnimatedCard>
        </TabsContent>
        <TabsContent value="url" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>URL Scraping</CardTitle>
              <CardDescription>Extract content from web pages</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="url-input">Website URL</Label>
                <Input
                  id="url-input"
                  type="url"
                  placeholder="https://example.com"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                />
              </div>
              <Button onClick={handleUrlSubmit} disabled={!urlInput.trim() || isScrapingUrl}>
                <LinkIcon className="mr-2 h-4 w-4" />
                {isScrapingUrl ? "Scraping..." : "Scrape URL"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="qa" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Q&A Pairs</CardTitle>
              <CardDescription>Create question and answer pairs for your chatbot</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="qa-question">Question</Label>
                <Input
                  id="qa-question"
                  placeholder="What is your return policy?"
                  value={qaQuestion}
                  onChange={(e) => setQaQuestion(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="qa-answer">Answer</Label>
                <Textarea
                  id="qa-answer"
                  placeholder="Our return policy allows..."
                  value={qaAnswer}
                  onChange={(e) => setQaAnswer(e.target.value)}
                  rows={4}
                />
              </div>
              <Button onClick={handleQaSubmit} disabled={!qaQuestion.trim() || !qaAnswer.trim() || isCreatingQa}>
                <Plus className="mr-2 h-4 w-4" />
                {isCreatingQa ? "Creating..." : "Add Q&A Pair"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Your Data Sources</CardTitle>
              <CardDescription>Manage your uploaded content and knowledge base</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                setIsRefreshing(true)
                try {
                  // Force refresh by passing undefined to clear cache
                  await mutate(undefined, { revalidate: true })
                  toast({
                    title: "Refreshed",
                    description: "Data sources have been refreshed successfully.",
                  })
                } catch (error) {
                  console.error('Refresh error:', error)
                  toast({
                    title: "Refresh failed",
                    description: "Failed to refresh data sources. Please try again.",
                    variant: "destructive",
                  })
                } finally {
                  setIsRefreshing(false)
                }
              }}
              disabled={isLoading || isRefreshing}
              className="ml-4 flex items-center"
              title="Refresh data sources"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`h-4 w-4 mr-2 ${isLoading || isRefreshing ? 'animate-spin' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 4v5h.582m15.356-2A9 9 0 11 6.343 6.343M20 20v-5h-.581"
                />
              </svg>
              {isRefreshing ? "Refreshing..." : "Refresh"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12">
              <div className="text-muted-foreground">Loading data sources...</div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="relative mb-6">
                <div className="relative p-6 bg-destructive/10 rounded-full inline-flex">
                  <AlertCircle className="h-16 w-16 text-destructive" />
                </div>
              </div>
              <h3 className="text-2xl font-semibold mb-2 text-destructive">Error loading data sources</h3>
              <p className="text-muted-foreground mb-6">{error}</p>
              <Button onClick={() => mutate()}>Try Again</Button>
            </div>
          ) : !dataSources || dataSources.length === 0 ? (
            <div className="text-center py-12">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl" />
                <div className="relative p-6 bg-primary/10 rounded-full inline-flex">
                  <File className="h-16 w-16 text-primary" />
                </div>
              </div>
              <h3 className="text-2xl font-semibold mb-2">No data sources yet</h3>
              <p className="text-muted-foreground mb-6">Upload your first file to get started with your AI chatbot</p>
              <GradientButton disabled={isUploading}>
                <Upload className="mr-2 h-4 w-4" />
                {isUploading ? "Uploading..." : "Upload Your First File"}
              </GradientButton>
            </div>
          ) : (
            <div className="space-y-4">
              {dataSources.map((dataSource, index) => (
                <div
                  key={dataSource.id}
                  className="flex items-center justify-between p-6 border rounded-xl hover:bg-card/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1 animate-in slide-in-from-bottom-4 duration-700 group"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-center space-x-4">
                    <div className="text-3xl p-3 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-colors duration-300">
                      {fileTypeIcons[dataSource.type]}
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-semibold text-lg">{dataSource.name}</h3>
                      <div className="flex items-center space-x-3 text-sm text-muted-foreground">
                        <span className="flex items-center space-x-1">
                          <File className="h-3 w-3" />
                          <span>{formatFileSize(dataSource.size)}</span>
                        </span>
                        <span>•</span>
                        <span className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>{new Date(dataSource.uploadedAt).toLocaleDateString()}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Badge className={cn("transition-all duration-300", statusColors[dataSource.status])}>
                      {dataSource.status}
                    </Badge>
                    <div className="flex items-center space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="hover:bg-primary/10 hover:text-primary transition-all duration-300 hover:scale-110"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteDataSource(dataSource.id)}
                        className="hover:bg-destructive/10 hover:text-destructive transition-all duration-300 hover:scale-110"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
