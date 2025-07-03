import DataSourcesClientPage from "@/components/pages/dashboard/data"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Data Sources | Dashboard | AI Chatbot Platform",
  description: "Upload and manage your knowledge base content for your AI chatbot.",
}

export default function DataSourcesPage() {
  return <DataSourcesClientPage />
}
