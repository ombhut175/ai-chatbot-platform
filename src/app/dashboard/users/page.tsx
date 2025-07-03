import { Metadata } from "next"
import { UsersPage } from "@/components/pages/dashboard/users"

export const metadata: Metadata = {
  title: "Organization Users | AI Chatbot Platform",
  description: "Manage users in your organization. Add, edit, and remove users for your company on the AI Chatbot Platform.",
}

export default function UsersPageRoute() {
  return (
    <>
      <UsersPage />
    </>
  )
} 