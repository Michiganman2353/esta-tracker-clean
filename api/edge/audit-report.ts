/**
 * Audit Report Edge Function
 * 
 * Optimized edge function for generating audit reports with:
 * - Streaming response for large datasets
 * - Incremental data processing
 * - Memory-efficient pagination
 * - CSV generation on the fly
 * 
 * Runs on Vercel Edge Runtime for low latency
 */

export const config = {
  runtime: 'edge',
};

interface AuditReportRequest {
  tenantId: string;
  startDate?: string;
  endDate?: string;
  format: 'json' | 'csv';
  filters?: {
    userId?: string;
    action?: string;
    resource?: string;
  };
}

interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  action: string;
  resource: string;
  details: Record<string, unknown>;
}

/**
 * Fetch audit logs with pagination
 * In production, this would query Firebase
 */
async function fetchAuditLogs(
  _request: AuditReportRequest,
  page: number = 0,
  pageSize: number = 100
): Promise<{ entries: AuditLogEntry[], hasMore: boolean }> {
  // Simulate fetching from database
  // In production, query Firebase with filters and pagination
  
  const mockEntries: AuditLogEntry[] = Array.from({ length: Math.min(pageSize, 50) }, (_, i) => ({
    id: `log-${page * pageSize + i}`,
    timestamp: new Date(Date.now() - i * 3600000).toISOString(),
    userId: `user-${Math.floor(Math.random() * 100)}`,
    action: (['create', 'update', 'delete', 'read'][Math.floor(Math.random() * 4)] || 'read') as string,
    resource: (['employee', 'timesheet', 'pto_request'][Math.floor(Math.random() * 3)] || 'employee') as string,
    details: { sample: 'data' },
  }));

  return {
    entries: mockEntries,
    hasMore: page < 2, // Mock pagination
  };
}

/**
 * Main edge function handler
 */
export default async function handler(request: Request): Promise<Response> {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  // Handle preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  // Only accept POST
  if (request.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }

  try {
    // Parse request body
    const body = await request.json() as AuditReportRequest;

    // Validate request
    if (!body.tenantId) {
      return new Response(
        JSON.stringify({ error: 'Tenant ID required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // For CSV format, use streaming
    if (body.format === 'csv') {
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          try {
            // Write CSV headers
            const headers = 'ID,Timestamp,User ID,Action,Resource,Details\n';
            controller.enqueue(encoder.encode(headers));

            // Fetch and stream data in chunks
            let page = 0;
            let hasMore = true;

            while (hasMore) {
              const { entries, hasMore: more } = await fetchAuditLogs(body, page, 100);
              
              // Convert entries to CSV rows
              const csv = entries.map(entry => {
                const row = [
                  entry.id,
                  entry.timestamp,
                  entry.userId,
                  entry.action,
                  entry.resource,
                  JSON.stringify(entry.details)
                ];
                return row.map(cell => `"${cell}"`).join(',');
              }).join('\n');

              // Stream the chunk
              if (csv) {
                controller.enqueue(encoder.encode(csv + '\n'));
              }

              hasMore = more;
              page++;
            }

            controller.close();
          } catch (error) {
            console.error('Streaming error:', error);
            controller.error(error);
          }
        }
      });

      return new Response(stream, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="audit-report-${body.tenantId}-${Date.now()}.csv"`,
          'Cache-Control': 'no-cache',
        }
      });
    }

    // For JSON format, return paginated data
    const { entries } = await fetchAuditLogs(body, 0, 100);

    return new Response(
      JSON.stringify({
        success: true,
        count: entries.length,
        data: entries,
        generatedAt: new Date().toISOString(),
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        }
      }
    );

  } catch (error) {
    console.error('Audit report error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
}
