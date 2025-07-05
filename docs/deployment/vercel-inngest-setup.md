# Vercel Deployment Guide with Inngest Background Processing

This guide explains how to deploy the AI Chatbot Platform to Vercel with proper Inngest configuration for background processing.

## Prerequisites

1. Vercel account
2. Inngest account (free tier available)
3. All other services configured (Supabase, Pinecone, etc.)

## Choose Your Setup Method

**Option 1: Vercel Integration (Recommended)**
- ✅ Automatic environment variable configuration
- ✅ Automatic webhook registration
- ✅ Seamless deployment updates
- ✅ No manual configuration needed

**Option 2: Manual Setup**
- Requires manual environment variable setup
- Requires manual webhook configuration
- More control over configuration
- Better for debugging or custom setups

## Option 1: Using Vercel Integration (Recommended)

### Step 1: Install Inngest Integration

1. **In your Vercel Dashboard**:
   - Go to your project
   - Click on "Integrations" tab
   - Search for "Inngest"
   - Click "Add Integration"

2. **Connect your Inngest account**:
   - Sign in to Inngest or create new account
   - Authorize the integration
   - Select your Vercel project

3. **Integration Benefits**:
   - Automatic environment variable configuration
   - Automatic webhook registration
   - Seamless deployment updates

## Option 2: Manual Setup

### Step 1: Set Up Inngest Cloud

1. **Create an Inngest Cloud account** at [app.inngest.com](https://app.inngest.com)

2. **Create a new app** in Inngest Cloud:
   - Name it `ai-chatbot-platform`
   - Note down your **Event Key** and **Signing Key**

3. **Configure your app**:
   - Set the webhook URL to: `https://your-vercel-domain.vercel.app/api/inngest`
   - Enable production mode

## Step 2: Configure Environment Variables in Vercel

Add these environment variables in your Vercel project settings:

### Required Inngest Variables (Manual Setup Only)
**Note:** Skip this section if you're using the Vercel integration - these variables are automatically configured.

```bash
INNGEST_EVENT_KEY=your_inngest_event_key_from_cloud
INNGEST_SIGNING_KEY=your_inngest_signing_key_from_cloud
```

### Other Required Variables
```bash
# App Configuration
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-vercel-domain.vercel.app

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Pinecone
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_ENVIRONMENT=your_pinecone_environment
PINECONE_INDEX_NAME=your_pinecone_index_name

# AI Services
GEMINI_API_KEY=your_gemini_api_key
HUGGING_FACE_API_URL=your_hf_url
HUGGING_FACE_API_TOKEN=your_hf_token
```

## Step 3: Deploy to Vercel

1. **Push your code** to GitHub/GitLab/Bitbucket

2. **Import project** in Vercel:
   - Connect your repository
   - Vercel will auto-detect Next.js
   - Add all environment variables from Step 2

3. **Deploy** the project

## Step 4: Register Inngest Webhook (Manual Setup Only)

**Note:** Skip this step if you're using the Vercel integration - webhooks are automatically registered.

After deployment, you need to register your Inngest webhook:

1. **Get your deployment URL** from Vercel (e.g., `https://your-app.vercel.app`)

2. **Test the Inngest endpoint**:
   ```bash
   curl https://your-app.vercel.app/api/inngest
   ```
   You should see the Inngest landing page (in development) or a success response.

3. **In Inngest Cloud**:
   - Go to your app settings
   - Set webhook URL to: `https://your-app.vercel.app/api/inngest`
   - Click "Test Webhook" to verify connection

## Step 5: Verify Background Processing

1. **Upload a test file** through your application
2. **Check Inngest Cloud dashboard** for:
   - Event received (`file/process`, `url/process`, or `qa/process`)
   - Function execution status
   - Any errors in processing

3. **Monitor logs** in Vercel Functions tab for detailed debugging

## Troubleshooting

### Background jobs not running

1. **Check environment variables**:
   - **If using Vercel integration**: Verify the integration is properly connected and active
   - **If using manual setup**: Ensure `INNGEST_EVENT_KEY` and `INNGEST_SIGNING_KEY` are set in Vercel and match your Inngest Cloud app

2. **Verify webhook registration**:
   - Test webhook URL: `curl -X POST https://your-app.vercel.app/api/inngest`
   - Check Inngest Cloud dashboard for webhook status

3. **Check function timeouts**:
   - Vercel free tier has 10-second timeout
   - Pro tier has 60-second timeout
   - Our `vercel.json` configures appropriate timeouts

### Common Issues

1. **"Missing required environment variables"**:
   - Redeploy after adding environment variables
   - Vercel requires redeploy for env changes

2. **"Failed to send Inngest event"**:
   - Check `INNGEST_EVENT_KEY` is correct
   - Verify Inngest Cloud app is active

3. **Functions timing out**:
   - Upgrade to Vercel Pro for longer timeouts
   - Or split large processing into smaller chunks

## Production Best Practices

1. **Monitor function execution** in Inngest Cloud dashboard
2. **Set up alerts** for failed functions
3. **Use Vercel Analytics** to track API performance
4. **Implement retry logic** for critical operations
5. **Log important events** for debugging

## Security Considerations

1. **Never expose** `INNGEST_SIGNING_KEY` in client-side code
2. **Validate webhook signatures** (handled by Inngest SDK)
3. **Use environment variables** for all sensitive data
4. **Enable Vercel's DDoS protection** for production

## Scaling Considerations

1. **Vercel Function Limits**:
   - Free: 10-second timeout, 1GB memory
   - Pro: 60-second timeout, 3GB memory
   - Enterprise: 300-second timeout, 3GB memory

2. **Inngest Limits**:
   - Free: 50k events/month
   - Paid: Higher limits based on plan

3. **Optimization Tips**:
   - Process files in chunks
   - Use efficient data structures
   - Implement caching where possible
