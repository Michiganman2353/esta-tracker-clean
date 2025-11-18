import { Response, Router } from 'express';
import { getFirestore } from '../services/firebase';
import { authenticate } from '../middleware/auth';
import { AuthenticatedRequest } from '../middleware/auth';

const router = Router();
const db = getFirestore();

interface PolicyData {
  id: string;
  name: string;
  type: 'accrual' | 'frontload' | 'hybrid';
  version: string;
  employerSize: 'small' | 'large';
  rules: Record<string, unknown>;
  conditions?: Record<string, unknown>;
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
    tenantId?: string;
  };
}

interface PolicyHistoryEntry {
  policyId: string;
  activatedAt: Date;
  deactivatedAt?: Date;
}

interface TenantPolicyConfig {
  tenantId: string;
  activePolicyId: string;
  policyHistory: PolicyHistoryEntry[];
  customizations?: Record<string, unknown> | null;
}

/**
 * GET /api/v1/policies
 * Get all available policies for tenant
 */
router.get('/', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { tenantId } = req.user || {};
    const { employerSize } = req.query;

    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID required' });
    }

    // Get default policies
    const policiesRef = db.collection('policies');
    let query = policiesRef.where('metadata.tenantId', 'in', [null, tenantId]);

    if (employerSize) {
      query = query.where('employerSize', '==', employerSize);
    }

    const snapshot = await query.get();
    const policies = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.json({ policies });
  } catch (error) {
    console.error('Error fetching policies:', error);
    res.status(500).json({ error: 'Failed to fetch policies' });
  }
});

/**
 * GET /api/v1/policies/:id
 * Get a specific policy by ID
 */
router.get('/:id', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const policyDoc = await db.collection('policies').doc(id).get();

    if (!policyDoc.exists) {
      return res.status(404).json({ error: 'Policy not found' });
    }

    res.json({
      policy: {
        id: policyDoc.id,
        ...policyDoc.data(),
      },
    });
  } catch (error) {
    console.error('Error fetching policy:', error);
    res.status(500).json({ error: 'Failed to fetch policy' });
  }
});

/**
 * POST /api/v1/policies
 * Create a new custom policy
 */
router.post('/', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { tenantId, uid: userId } = req.user || {};
    const { basePolicyId, customizations } = req.body;

    if (!tenantId || !userId) {
      return res.status(400).json({ error: 'Authentication required' });
    }

    if (!basePolicyId || !customizations) {
      return res.status(400).json({ error: 'Base policy ID and customizations required' });
    }

    // Get base policy
    const basePolicyDoc = await db.collection('policies').doc(basePolicyId).get();
    if (!basePolicyDoc.exists) {
      return res.status(404).json({ error: 'Base policy not found' });
    }

    const basePolicy = basePolicyDoc.data() as PolicyData;

    // Create custom policy
    const customPolicy: PolicyData = {
      ...basePolicy,
      ...customizations,
      id: `custom-${tenantId}-${Date.now()}`,
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: userId,
        tenantId,
      },
    };

    // Save to Firestore
    await db.collection('policies').doc(customPolicy.id).set(customPolicy);

    // Create audit log
    await db.collection('auditLogs').add({
      userId,
      employerId: tenantId,
      action: 'policy_created',
      details: {
        policyId: customPolicy.id,
        basePolicyId,
        policyName: customPolicy.name,
      },
      timestamp: new Date(),
    });

    res.status(201).json({ policy: customPolicy });
  } catch (error) {
    console.error('Error creating policy:', error);
    res.status(500).json({ error: 'Failed to create policy' });
  }
});

/**
 * PUT /api/v1/policies/active
 * Set active policy for tenant
 */
router.put('/active', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { tenantId, uid: userId } = req.user || {};
    const { policyId, customizations } = req.body;

    if (!tenantId || !userId) {
      return res.status(400).json({ error: 'Authentication required' });
    }

    if (!policyId) {
      return res.status(400).json({ error: 'Policy ID required' });
    }

    // Verify policy exists
    const policyDoc = await db.collection('policies').doc(policyId).get();
    if (!policyDoc.exists) {
      return res.status(404).json({ error: 'Policy not found' });
    }

    // Get or create tenant configuration
    const configRef = db.collection('tenantPolicyConfigs').doc(tenantId);
    const configDoc = await configRef.get();

    const now = new Date();
    let config: TenantPolicyConfig;

    if (configDoc.exists) {
      const existingConfig = configDoc.data() as TenantPolicyConfig;
      // Deactivate previous policy
      if (existingConfig.policyHistory && existingConfig.policyHistory.length > 0) {
        const lastIndex = existingConfig.policyHistory.length - 1;
        existingConfig.policyHistory[lastIndex].deactivatedAt = now;
      }
      // Add new policy to history
      existingConfig.policyHistory.push({
        policyId,
        activatedAt: now,
      });
      config = {
        ...existingConfig,
        activePolicyId: policyId,
        customizations: customizations || null,
      };
    } else {
      config = {
        tenantId,
        activePolicyId: policyId,
        policyHistory: [
          {
            policyId,
            activatedAt: now,
          },
        ],
        customizations: customizations || null,
      };
    }

    // Save configuration
    await configRef.set(config);

    // Create audit log
    await db.collection('auditLogs').add({
      userId,
      employerId: tenantId,
      action: 'policy_activated',
      details: {
        policyId,
        policyName: (policyDoc.data() as PolicyData).name,
      },
      timestamp: now,
    });

    res.json({ success: true, config });
  } catch (error) {
    console.error('Error setting active policy:', error);
    res.status(500).json({ error: 'Failed to set active policy' });
  }
});

/**
 * GET /api/v1/policies/active
 * Get active policy for tenant
 */
router.get('/active/current', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { tenantId } = req.user || {};

    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID required' });
    }

    // Get tenant configuration
    const configDoc = await db
      .collection('tenantPolicyConfigs')
      .doc(tenantId)
      .get();

    if (!configDoc.exists) {
      return res.status(404).json({ error: 'No active policy found' });
    }

    const config = configDoc.data();
    const policyDoc = await db
      .collection('policies')
      .doc(config?.activePolicyId)
      .get();

    if (!policyDoc.exists) {
      return res.status(404).json({ error: 'Active policy not found' });
    }

    res.json({
      policy: {
        id: policyDoc.id,
        ...policyDoc.data(),
      },
      config,
    });
  } catch (error) {
    console.error('Error fetching active policy:', error);
    res.status(500).json({ error: 'Failed to fetch active policy' });
  }
});

export default router;
