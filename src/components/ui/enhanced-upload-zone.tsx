"use client"

import type React from "react"

import { useState, useCallback, useRef } from "react"
import { Upload, FileText, ImageIcon, File, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { AnimatedCard } from "./animated-card"
import { GradientButton } from "./gradient-button"

interface UploadZoneProps {
  onFilesSelected: (files: FileList) => void
  onUploadComplete?: () => void
  acceptedTypes?: string
  maxSize?: number
  multiple?: boolean
  className?: string
}

export function EnhancedUploadZone({
  onFilesSelected,
  onUploadComplete,
  acceptedTypes = ".pdf,.csv,.xlsx,.xls,.docx,.doc,.json,.txt",
  maxSize = 10 * 1024 * 1024, // 10MB
  multiple = true,
  className,
}: UploadZoneProps) {
  const [dragActive, setDragActive] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragActive(false)

      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        const files = Array.from(e.dataTransfer.files)
        setSelectedFiles(files)
        onFilesSelected(e.dataTransfer.files)
      }
    },
    [onFilesSelected],
  )

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const files = Array.from(e.target.files)
      setSelectedFiles(files)
      onFilesSelected(e.target.files)
    }
  }

  // Reset component state after upload completion
  const resetUploadState = useCallback(() => {
    setSelectedFiles([])
    if (inputRef.current) {
      inputRef.current.value = ''
    }
    onUploadComplete?.()
  }, [onUploadComplete])

  const removeFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index)
    setSelectedFiles(newFiles)
    
    // If all files are removed, reset the input
    if (newFiles.length === 0 && inputRef.current) {
      inputRef.current.value = ''
    }
  }

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split(".").pop()?.toLowerCase()
    switch (extension) {
      case "pdf":
        return <FileText className="h-8 w-8 text-red-500" />
      case "jpg":
      case "jpeg":
      case "png":
      case "gif":
        return <ImageIcon className="h-8 w-8 text-blue-500" />
      default:
        return <File className="h-8 w-8 text-gray-500" />
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  return (
    <div className={cn("space-y-4", className)}>
      <AnimatedCard
        className={cn(
          "relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 cursor-pointer group",
          dragActive
            ? "border-primary bg-primary/5 scale-105"
            : "border-border hover:border-primary/50 hover:bg-primary/5",
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        glow
      >
        <input
          ref={inputRef}
          type="file"
          multiple={multiple}
          accept={acceptedTypes}
          onChange={handleFileSelect}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          id="file-upload"
        />

        <div className="space-y-4">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl group-hover:blur-2xl transition-all duration-500" />
            <div className="relative p-4 bg-primary/10 rounded-full group-hover:bg-primary/20 transition-colors duration-300 inline-flex">
              <Upload className="h-12 w-12 text-primary group-hover:scale-110 transition-transform duration-300" />
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-semibold">Drop files here or click to browse</h3>
            <p className="text-muted-foreground">Supported formats: PDF, CSV, XLSX, DOCX, JSON, TXT</p>
            <p className="text-sm text-muted-foreground">Maximum file size: {formatFileSize(maxSize)}</p>
          </div>

          <GradientButton className="mt-4" type="button" onClick={() => inputRef.current?.click()}>
            <Upload className="mr-2 h-4 w-4" />
            Choose Files
          </GradientButton>
        </div>
      </AnimatedCard>

      {/* Selected Files */}
      {selectedFiles.length > 0 && (
        <AnimatedCard className="p-4" glow>
          <h4 className="font-semibold mb-3">Selected Files ({selectedFiles.length})</h4>
          <div className="space-y-2">
            {selectedFiles.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg transition-all duration-300 hover:bg-muted/80 animate-in slide-in-from-bottom-2 duration-500"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-center space-x-3">
                  {getFileIcon(file.name)}
                  <div>
                    <p className="font-medium text-sm">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                  </div>
                </div>
                <button
                  onClick={() => removeFile(index)}
                  className="p-1 hover:bg-destructive/10 hover:text-destructive rounded-full transition-colors duration-200"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </AnimatedCard>
      )}
    </div>
  )
}
