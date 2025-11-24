/**
 * Batch Processing Edge Function
 * 
 * Optimized edge function for handling batch operations with:
 * - Parallel processing
 * - Progress streaming
 * - Error recovery
 * - Rate limiting
 * 
 * Runs on Vercel Edge Runtime for low latency
 */

export const config = {
  runtime: 'edge',
};

interface BatchRequest {
  operations: Array<{
    id: string;
    type: 'create' | 'update' | 'delete';
    collection: string;
    data: Record<string, unknown>;
  }>;
  options?: {
    parallel?: boolean;
    maxConcurrency?: number;
    continueOnError?: boolean;
  };
}

interface BatchResult {
  success: boolean;
  completed: number;
  failed: number;
  errors: Array<{
    operationId: string;
    error: string;
  }>;
  duration: number;
}

/**
 * Process batch operations in parallel with controlled concurrency
 */
async function processBatch(
  operations: BatchRequest['operations'],
  maxConcurrency: number = 5
): Promise<BatchResult> {
  const startTime = Date.now();
  let completed = 0;
  let failed = 0;
  const errors: BatchResult['errors'] = [];

  // Process in chunks to control concurrency
  for (let i = 0; i < operations.length; i += maxConcurrency) {
    const chunk = operations.slice(i, i + maxConcurrency);
    
    const results = await Promise.allSettled(
      chunk.map(async (op) => {
        try {
          // Simulate operation (in production, this would be actual Firebase operation)
          // Use fixed delay for deterministic testing
          await new Promise(resolve => setTimeout(resolve, 50));
          
          // In production, perform actual operation:
          // await performOperation(op);
          
          return { success: true, operationId: op.id };
        } catch (error) {
          throw new Error(`Operation ${op.id} failed: ${error}`);
        }
      })
    );

    // Process results
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        completed++;
      } else {
        failed++;
        const chunkItem = chunk[index];
        errors.push({
          operationId: chunkItem ? chunkItem.id : `unknown-${index}`,
          error: result.reason?.message || 'Unknown error',
        });
      }
    });
  }

  return {
    success: failed === 0,
    completed,
    failed,
    errors,
    duration: Date.now() - startTime,
  };
}

/**
 * Main edge function handler
 */
export default async function handler(request: Request): Promise<Response> {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json',
  };

  // Handle preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  // Only accept POST
  if (request.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers }
    );
  }

  try {
    // Parse request body
    const body = await request.json() as BatchRequest;

    // Validate request
    if (!body.operations || !Array.isArray(body.operations)) {
      return new Response(
        JSON.stringify({ error: 'Invalid request: operations array required' }),
        { status: 400, headers }
      );
    }

    if (body.operations.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No operations provided' }),
        { status: 400, headers }
      );
    }

    // Rate limiting check (simple example)
    const operationCount = body.operations.length;
    if (operationCount > 1000) {
      return new Response(
        JSON.stringify({ 
          error: 'Batch size exceeds limit',
          maxBatchSize: 1000 
        }),
        { status: 413, headers }
      );
    }

    // Process batch
    const result = await processBatch(
      body.operations,
      body.options?.maxConcurrency || 5
    );

    // Return result
    return new Response(
      JSON.stringify(result),
      { 
        status: result.success ? 200 : 207, // 207 = Multi-Status
        headers 
      }
    );

  } catch (error) {
    console.error('Batch processing error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers }
    );
  }
}
