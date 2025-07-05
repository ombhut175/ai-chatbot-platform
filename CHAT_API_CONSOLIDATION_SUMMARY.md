# Chat API Consolidation Summary

## Overview
The chat API has been consolidated into a single unified endpoint at `/api/chat` that handles both public and internal chatbot interactions.

## Changes Made

### 1. API Route Consolidation
- **Kept**: `/api/chat/route.ts` - The main unified chat endpoint
- **Removed**: 
  - `/api/chatbots/public/[id]/route.ts` - Public chatbot endpoint (functionality moved to unified endpoint)
  - All other chat-related subdirectories

### 2. Unified Chat Endpoint (`/api/chat`)
The endpoint now handles:
- **Public Chatbots**: No authentication required
- **Internal Chatbots**: Requires authentication and company/role verification
- **Chat History**: GET requests retrieve chat history for both types
- **Message Sending**: POST requests send messages and maintain sessions

#### Key Features:
1. Automatic chatbot type detection
2. Authentication check for internal chatbots
3. Company and role verification for internal access
4. Session management for both types
5. Pinecone integration for context retrieval
6. Gemini AI for response generation

### 3. Frontend Updates

#### ChatWidget Component (`src/components/chat/chat-widget.tsx`)
- Updated to use real API calls instead of simulated responses
- Fetches chatbot details from `/api/chatbots/details/[id]`
- Sends messages to `/api/chat`
- Manages sessions with localStorage
- Handles loading states and errors properly

#### Internal Chat Page (`src/components/pages/chat/internal.tsx`)
- Added real authentication checks using Supabase
- Redirects to login if not authenticated
- Loads chatbot details via API
- Shows user email in the UI

#### Public Chat Page
- Already configured correctly to use the unified endpoints

### 4. Middleware Updates
- Updated `src/middleware.ts` to exclude the unified `/api/chat` endpoint from authentication
- Updated `src/lib/supabase/middleware.ts` to remove references to old internal API routes
- `/api/chatbots/details/[id]` is accessible publicly but returns different data based on authentication

### 5. Supporting Endpoints
- **`/api/chatbots/details/[id]`**: Returns chatbot details (public or internal based on auth)
- **`/api/chatbots/[id]`**: Admin endpoint for managing chatbots (requires auth)
- **`/api/chatbots`**: List chatbots for a company (requires auth)

## API Usage Examples

### Public Chatbot
```javascript
// Send message (no auth required)
POST /api/chat
{
  "message": "Hello",
  "chatbotId": "public-bot-id",
  "sessionId": null // or existing session ID
}

// Get chat history
GET /api/chat?sessionId=xxx&chatbotId=public-bot-id
```

### Internal Chatbot
```javascript
// Send message (requires authentication)
POST /api/chat
Headers: { Authorization: "Bearer token" }
{
  "message": "Hello",
  "chatbotId": "internal-bot-id",
  "sessionId": null
}

// Get chat history (requires authentication)
GET /api/chat?sessionId=xxx&chatbotId=internal-bot-id
Headers: { Authorization: "Bearer token" }
```

## Database Schema Compliance
The implementation follows the schema defined in `development/schema/supabase/supabase.txt`:
- Uses proper table relationships
- Respects chatbot types (public/internal)
- Maintains session tracking with user_id for internal chats
- Stores messages with appropriate metadata

## Security Features
1. Public chatbots accessible without authentication
2. Internal chatbots require:
   - Valid authentication
   - User belongs to the same company as the chatbot
   - User has employee/admin/owner role
3. Session isolation between users
4. Proper error handling and status codes

## Testing
A test script has been created at `test-chat-api.js` to verify:
- Public chatbot access without authentication
- Internal chatbot access rejection without authentication
- Proper session management
- Chat history retrieval

## Next Steps
1. Test the unified endpoint with actual chatbot IDs
2. Verify Pinecone namespace integration
3. Ensure Gemini API responses are properly formatted
4. Monitor performance with the consolidated endpoint
5. Add rate limiting if needed
