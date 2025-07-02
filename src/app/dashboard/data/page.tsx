"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { Upload, File, Trash2, Eye, Plus, LinkIcon, Type, Clock } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { useAppStore } from "@/lib/store"
import type { DataSource } from "@/lib/types"
import { EnhancedUploadZone } from "@/components/ui/enhanced-upload-zone"
import { cn } from "@/lib/utils"
import { AnimatedCard } from "@/components/ui/animated-card"
import { GradientButton } from "@/components/ui/gradient-button"

const fileTypeIcons = {
  pdf: "📄",
  csv: "📊",
  xlsx: "📈",
  docx: "📝",
  json: "🔧",
  text: "📄",
  url: "🔗",
}

const statusColors = {
  processing: "bg-yellow-100 text-yellow-800",
  ready: "bg-green-100 text-green-800",
  error: "bg-red-100 text-red-800",
}

export default function DataSourcesPage() {
  const { dataSources, setDataSources } = useAppStore()
  const [dragActive, setDragActive] = useState(false)
  const [manualText, setManualText] = useState("")
  const [urlInput, setUrlInput] = useState("")
  const [qaQuestion, setQaQuestion] = useState("")
  const [qaAnswer, setQaAnswer] = useState("")

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files)
    }
  }, [])

  const handleFiles = (files: FileList) => {
    Array.from(files).forEach((file) => {
      const newDataSource: DataSource = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        name: file.name,
        type: getFileType(file.name),
        size: file.size,
        status: "processing",
        uploadedAt: new Date().toISOString(),
        companyId: "1",
      }

      setDataSources([...dataSources, newDataSource])

      // Simulate processing
      setTimeout(() => {
        setDataSources((prev) => prev.map((ds) => (ds.id === newDataSource.id ? { ...ds, status: "ready" } : ds)))
      }, 2000)
    })
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
        return "text"
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const handleDeleteDataSource = (id: string) => {
    setDataSources(dataSources.filter((ds) => ds.id !== id))
  }

  const handleManualTextSubmit = () => {
    if (!manualText.trim()) return

    const newDataSource: DataSource = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      name: `Manual Text - ${new Date().toLocaleDateString()}`,
      type: "text",
      size: new Blob([manualText]).size,
      status: "ready",
      uploadedAt: new Date().toISOString(),
      companyId: "1",
    }

    setDataSources([...dataSources, newDataSource])
    setManualText("")
  }

  const handleUrlSubmit = () => {
    if (!urlInput.trim()) return

    const newDataSource: DataSource = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      name: `URL: ${urlInput}`,
      type: "url",
      size: 0,
      status: "processing",
      uploadedAt: new Date().toISOString(),
      companyId: "1",
    }

    setDataSources([...dataSources, newDataSource])
    setUrlInput("")

    // Simulate processing
    setTimeout(() => {
      setDataSources((prev) => prev.map((ds) => (ds.id === newDataSource.id ? { ...ds, status: "ready" } : ds)))
    }, 3000)
  }

  const handleQaSubmit = () => {
    if (!qaQuestion.trim() || !qaAnswer.trim()) return

    const newDataSource: DataSource = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      name: `Q&A: ${qaQuestion.substring(0, 50)}...`,
      type: "text",
      size: new Blob([`Q: ${qaQuestion}\nA: ${qaAnswer}`]).size,
      status: "ready",
      uploadedAt: new Date().toISOString(),
      companyId: "1",
    }

    setDataSources([...dataSources, newDataSource])
    setQaQuestion("")
    setQaAnswer("")
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
          <TabsTrigger value="text">Manual Text</TabsTrigger>
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
              <EnhancedUploadZone onFilesSelected={handleFiles} />
            </div>
          </AnimatedCard>
        </TabsContent>

        <TabsContent value="text" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Manual Text Input</CardTitle>
              <CardDescription>Add text content directly to your knowledge base</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="manual-text">Text Content</Label>
                <Textarea
                  id="manual-text"
                  placeholder="Enter your text content here..."
                  value={manualText}
                  onChange={(e) => setManualText(e.target.value)}
                  rows={10}
                />
              </div>
              <Button onClick={handleManualTextSubmit} disabled={!manualText.trim()}>
                <Type className="mr-2 h-4 w-4" />
                Add Text Content
              </Button>
            </CardContent>
          </Card>
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
              <Button onClick={handleUrlSubmit} disabled={!urlInput.trim()}>
                <LinkIcon className="mr-2 h-4 w-4" />
                Scrape URL
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
              <Button onClick={handleQaSubmit} disabled={!qaQuestion.trim() || !qaAnswer.trim()}>
                <Plus className="mr-2 h-4 w-4" />
                Add Q&A Pair
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Your Data Sources</CardTitle>
          <CardDescription>Manage your uploaded content and knowledge base</CardDescription>
        </CardHeader>
        <CardContent>
          {dataSources.length === 0 ? (
            <div className="text-center py-12">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl" />
                <div className="relative p-6 bg-primary/10 rounded-full inline-flex">
                  <File className="h-16 w-16 text-primary" />
                </div>
              </div>
              <h3 className="text-2xl font-semibold mb-2">No data sources yet</h3>
              <p className="text-muted-foreground mb-6">Upload your first file to get started with your AI chatbot</p>
              <GradientButton>
                <Upload className="mr-2 h-4 w-4" />
                Upload Your First File
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
