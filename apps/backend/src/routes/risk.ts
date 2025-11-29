/**
 * ESTA Score Predictive Risk Engine API Routes
 *
 * Provides REST endpoints for the ESTA audit risk prediction system.
 * Allows employers to calculate their risk score, view recommendations,
 * and track their risk over time.
 *
 * @module risk
 */

import { Router, Request, Response } from 'express';
import {
  calculateEmployerRiskScore,
  getRiskSummary,
  getScoreHistory,
  getActiveAlerts,
  acknowledgeAlert,
  resolveAlert,
  formatRiskMessage,
  clearScoreCache,
} from '../services/riskEngineService.js';
import type { RiskCalculationInput } from '@esta/shared-types';

export const riskRouter = Router();

// ============================================================================
// Risk Score Calculation Endpoints
// ============================================================================

/**
 * Calculate ESTA Score for an employer
 * POST /api/v1/risk/calculate
 *
 * @body RiskCalculationInput - Employer data for risk calculation
 * @returns ESTAScore with risk assessment and recommendations
 */
riskRouter.post('/calculate', (req: Request, res: Response) => {
  try {
    const input: RiskCalculationInput = req.body;

    // Validate required fields
    if (!input.tenantId || !input.employerId) {
      res.status(400).json({
        success: false,
        error: 'tenantId and employerId are required',
      });
      return;
    }

    // Ensure required arrays exist
    const sanitizedInput: RiskCalculationInput = {
      ...input,
      requests: (input.requests || []).map((r) => ({
        ...r,
        requestedAt: new Date(r.requestedAt),
        reviewedAt: r.reviewedAt ? new Date(r.reviewedAt) : undefined,
      })),
      accrualBalances: (input.accrualBalances || []).map((b) => ({
        ...b,
        lastUpdated: new Date(b.lastUpdated),
      })),
      complianceAlerts: (input.complianceAlerts || []).map((a) => ({
        ...a,
        createdAt: new Date(a.createdAt),
        resolvedAt: a.resolvedAt ? new Date(a.resolvedAt) : undefined,
      })),
      employeeCount: input.employeeCount || 0,
      employerSize: input.employerSize || 'large',
    };

    const forceRecalculate = req.query.force === 'true';
    const result = calculateEmployerRiskScore(sanitizedInput, forceRecalculate);

    res.json({
      success: true,
      score: {
        id: result.score.id,
        tenantId: result.score.tenantId,
        overallScore: result.score.overallScore,
        riskLevel: result.score.riskLevel,
        riskBracket: result.score.riskBracket,
        analysisPeriod: result.score.analysisPeriod,
        primaryRiskDrivers: result.score.primaryRiskDrivers,
        recommendations: result.score.recommendations,
        confidence: result.score.confidence,
        modelVersion: result.score.modelVersion,
        calculatedAt: result.score.calculatedAt,
        previousScore: result.score.previousScore,
      },
      factors: result.score.factors,
      alerts: result.alerts,
      fromCache: result.fromCache,
      message: formatRiskMessage(result.score),
    });
  } catch (error) {
    console.error('Risk calculation error:', error);
    res.status(500).json({
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to calculate risk score',
    });
  }
});

/**
 * Get risk summary for dashboard
 * GET /api/v1/risk/summary/:tenantId
 *
 * @param tenantId - Employer tenant ID
 * @returns Quick risk summary for dashboard display
 */
riskRouter.get('/summary/:tenantId', (req: Request, res: Response) => {
  try {
    const { tenantId } = req.params;

    if (!tenantId) {
      res.status(400).json({
        success: false,
        error: 'tenantId is required',
      });
      return;
    }

    const summary = getRiskSummary(tenantId);

    res.json({
      success: true,
      summary,
    });
  } catch (error) {
    console.error('Risk summary error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get risk summary',
    });
  }
});

/**
 * Get risk score history
 * GET /api/v1/risk/history/:tenantId
 *
 * @param tenantId - Employer tenant ID
 * @returns Historical risk scores and trend analysis
 */
riskRouter.get('/history/:tenantId', (req: Request, res: Response) => {
  try {
    const { tenantId } = req.params;

    if (!tenantId) {
      res.status(400).json({
        success: false,
        error: 'tenantId is required',
      });
      return;
    }

    const history = getScoreHistory(tenantId);

    if (!history) {
      res.json({
        success: true,
        history: null,
        message: 'No score history available for this employer',
      });
      return;
    }

    res.json({
      success: true,
      history,
    });
  } catch (error) {
    console.error('Risk history error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get risk history',
    });
  }
});

/**
 * Clear score cache for an employer
 * POST /api/v1/risk/cache/clear/:tenantId
 *
 * @param tenantId - Employer tenant ID
 * @returns Success confirmation
 */
riskRouter.post('/cache/clear/:tenantId', (req: Request, res: Response) => {
  try {
    const { tenantId } = req.params;

    if (!tenantId) {
      res.status(400).json({
        success: false,
        error: 'tenantId is required',
      });
      return;
    }

    clearScoreCache(tenantId);

    res.json({
      success: true,
      message: `Score cache cleared for tenant ${tenantId}`,
    });
  } catch (error) {
    console.error('Cache clear error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear score cache',
    });
  }
});

// ============================================================================
// Risk Alert Endpoints
// ============================================================================

/**
 * Get active risk alerts for an employer
 * GET /api/v1/risk/alerts/:tenantId
 *
 * @param tenantId - Employer tenant ID
 * @returns Active risk alerts
 */
riskRouter.get('/alerts/:tenantId', (req: Request, res: Response) => {
  try {
    const { tenantId } = req.params;

    if (!tenantId) {
      res.status(400).json({
        success: false,
        error: 'tenantId is required',
      });
      return;
    }

    const alerts = getActiveAlerts(tenantId);

    res.json({
      success: true,
      alerts,
      count: alerts.length,
    });
  } catch (error) {
    console.error('Get alerts error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get risk alerts',
    });
  }
});

/**
 * Acknowledge a risk alert
 * POST /api/v1/risk/alerts/:tenantId/:alertId/acknowledge
 *
 * @param tenantId - Employer tenant ID
 * @param alertId - Alert ID to acknowledge
 * @returns Updated alert
 */
riskRouter.post(
  '/alerts/:tenantId/:alertId/acknowledge',
  (req: Request, res: Response) => {
    try {
      const { tenantId, alertId } = req.params;

      if (!tenantId || !alertId) {
        res.status(400).json({
          success: false,
          error: 'tenantId and alertId are required',
        });
        return;
      }

      const alert = acknowledgeAlert(tenantId, alertId);

      if (!alert) {
        res.status(404).json({
          success: false,
          error: 'Alert not found',
        });
        return;
      }

      res.json({
        success: true,
        alert,
      });
    } catch (error) {
      console.error('Acknowledge alert error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to acknowledge alert',
      });
    }
  }
);

/**
 * Resolve a risk alert
 * POST /api/v1/risk/alerts/:tenantId/:alertId/resolve
 *
 * @param tenantId - Employer tenant ID
 * @param alertId - Alert ID to resolve
 * @returns Updated alert
 */
riskRouter.post(
  '/alerts/:tenantId/:alertId/resolve',
  (req: Request, res: Response) => {
    try {
      const { tenantId, alertId } = req.params;

      if (!tenantId || !alertId) {
        res.status(400).json({
          success: false,
          error: 'tenantId and alertId are required',
        });
        return;
      }

      const alert = resolveAlert(tenantId, alertId);

      if (!alert) {
        res.status(404).json({
          success: false,
          error: 'Alert not found',
        });
        return;
      }

      res.json({
        success: true,
        alert,
      });
    } catch (error) {
      console.error('Resolve alert error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to resolve alert',
      });
    }
  }
);

// ============================================================================
// Risk Factor Information Endpoints
// ============================================================================

/**
 * Get risk factor weights and thresholds
 * GET /api/v1/risk/factors/config
 *
 * @returns Risk factor configuration
 */
riskRouter.get('/factors/config', (_req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      config: {
        factors: [
          {
            category: 'denial_rate',
            weight: 0.25,
            description:
              'Sick time request denial rate - primary audit trigger indicator',
          },
          {
            category: 'accrual_patterns',
            weight: 0.15,
            description: 'Accrual calculation accuracy and patterns',
          },
          {
            category: 'usage_patterns',
            weight: 0.1,
            description: 'Request frequency and distribution patterns',
          },
          {
            category: 'documentation_compliance',
            weight: 0.15,
            description: 'Documentation completeness and timeliness',
          },
          {
            category: 'timeliness',
            weight: 0.1,
            description: 'Request approval response times',
          },
          {
            category: 'employee_complaints',
            weight: 0.1,
            description: 'Employee complaint and turnover rates',
          },
          {
            category: 'record_keeping',
            weight: 0.1,
            description: 'Record retention and audit trail completeness',
          },
          {
            category: 'policy_adherence',
            weight: 0.05,
            description: 'Policy violation and alert resolution rates',
          },
        ],
        riskLevels: {
          low: { threshold: 0, label: 'Low Risk', color: '#22c55e' },
          medium: { threshold: 25, label: 'Medium Risk', color: '#eab308' },
          high: { threshold: 50, label: 'High Risk', color: '#f97316' },
          critical: { threshold: 75, label: 'Critical Risk', color: '#ef4444' },
        },
        riskBrackets: [
          { percentile: 92, bracket: 'top 8%', triggerScore: 80 },
          { percentile: 85, bracket: 'top 15%', triggerScore: 65 },
          { percentile: 75, bracket: 'top 25%', triggerScore: 50 },
          { percentile: 50, bracket: 'above average', triggerScore: 35 },
          { percentile: 25, bracket: 'below average', triggerScore: 20 },
          { percentile: 10, bracket: 'low risk', triggerScore: 0 },
        ],
      },
    });
  } catch (error) {
    console.error('Get config error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get risk factor configuration',
    });
  }
});

/**
 * Get model information
 * GET /api/v1/risk/model/info
 *
 * @returns Model version and metadata
 */
riskRouter.get('/model/info', (_req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      model: {
        name: 'ESTA Score Predictive Risk Engine',
        version: '1.0.0',
        description:
          'Analyzes employer accrual patterns, denial rates, and compliance behaviors to predict ESTA audit risk',
        lastUpdated: '2025-01-01',
        features: [
          'Denial rate analysis with trend detection',
          'Accrual pattern anomaly detection',
          'Compliance alert correlation',
          'Risk bracket percentile comparison',
          'Actionable recommendation generation',
          'Historical trend analysis',
        ],
        mlCapabilities: {
          xgboostCompatible: true,
          featureCount: 24,
          trainingDataRequired:
            'Anonymized accrual patterns from multiple employers',
        },
      },
    });
  } catch (error) {
    console.error('Get model info error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get model information',
    });
  }
});
