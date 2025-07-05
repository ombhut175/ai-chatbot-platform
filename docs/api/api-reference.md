# API Reference

## Table of Contents
- [Authentication](#authentication)
- [Chat Endpoints](#chat-endpoints)
- [Chatbot Management](#chatbot-management)
- [Data Source Management](#data-source-management)
- [Dashboard & Analytics](#dashboard--analytics)
- [API Keys Management](#api-keys-management)
- [File Processing](#file-processing)
- [Error Responses](#error-responses)

## Authentication

All API endpoints (except public chatbot endpoints) require authentication via Supabase Auth cookies or API keys.

### Headers
```http
Cookie: sb-access-token=<jwt-token>
Content-Type: application/json
```

For API key authentication:
```http
Authorization: Bearer <api-key>
Content-Type: application/json
```

## Chat Endpoints

### Send Chat Message
Unified endpoint that handles both public and internal chatbot conversations.

**Endpoint:** `POST /api/chat`

**Request Body:**
```json
{
  "message": "string",
  "chatbotId": "uuid",
  "sessionId": "uuid" // optional
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "response": "AI generated response",
    "sessionId": "uuid",
    "timestamp": "2024-01-05T12:00:00Z"
  }
}
```

### Public Chat Access
Legacy endpoint for public chatbot access (deprecated, use unified endpoint).

**Endpoint:** `POST /api/chat/public`

**Request Body:**
```json
{
  "message": "string",
  "chatbotId": "uuid",
  "sessionId": "uuid" // optional
}
```

## Chatbot Management

### List Chatbots
Get all chatbots for the authenticated user's company.

**Endpoint:** `GET /api/chatbots`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Customer Support Bot",
      "description": "Helps customers with common queries",
      "type": "public",
      "is_active": true,
      "status": "ready",
      "personality": "professional",
      "welcome_message": "Hello! How can I help you?",
      "theme": {
        "primaryColor": "#3B82F6",
        "backgroundColor": "#FFFFFF",
        "textColor": "#1F2937"
      },
      "created_at": "2024-01-05T12:00:00Z",
      "updated_at": "2024-01-05T12:00:00Z"
    }
  ]
}
```

### Create Chatbot
Create a new chatbot for the company.

**Endpoint:** `POST /api/chatbots`

**Request Body:**
```json
{
  "name": "string",
  "description": "string",
  "type": "public" | "internal",
  "welcome_message": "string",
  "personality": "professional" | "friendly" | "casual" | "technical" | "concise",
  "theme": {
    "primaryColor": "#hexcolor",
    "backgroundColor": "#hexcolor",
    "textColor": "#hexcolor"
  },
  "data_source_ids": ["uuid", "uuid"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "New Chatbot",
    "status": "processing",
    // ... other chatbot fields
  }
}
```

### Get Chatbot Details
Get details of a specific chatbot.

**Endpoint:** `GET /api/chatbots/details/{chatbotId}`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Customer Support Bot",
    "type": "public",
    // ... all chatbot fields
  }
}
```

### Update Chatbot
Update an existing chatbot.

**Endpoint:** `PUT /api/chatbots/{chatbotId}`

**Request Body:**
```json
{
  "name": "string",
  "description": "string",
  "welcome_message": "string",
  "personality": "string",
  "theme": {},
  "is_active": boolean
}
```

### Delete Chatbot
Delete a chatbot.

**Endpoint:** `DELETE /api/chatbots/{chatbotId}`

**Response:**
```json
{
  "success": true,
  "message": "Chatbot deleted successfully"
}
```

## Data Source Management

### Upload File
Upload a file to be processed as a data source.

**Endpoint:** `POST /api/upload`

**Request:** Multipart form data
```
file: <binary>
companyId: uuid
```

**Response:**
```json
{
  "success": true,
  "data": {
    "dataSourceId": "uuid",
    "fileName": "document.pdf",
    "fileType": "pdf",
    "size": 1048576,
    "status": "processing"
  }
}
```

### Add Q&A Pairs
Add question-answer pairs as a data source.

**Endpoint:** `POST /api/qa-pairs`

**Request Body:**
```json
{
  "companyId": "uuid",
  "qaPairs": [
    {
      "question": "What are your business hours?",
      "answer": "We are open Monday to Friday, 9 AM to 6 PM EST."
    }
  ]
}
```

### Scrape URL
Scrape content from a URL as a data source.

**Endpoint:** `POST /api/scrape-url`

**Request Body:**
```json
{
  "url": "https://example.com",
  "companyId": "uuid"
}
```

## Dashboard & Analytics

### Get Dashboard Statistics
Get overview statistics for the dashboard.

**Endpoint:** `GET /api/dashboard/stats`

**Query Parameters:**
- `companyId`: uuid (required)

**Response:**
```json
{
  "totalChatbots": 5,
  "totalChats": 1234,
  "totalMessages": 5678,
  "avgResponseTime": 2.5,
  "totalDataSources": 15,
  "activeUsers": 45,
  "satisfactionScore": 4.5
}
```

### Get Recent Activity
Get recent activity for the dashboard.

**Endpoint:** `GET /api/dashboard/activity`

**Query Parameters:**
- `companyId`: uuid (required)
- `limit`: number (optional, default: 10)

**Response:**
```json
{
  "activities": [
    {
      "id": "uuid",
      "type": "chat_created",
      "description": "New chat session started",
      "timestamp": "2024-01-05T12:00:00Z",
      "metadata": {
        "chatbotName": "Support Bot",
        "userName": "John Doe"
      }
    }
  ]
}
```

## API Keys Management

### List API Keys
Get all API keys for a chatbot.

**Endpoint:** `GET /api/chatbots/{chatbotId}/api-keys`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Production Key",
      "key_preview": "ck_abc...xyz",
      "created_at": "2024-01-05T12:00:00Z",
      "last_used_at": "2024-01-05T14:00:00Z",
      "is_active": true
    }
  ]
}
```

### Create API Key
Generate a new API key for a chatbot.

**Endpoint:** `POST /api/chatbots/{chatbotId}/api-keys`

**Request Body:**
```json
{
  "name": "New API Key",
  "permissions": ["chat", "read"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "New API Key",
    "key": "ck_full_api_key_shown_once",
    "created_at": "2024-01-05T12:00:00Z"
  }
}
```

### Revoke API Key
Revoke an API key.

**Endpoint:** `DELETE /api/chatbots/{chatbotId}/api-keys/{keyId}`

**Response:**
```json
{
  "success": true,
  "message": "API key revoked successfully"
}
```

## File Processing

### Process File (Background Job)
Trigger file processing for uploaded documents.

**Endpoint:** `POST /api/process-file`

**Request Body:**
```json
{
  "dataSourceId": "uuid",
  "companyId": "uuid",
  "fileName": "document.pdf",
  "fileType": "pdf",
  "storagePath": "companies/uuid/documents/document.pdf"
}
```

**Note:** This endpoint is typically called by the background job processor (Inngest).

## Error Responses

All endpoints follow a consistent error response format:

### 400 Bad Request
```json
{
  "success": false,
  "error": "Invalid request parameters",
  "details": {
    "field": "error description"
  }
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "error": "Authentication required"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "error": "Not authorized to access this resource"
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Internal server error",
  "message": "Please try again later"
}
```

## Rate Limiting

API endpoints implement rate limiting to prevent abuse:

- **Authenticated requests**: 1000 requests per hour
- **Public chat endpoints**: 100 requests per hour per IP
- **File uploads**: 50 uploads per hour

Rate limit headers:
```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1704456000
```

## Webhook Events

The platform can send webhook notifications for certain events:

### Chat Session Started
```json
{
  "event": "chat.session.started",
  "timestamp": "2024-01-05T12:00:00Z",
  "data": {
    "sessionId": "uuid",
    "chatbotId": "uuid",
    "type": "public"
  }
}
```

### Data Source Processed
```json
{
  "event": "datasource.processed",
  "timestamp": "2024-01-05T12:00:00Z",
  "data": {
    "dataSourceId": "uuid",
    "status": "ready",
    "chunks": 150
  }
}
```
