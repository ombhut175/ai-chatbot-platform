# Chatbot API Authentication Guide

## Overview

The AI Chatbot Platform supports two types of chatbots with different authentication requirements:

1. **Public Chatbots** - No authentication required, accessible by anyone
2. **Internal Chatbots** - Requires authentication, only accessible by company employees

## Authentication Strategy

### Public Chatbots
- Use a public Supabase client without authentication cookies
- No user session required
- Accessible via public API endpoints

### Internal Chatbots
- Use authenticated Supabase client with user cookies
- Requires valid user session
- User must be an employee of the company that owns the chatbot
- Tracks user_id in chat sessions for audit purposes

## API Endpoints

### 1. Get Chatbot Details

#### Unified Endpoint (Recommended)
```
GET /api/chatbots/details/{chatbotId}
```

This endpoint automatically handles both public and internal chatbots:
- For public chatbots: No authentication required
- For internal chatbots: Requires authentication and verifies company access

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Chatbot Name",
    "description": "Description",
    "welcome_message": "Welcome!",
    "theme": {...},
    "type": "public" | "internal"
  }
}
```

#### Legacy Endpoints
- Public: `GET /api/chatbots/public/{chatbotId}` (No auth required)
- Internal: `GET /api/chatbots/internal/{chatbotId}` (Auth required)

### 2. Chat Conversation

#### Unified Endpoint
```
POST /api/chat
```

**Request Body:**
```json
{
  "message": "User's question",
  "chatbotId": "uuid",
  "sessionId": "optional-session-id"
}
```

This endpoint automatically:
- Detects chatbot type
- Handles authentication for internal chatbots
- Creates sessions with user_id for internal chats
- Returns appropriate errors for unauthorized access

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "AI response",
    "sessionId": "session-uuid",
    "timestamp": "2024-01-05T..."
  }
}
```

#### Legacy Endpoints (Removed)
- Previously: `/api/chat/public`, `/api/chat/internal`
- Now: Use `/api/chat` for all chat operations

### 3. Chat History

#### Unified Endpoint
```
GET /api/chat?sessionId={sessionId}&chatbotId={chatbotId}
```

Automatically handles authentication based on chatbot type.

## Creating Chatbots

```
POST /api/chatbots
```

**Request Body:**
```json
{
  "name": "My Chatbot",
  "description": "A helpful assistant",
  "type": "public" | "internal",  // Specify the type
  "welcome_message": "Hello!",
  "personality": "professional",
  "theme": {
    "primaryColor": "#3B82F6",
    "backgroundColor": "#FFFFFF",
    "textColor": "#1F2937"
  },
  "data_source_ids": ["uuid1", "uuid2"]
}
```

## Database Schema Updates

### chat_sessions Table
Added `user_id` column to track which user is chatting in internal chatbot sessions:

```sql
ALTER TABLE public.chat_sessions
ADD COLUMN user_id uuid REFERENCES public.users(id);
```

- `user_id` is NULL for public chatbot sessions
- `user_id` is required for internal chatbot sessions

## Implementation Details

### Supabase Clients

1. **Authenticated Client** (`createClient()`)
   - Uses cookies for authentication
   - Required for internal chatbots
   - Used for all dashboard operations

2. **Public Client** (`createPublicClient()`)
   - No authentication cookies
   - Used for public chatbot access
   - Returns empty cookie array

### Middleware Configuration

The middleware automatically handles authentication requirements:

```typescript
// Public routes that don't require authentication
const publicRoutes = [
  AppRoute.CHAT_PUBLIC,
  '/api/chatbots/public'
]

// The /api/chat endpoint handles both public and internal chats
// Authentication is determined dynamically based on chatbot type
```

## Error Handling

### Common Error Responses

1. **Unauthorized Access (401)**
   ```json
   {
     "success": false,
     "error": "Authentication required for internal chatbots"
   }
   ```

2. **Forbidden Access (403)**
   ```json
   {
     "success": false,
     "error": "Not authorized to access this chatbot"
   }
   ```

3. **Chatbot Not Found (404)**
   ```json
   {
     "success": false,
     "error": "Chatbot not found or inactive"
   }
   ```

## Best Practices

1. **Use Unified Endpoints**: The unified endpoints (`/api/chatbots/details/[id]` and `/api/chat/unified`) automatically handle authentication based on chatbot type.

2. **Session Management**: 
   - For public chatbots: Store session ID in localStorage/sessionStorage
   - For internal chatbots: Session is tied to authenticated user

3. **Error Handling**: Always check the response status and handle authentication errors gracefully.

4. **Type Safety**: Use TypeScript interfaces for request/response types.

## Migration Guide

If you're currently using the legacy endpoints, migrate to unified endpoints:

1. Replace `/api/chatbots/public/[id]` and `/api/chatbots/internal/[id]` with `/api/chatbots/details/[id]`
2. Replace `/api/chat/public` and `/api/chat/internal` with `/api/chat/unified`
3. The unified endpoints will automatically handle authentication based on chatbot type
