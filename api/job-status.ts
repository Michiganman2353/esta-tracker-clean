/**
 * Job Status API Endpoint
 * Provides unified access to check status of any background job
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getJobStatus, verifyUserPermission } from './lib/backgroundJobUtils';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { jobId, userId, tenantId } = req.query;

    if (!jobId || typeof jobId !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid jobId parameter' });
    }

    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid userId parameter' });
    }

    if (!tenantId || typeof tenantId !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid tenantId parameter' });
    }

    // Verify user permission
    const hasPermission = await verifyUserPermission(userId, tenantId, 'employee');
    if (!hasPermission) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    // Get job status
    const job = await getJobStatus(jobId);

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Verify user can access this job
    if (job.tenantId !== tenantId) {
      return res.status(403).json({ error: 'Access denied to this job' });
    }

    return res.status(200).json({
      success: true,
      job,
    });
  } catch (error) {
    console.error('Job status handler error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
