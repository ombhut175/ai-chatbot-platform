# 🏗️ AI Chatbot Platform - Backend Flow & Architecture

## 📋 Overview

This document outlines the backend flow for the multi-tenant AI chatbot platform, and now clarifies which features require backend API routes and which can be implemented client-side, especially for assignment/demo purposes.

## 🚦 Backend API vs Client-Side: Assignment Guidance

| Feature                        | Client-side Only? | Needs Backend API? | Why?                          |
|--------------------------------|:----------------:|:------------------:|-------------------------------|
| Auth (Supabase)                |       ✅         |         ❌         | Supabase handles it           |
| CRUD (companies, chatbots, etc.)|       ✅         |         ❌         | Supabase client SDK           |
| File Upload (to Storage)        |       ✅         |         ❌         | Supabase Storage SDK          |
| File Processing/Vectorization   |       ❌         |         ✅         | Needs server libs & secrets   |
| AI Chat (Hugging Face)          |       ❌         |         ✅         | API key must be secret        |
| Pinecone/Vector DB              |       ❌         |         ✅         | API key must be secret        |
| Analytics (basic)               |       ✅         |         ❌         | Supabase queries              |
| Integrations (with secrets)     |       ❌         |         ✅         | API key must be secret        |

**Summary:**
- You can do 80% of the assignment client-side with Supabase.
- For AI chat and file processing, you MUST have backend API routes (even if just a simple Next.js API route).
- For an assignment, you can mock file processing/vectorization if you want to skip backend complexity, but AI chat should always go through a backend route for security.

## 🎯 Core Flow Summary

```
User Authentication → File Upload → Vector Processing → Chatbot Creation → Integration → Chat Interface
```

---

## 🔐 1. Authentication Flow

**No backend API route needed.**
- Use Supabase Auth client SDK for signup/login/session.

---

## 🏢 2. Company Creation & User Management Flow

**No backend API route needed.**
- Use Supabase client SDK for CRUD operations.

---

## 📁 3. File Upload & Processing Flow

- **File upload to storage:** Can be done client-side with Supabase Storage SDK.
- **File processing/vectorization:** Needs backend API route if you want to process files, extract text, or generate embeddings (Hugging Face, Pinecone, etc.). For assignment/demo, you can mock this step.

---

## 🤖 4. Chatbot Creation & Management

**No backend API route needed.**
- Use Supabase client SDK for CRUD operations.

---

## 💬 5. Chat Interface & AI Response

- **AI chat (Hugging Face):** MUST use backend API route to keep API key secret. Do not call Hugging Face from the browser.

---

## 🔗 6. Integrations & Embedding

- **If integration requires secret keys:** Use backend API route.
- **Otherwise:** Can be client-side.

---

## 🛡️ 7. Security Considerations

- Never expose secret API keys in the browser.
- Use backend API routes for any operation requiring secrets or privileged access.

---

## 🚀 Assignment Recommendation

- Implement most features client-side with Supabase.
- Add minimal backend API routes for AI chat and (optionally) file processing/vectorization.
- Mock file processing/vectorization if you want to skip backend complexity for the assignment deadline.

---

## 📈 Future/Production Note (not needed now)

For production/scalable systems, implement all backend API routes as originally described for security, maintainability, and scalability.

### Unified Chat API Route:

```typescript
// /api/chat/route.ts
POST /api/chat
{
  "chatbotId": "uuid",
  "message": "User question",
  "sessionId": "session_uuid" // Optional, for conversation context
}

Response:
{
  "success": true,
  "data": {
    "message": "AI generated answer",
    "sessionId": "session_uuid",
    "timestamp": "2024-01-05T..."
  }
}
```

The `/api/chat` endpoint automatically:
- Detects if the chatbot is public or internal
- Handles authentication for internal chatbots
- Works without authentication for public chatbots

---

## 📊 10. Complete API Structure

### Required API Routes:

```
🔐 Authentication & Company Management
├── POST /api/invitations/accept - Accept employee invitation
└── Handled by Supabase Auth (Client SDK) for basic auth

🏢 Company Management
├── GET /api/companies/[id]/members - List company team members
├── PUT /api/companies/[id]/members/[userId] - Update member role
├── DELETE /api/companies/[id]/members/[userId] - Remove team member
└── GET /api/companies/[id]/invitations - List pending invitations

👥 Invitation System
├── POST /api/invitations - Send employee invitation email
├── GET /api/invitations/[token] - Validate invitation token
├── DELETE /api/invitations/[id] - Cancel pending invitation
└── GET /api/companies/[id]/invitations - List pending invitations

📁 File Management
├── POST /api/upload - Upload files to storage
├── POST /api/process-file - Process & vectorize files
```