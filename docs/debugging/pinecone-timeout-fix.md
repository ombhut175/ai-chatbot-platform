# Pinecone Timeout Error - Debugging Guide & Solutions

## Error Summary
You're experiencing intermittent 504 Gateway Timeout errors when uploading data to Pinecone through Inngest's background processing. The error occurs specifically during the `create-embeddings` step in the `processFileFunction`.

```
Error: Failed to upload to Pinecone: Failed to upload document to Pinecone: An unexpected error occured while calling the https://ai-chatbot-index-2-hr1kwcq.svc.aped-4627-b74a.pinecone.io/vectors/upsert endpoint. upstream request timeout Status: 504.
```

## Root Cause Analysis

### 1. **Timeout Chain**
The timeout occurs due to a chain of timeouts across multiple services:
- Pinecone API has its own timeout limits
- Inngest step functions have default timeout settings
- Vercel Functions have a 10-second timeout on Hobby plan (300s on Pro)
- The embedding creation + vector upload process can exceed these limits

### 2. **Large Batch Processing**
The current implementation tries to upload all vectors in a single batch:
```typescript
await index.namespace(namespace).upsert(vectors)
```

### 3. **Sequential Embedding Creation**
Embeddings are created sequentially, which can be slow for large documents:
```typescript
for (let i = 0; i < chunks.length; i++) {
  const embeddingResult = await this.createEmbeddings(limitedText)
  // ...
}
```

## Immediate Solutions

### Solution 1: Batch Processing for Pinecone Uploads
Modify the `uploadDocument` method in `src/lib/services/pinecone.ts` to upload vectors in smaller batches:

```typescript
// Upload vectors to Pinecone in batches
console.log(`🚀 Uploading ${vectors.length} vectors to Pinecone namespace: ${namespace}...`)

// Batch size for Pinecone uploads (100 is a safe default)
const BATCH_SIZE = 100;
const batches = [];

for (let i = 0; i < vectors.length; i += BATCH_SIZE) {
  batches.push(vectors.slice(i, i + BATCH_SIZE));
}

console.log(`📦 Split into ${batches.length} batches of up to ${BATCH_SIZE} vectors each`);

// Upload each batch
for (let i = 0; i < batches.length; i++) {
  const batch = batches[i];
  console.log(`📤 Uploading batch ${i + 1}/${batches.length} (${batch.length} vectors)...`);
  
  try {
    await index.namespace(namespace).upsert(batch);
    console.log(`✅ Batch ${i + 1} uploaded successfully`);
    
    // Small delay between batches to avoid rate limiting
    if (i < batches.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  } catch (batchError) {
    console.error(`❌ Failed to upload batch ${i + 1}:`, batchError);
    throw new Error(`Failed to upload batch ${i + 1} of ${batches.length}: ${batchError instanceof Error ? batchError.message : 'Unknown error'}`);
  }
}
```

### Solution 2: Add Retry Logic with Exponential Backoff
Wrap the Pinecone upload with retry logic:

```typescript
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> {
  let lastError: any;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Check if error is retryable
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('timeout') || errorMessage.includes('504')) {
        const delay = initialDelay * Math.pow(2, i);
        console.log(`⏳ Retrying after ${delay}ms (attempt ${i + 1}/${maxRetries})...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        // Non-retryable error, throw immediately
        throw error;
      }
    }
  }
  
  throw lastError;
}

// Use in upload:
await retryWithBackoff(async () => {
  await index.namespace(namespace).upsert(batch);
});
```

### Solution 3: Configure Inngest Step Timeouts
Update the Inngest function to have longer timeouts:

```typescript
const embeddingResult = await step.run('create-embeddings', async () => {
  // Your existing code
}, {
  timeout: '5m' // Increase timeout to 5 minutes
});
```

## Long-term Solutions

### 1. **Parallel Embedding Creation**
Process embeddings in parallel batches:

```typescript
// Process embeddings in parallel batches
const PARALLEL_BATCH_SIZE = 5;
const embeddingPromises = [];

for (let i = 0; i < chunks.length; i += PARALLEL_BATCH_SIZE) {
  const batchChunks = chunks.slice(i, i + PARALLEL_BATCH_SIZE);
  
  const batchPromise = Promise.all(
    batchChunks.map(async (chunk) => {
      const embeddingResult = await this.createEmbeddings(chunk.text);
      return {
        chunk,
        embedding: embeddingResult
      };
    })
  );
  
  embeddingPromises.push(batchPromise);
}

const allResults = await Promise.all(embeddingPromises);
```

### 2. **Split Large Files into Multiple Inngest Events**
For very large files, split processing into multiple events:

```typescript
if (chunks.length > 100) {
  // Split into multiple processing events
  const CHUNKS_PER_EVENT = 50;
  
  for (let i = 0; i < chunks.length; i += CHUNKS_PER_EVENT) {
    await inngest.send({
      name: 'file/process.chunk',
      data: {
        dataSourceId,
        chunkStart: i,
        chunkEnd: Math.min(i + CHUNKS_PER_EVENT, chunks.length),
        // ... other data
      }
    });
  }
}
```

### 3. **Use Pinecone's Async Upload API**
Consider using Pinecone's async upload features if available for your plan.

## Debugging Tips

### 1. **Enhanced Logging**
Add detailed timing logs:

```typescript
const startTime = Date.now();
console.log(`[TIMING] Starting ${operation} at ${new Date().toISOString()}`);

// ... operation ...

const duration = Date.now() - startTime;
console.log(`[TIMING] ${operation} completed in ${duration}ms`);
```

### 2. **Monitor with Inngest Dev Server**
```bash
npx inngest-cli@latest dev
```

Watch for:
- Step execution times
- Retry attempts
- Memory usage

### 3. **Test with Different File Sizes**
Create test files of various sizes to identify the threshold:
- Small: < 100KB
- Medium: 100KB - 1MB
- Large: > 1MB

### 4. **Environment-Specific Debugging**

#### Local Development
```typescript
// Add to your .env.local
DEBUG_PINECONE=true
DEBUG_INNGEST=true

// In your code
if (process.env.DEBUG_PINECONE) {
  console.log('[DEBUG] Pinecone operation:', {
    vectors: vectors.length,
    namespace,
    timestamp: new Date().toISOString()
  });
}
```

#### Production (Vercel)
Use Vercel's function logs:
```bash
vercel logs --follow
```

### 5. **Error Tracking**
Implement structured error tracking:

```typescript
interface ProcessingError {
  dataSourceId: string;
  step: string;
  errorType: 'timeout' | 'rate_limit' | 'unknown';
  message: string;
  timestamp: Date;
  retryCount: number;
}

// Log to a dedicated error tracking service or database
```

## Monitoring Recommendations

1. **Set up alerts for**:
   - 504 errors
   - Processing times > 30s
   - Failed retries > 3

2. **Track metrics**:
   - Average processing time per file type
   - Success rate by file size
   - Peak processing hours

3. **Create dashboards showing**:
   - Queue depth
   - Processing throughput
   - Error rates by type

## Testing the Fix

1. **Test with problematic file**:
   ```bash
   # Upload the file that was causing issues
   # Monitor Inngest dev server for processing
   ```

2. **Stress test**:
   ```bash
   # Upload multiple files simultaneously
   # Check for timeout patterns
   ```

3. **Monitor production**:
   - Deploy fixes to production
   - Monitor for 24-48 hours
   - Track error rates

## Prevention Strategies

1. **File size limits**: Consider stricter limits based on your infrastructure
2. **Pre-processing validation**: Check file complexity before processing
3. **Graceful degradation**: Fall back to simpler processing for large files
4. **User notifications**: Inform users about processing delays for large files

## Emergency Workarounds

If timeouts persist:

1. **Manual retry button**: Add UI for users to retry failed uploads
2. **Direct upload option**: Bypass Inngest for critical uploads
3. **Batch upload scheduling**: Process large uploads during off-peak hours
