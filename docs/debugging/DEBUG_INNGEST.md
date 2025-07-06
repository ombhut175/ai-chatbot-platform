# Debugging Inngest File Processing Issues

## Current Problem
- Event `file/process` is received by Inngest
- No functions are being triggered
- Database status remains "processing"
- Pinecone namespace is null

## Step-by-Step Debugging Guide

### 1. Check Inngest Dashboard Function Registration

Go to your Inngest dashboard and verify:
- Are your functions listed under "Functions" tab?
- Is `process-file` function showing as registered?
- Check the function status (active/inactive)

### 2. Verify Webhook Registration

In your Inngest dashboard:
1. Go to "Apps" or "Webhooks" section
2. Check if your Vercel URL is registered: `https://your-app.vercel.app/api/inngest`
3. Test the webhook connection

### 3. Re-deploy Functions to Inngest

Since you're using Vercel integration, try these steps:

```bash
# Option 1: Force redeploy on Vercel
# Go to Vercel dashboard and trigger a redeployment

# Option 2: If using manual setup, register functions
curl -X PUT https://your-app.vercel.app/api/inngest
```

### 4. Check Function Logs

In Inngest dashboard:
1. Go to Events → Click on your `file/process` event
2. Check if there are any error messages
3. Look for "Function runs" or "Function errors"

### 5. Verify Environment Variables

Check in Vercel dashboard that these are set:
- `PINECONE_API_KEY`
- `HUGGING_FACE_API_URL`
- `HUGGING_FACE_API_TOKEN`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY` (if using server-side Supabase)

### 6. Test Inngest Locally

To verify functions work locally:

```bash
# Start Inngest Dev Server
npx inngest-cli@latest dev

# In another terminal, start your Next.js app
npm run dev

# The Inngest Dev UI should open at http://localhost:8288
```

### 7. Manual Function Test

Create a test script to manually trigger the function:

```typescript
// test-inngest.ts
import { inngest } from './src/lib/inngest/client'

async function testEvent() {
  try {
    const result = await inngest.send({
      name: 'file/process',
      data: {
        dataSourceId: 'test-id',
        companyId: 'test-company',
        fileName: 'test.pdf',
        fileType: 'pdf',
        storagePath: 'test/path.pdf'
      }
    })
    console.log('Event sent:', result)
  } catch (error) {
    console.error('Error:', error)
  }
}

testEvent()
```

### 8. Check Pinecone Configuration

Verify in your code:
- Index name is hardcoded as `ai-chatbot-index-2`
- Embedding dimension is set to 384
- Ensure this matches your Pinecone dashboard configuration

### 9. Add Debug Logging

Add more logging to track the issue:

```typescript
// In src/lib/inngest/functions.ts
export const processFileFunction = inngest.createFunction(
  { 
    id: 'process-file',
    retries: 3, // Add retries
  },
  { event: 'file/process' },
  async ({ event, step }) => {
    console.log('🚀 Function triggered with event:', JSON.stringify(event))
    // ... rest of the function
  }
)
```

### 10. Common Fixes

1. **Re-register functions**: 
   - Redeploy your Vercel app
   - This should re-register all Inngest functions

2. **Check Vercel Integration**:
   - Go to Vercel → Project Settings → Integrations
   - Ensure Inngest integration is active
   - Try removing and re-adding the integration

3. **Manual Registration** (if not using integration):
   ```bash
   curl -X PUT https://your-app.vercel.app/api/inngest \
     -H "Content-Type: application/json"
   ```

## Immediate Actions

1. **Check Inngest Dashboard** for function registration
2. **Redeploy on Vercel** to re-register functions
3. **Test locally** with Inngest Dev Server
4. **Check function logs** in Inngest dashboard

## Expected Behavior After Fix

Once fixed, you should see:
1. Event shows "Functions triggered: 1" in Inngest
2. Function execution logs in Inngest dashboard
3. Database status updates from "processing" to "ready"
4. Pinecone namespace populated (e.g., `company_[your-company-id]`)

## Need More Help?

If issues persist:
1. Check Inngest Discord/Support
2. Verify all API keys are valid
3. Test each service (Pinecone, Hugging Face) individually
4. Check Vercel function logs for errors
