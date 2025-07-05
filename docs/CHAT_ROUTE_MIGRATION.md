# Chat Route Migration Guide

## Overview
The chat functionality has been unified into a single route `/chat` that handles both public and internal chatbots.

## Changes Made

### 1. Fixed State Management Issue
- **Problem**: When switching between chatbots, the previous chatbot's messages were showing in the new chat
- **Solution**: Added proper state reset when `chatbotId` changes
- **Implementation**: 
  - Added tracking of previous chatbot ID
  - Clear all state (messages, session, chatbot details) when switching
  - Remove old session from sessionStorage

### 2. Fixed Role Restrictions
- **Problem**: Internal chatbots were blocking admin and owner roles
- **Solution**: Updated to only block visitors
- **Allowed Roles**: `employee`, `admin`, `owner`
- **Blocked Role**: `visitor` only

### 3. Unified Chat Route
- **New Route**: `/chat?chatbotId=your-chatbot-id`
- **Old Routes** (deprecated but still working):
  - `/chat/public` 
  - `/chat/internal`

## Migration Steps

### For Developers

1. **Update Links**: Replace old chat routes with the unified route:
   ```typescript
   // Old
   <Link href="/chat/public">Public Chat</Link>
   <Link href="/chat/internal">Internal Chat</Link>
   
   // New
   <Link href={`/chat?chatbotId=${chatbot.id}`}>Open Chat</Link>
   ```

2. **Backend Role Check**: The API now correctly validates roles:
   ```typescript
   // Only blocks visitors
   if (userProfile.role === 'visitor') {
     return NextResponse.json(
       { error: 'Internal chatbots are restricted to company staff only' },
       { status: 403 }
     )
   }
   ```

### For End Users

1. **Public Chatbots**: No authentication required, direct access via URL
2. **Internal Chatbots**: 
   - Requires authentication
   - Must be employee, admin, or owner (not visitor)
   - Same company as the chatbot

## Technical Details

### State Management Fix
```typescript
// Reset state when chatbotId changes
useEffect(() => {
  if (previousChatbotIdRef.current && previousChatbotIdRef.current !== chatbotId) {
    resetChat()
    chatbotLoadedRef.current = false
    sessionStorage.removeItem(`chat_session_${previousChatbotIdRef.current}`)
  }
  previousChatbotIdRef.current = chatbotId
}, [chatbotId, resetChat])
```

### Enhanced Store Reset
```typescript
resetChat: () => set((state) => {
  state.messages = []
  state.sessionId = null
  state.chatbot = null  // Now also clears chatbot
  state.error = null
  state.inputMessage = ''
  state.isSending = false
  state.isLoading = false
})
```

## Testing

1. **Test State Reset**:
   - Open chat with chatbot A
   - Send some messages
   - Navigate to chat with chatbot B
   - Verify no messages from chatbot A appear

2. **Test Role Access**:
   - Login as owner/admin - ✅ Should access internal chatbots
   - Login as employee - ✅ Should access internal chatbots  
   - Login as visitor - ❌ Should be blocked from internal chatbots
   - No login - ❌ Should be blocked from internal chatbots

## Future Considerations

1. The legacy routes (`/chat/public` and `/chat/internal`) are marked as deprecated
2. They can be removed in a future version after all references are updated
3. Consider adding a redirect from old routes to new unified route

## Benefits

1. **Single Entry Point**: Easier to maintain and understand
2. **Proper State Isolation**: Each chatbot conversation is properly isolated
3. **Correct Access Control**: Follows the intended role hierarchy
4. **Better User Experience**: No more seeing old messages when switching chatbots
