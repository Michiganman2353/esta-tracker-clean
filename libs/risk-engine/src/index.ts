/**
 * ESTA Score Predictive Risk Engine
 *
 * A predictive risk assessment engine for Michigan ESTA compliance.
 * Analyzes employer accrual patterns, denial rates, and compliance behaviors
 * to predict audit risk and provide preventive recommendations.
 *
 * Key features:
 * - Feature extraction for XGBoost-compatible model training
 * - Weighted risk scoring across multiple compliance factors
 * - Risk bracket percentile comparison
 * - Actionable recommendations with impact estimates
 *
 * @example
 * ```typescript
 * import { extractRiskFeatures, calculateESTAScore } from '@esta-tracker/risk-engine';
 *
 * const features = extractRiskFeatures(employerData);
 * const score = calculateESTAScore(features);
 *
 * console.log(`Risk Level: ${score.riskLevel}`);
 * console.log(`Risk Bracket: ${score.riskBracket.description}`);
 * ```
 *
 * @module risk-engine
 */

// Feature extraction
export { extractRiskFeatures, validateFeatures } from './featureExtraction.js';

// Risk calculation
export {
  MODEL_VERSION,
  calculateRiskFactors,
  calculateOverallScore,
  determineRiskLevel,
  determineRiskBracket,
  identifyPrimaryRiskDrivers,
  generateRecommendations,
  calculateESTAScore,
} from './riskCalculator.js';
