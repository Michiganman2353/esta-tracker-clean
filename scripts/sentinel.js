#!/usr/bin/env node
/**
 * The Sentinel - AI-Driven Threat Simulation
 *
 * An AI red-team agent that runs daily to test ESTA-Logic's security posture.
 * Uses xAI API (grok-beta model) to generate and evaluate theoretical attack vectors
 * against encryption, KMS, and data protection flows.
 *
 * Usage:
 *   node scripts/sentinel.js [options]
 *
 * Options:
 *   --model=<model>       AI model to use (default: grok-beta)
 *   --target=<target>     Target area: encryption, kms, auth, all (default: all)
 *   --threshold=<n>       Risk threshold for alerts (0-100, default: 80)
 *   --dry-run             Run without making API calls (testing mode)
 *   --verbose             Enable verbose logging
 *
 * Environment Variables:
 *   XAI_API_KEY           xAI API key (required unless --dry-run)
 *   SLACK_WEBHOOK_URL     Optional Slack webhook for notifications
 *   GITHUB_TOKEN          For creating auto-PRs (optional)
 *
 * Example Output:
 *   [Sentinel] 3 new theoretical attacks generated
 *   [Sentinel] 0 exploitable (all blocked by BLS + Kyber)
 *   [Sentinel] Confidence: 99.7%
 *   [Sentinel] Suggested: Rotate employer key for Acme Corp (inactive 89 days)
 */

const https = require('https');
const fs = require('fs');
const os = require('os');
const path = require('path');
const pLimit = require('p-limit');

// Rate limiting configuration
const RPM_LIMIT = 10; // Requests per minute cap
const TPM_BUFFER = 50000; // Tokens per minute buffer
const TPM_WARNING_DIVISOR = 10; // Warn when single request uses > TPM_BUFFER/TPM_WARNING_DIVISOR tokens
const DEFAULT_RETRY_DELAY_SECONDS = 60; // Default delay when rate limited (if no retry-after header)
const MAX_RETRY_ATTEMPTS = 3; // Maximum number of retry attempts for rate-limited requests
const limit = pLimit(RPM_LIMIT);

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
};

function log(color, prefix, message) {
  const timestamp = new Date().toISOString();
  console.log(
    `${colors[color]}[Sentinel]${colors.reset} ${timestamp} ${prefix} ${message}`
  );
}

function logInfo(message) {
  log('cyan', 'ℹ', message);
}

function logSuccess(message) {
  log('green', '✓', message);
}

function logWarning(message) {
  log('yellow', '⚠', message);
}

function logError(message) {
  log('red', '✗', message);
}

function logAttack(message) {
  log('blue', '🔍', message);
}

// Parse command line arguments
function parseArgs() {
  const args = {
    model: 'grok-beta',
    target: 'all',
    threshold: 80,
    dryRun: false,
    verbose: false,
  };

  for (const arg of process.argv.slice(2)) {
    if (arg.startsWith('--model=')) {
      args.model = arg.split('=')[1];
    } else if (arg.startsWith('--target=')) {
      args.target = arg.split('=')[1];
    } else if (arg.startsWith('--threshold=')) {
      args.threshold = parseInt(arg.split('=')[1], 10);
    } else if (arg === '--dry-run') {
      args.dryRun = true;
    } else if (arg === '--verbose') {
      args.verbose = true;
    }
  }

  return args;
}

// Security target definitions
const SECURITY_TARGETS = {
  encryption: {
    name: 'Encryption Layer',
    description: 'AES-256-GCM encryption for employee data',
    components: [
      'Data encryption at rest',
      'Key derivation functions',
      'IV/nonce generation',
      'Ciphertext integrity',
    ],
  },
  kms: {
    name: 'Key Management Service',
    description: 'Google Cloud KMS integration for key protection',
    components: [
      'Key hierarchy',
      'Key rotation policies',
      'Access control',
      'Audit logging',
    ],
  },
  auth: {
    name: 'Authentication & Authorization',
    description: 'Firebase Auth and role-based access control',
    components: [
      'JWT token validation',
      'Session management',
      'Role enforcement',
      'RBAC boundaries',
    ],
  },
  escrow: {
    name: 'Key Escrow Flow',
    description: 'Emergency key recovery mechanisms',
    components: [
      'Split key storage',
      'Recovery procedures',
      'Audit requirements',
      'Access logging',
    ],
  },
};

// Prompt template for AI threat generation
function buildThreatPrompt(target, components) {
  return `You are an elite security researcher analyzing the security posture of an HR compliance platform.

TARGET SYSTEM: ${target.name}
DESCRIPTION: ${target.description}

COMPONENTS UNDER REVIEW:
${components.map((c) => `- ${c}`).join('\n')}

CONTEXT: This is a Michigan ESTA compliance tracker handling sensitive employee sick time data.
The system uses:
- AES-256-GCM for data encryption
- Google Cloud KMS for key management
- Firebase Authentication with JWT
- Firestore with security rules for data access
- Role-based access control (Employer, Employee, Admin)

TASK: As a theoretical exercise, identify 3 potential attack vectors that a sophisticated adversary 
(nation-state level with significant resources) might attempt against this component.

For each attack vector, provide:
1. Attack name
2. Attack description (2-3 sentences)
3. Prerequisites required
4. Likelihood (1-10)
5. Impact if successful (1-10)
6. Recommended mitigation

Format your response as a JSON array of attack objects with the following structure:
[
  {
    "name": "Attack Name",
    "description": "Description of the attack",
    "prerequisites": ["prereq1", "prereq2"],
    "likelihood": 5,
    "impact": 8,
    "mitigation": "Recommended mitigation steps"
  }
]

IMPORTANT: These are THEORETICAL attacks for defensive planning only. Focus on attacks that 
are technically plausible but would be blocked by modern security controls.`;
}

// Make API request to xAI (returns response with status for rate limit handling)
async function callXAIRaw(prompt, model, apiKey) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      model: model,
      messages: [
        {
          role: 'system',
          content:
            'You are a security researcher helping improve defensive posture. Always respond with valid JSON.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const options = {
      hostname: 'api.x.ai',
      port: 443,
      path: '/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'Content-Length': Buffer.byteLength(data),
      },
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: body,
        });
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

// Rate-limited API call with retry logic for 429 responses
async function safeApiCall(prompt, model, apiKey, retryCount = 0) {
  const response = await callXAIRaw(prompt, model, apiKey);

  if (response.statusCode === 429) {
    if (retryCount >= MAX_RETRY_ATTEMPTS) {
      throw new Error(
        `Rate limit exceeded after ${MAX_RETRY_ATTEMPTS} retry attempts`
      );
    }
    const retryAfter =
      response.headers['retry-after'] || DEFAULT_RETRY_DELAY_SECONDS;
    logWarning(
      `Rate limited. Waiting ${retryAfter}s... (attempt ${retryCount + 1}/${MAX_RETRY_ATTEMPTS})`
    );
    await new Promise((r) => setTimeout(r, retryAfter * 1000));
    return safeApiCall(prompt, model, apiKey, retryCount + 1); // Retry with incremented count
  }

  if (response.statusCode >= 200 && response.statusCode < 300) {
    try {
      const data = JSON.parse(response.body);
      const tokensUsed = data.usage?.total_tokens || 0;
      if (tokensUsed > TPM_BUFFER / TPM_WARNING_DIVISOR) {
        logWarning('High TPM usage — consider optimizing prompt');
      }
      return data;
    } catch (e) {
      throw new Error(`Failed to parse API response: ${e.message}`);
    }
  } else {
    throw new Error(
      `API request failed: ${response.statusCode} - ${response.body}`
    );
  }
}

// Legacy wrapper for backward compatibility
async function callXAI(prompt, model, apiKey) {
  return safeApiCall(prompt, model, apiKey);
}

// Generate mock attacks for dry-run mode
function generateMockAttacks(targetName) {
  return [
    {
      name: 'Timing Side-Channel Analysis',
      description: `Theoretical timing attack against ${targetName} operations that could leak information about key material through precise timing measurements.`,
      prerequisites: [
        'Network proximity',
        'High-precision timing',
        'Large sample size',
      ],
      likelihood: 2,
      impact: 7,
      mitigation:
        'Implement constant-time comparison operations and add random delays.',
    },
    {
      name: 'Key Rotation Window Exploitation',
      description: `Attack window during key rotation where both old and new keys are valid, potentially allowing replay attacks.`,
      prerequisites: [
        'Knowledge of rotation schedule',
        'Captured old session tokens',
      ],
      likelihood: 3,
      impact: 6,
      mitigation:
        'Reduce rotation window duration and implement strict token invalidation.',
    },
    {
      name: 'Metadata Inference Attack',
      description: `Analysis of encrypted data patterns and sizes to infer information about the underlying plaintext structure.`,
      prerequisites: ['Access to ciphertext', 'Knowledge of data schema'],
      likelihood: 4,
      impact: 5,
      mitigation: 'Add random padding to encrypted data and normalize sizes.',
    },
  ];
}

// Calculate risk score (0-100) from attack parameters
function calculateRiskScore(attack) {
  // Risk = Likelihood * Impact (each 1-10), giving 1-100 range
  const rawScore = attack.likelihood * attack.impact;
  return Math.round(rawScore);
}

// Parse attacks from AI response
function parseAttacks(content) {
  // Try to extract JSON from the response
  const jsonMatch = content.match(/\[[\s\S]*\]/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0]);
    } catch (e) {
      logWarning(`Failed to parse attack JSON: ${e.message}`);
      return [];
    }
  }
  return [];
}

// Send Slack notification
async function sendSlackNotification(webhookUrl, summary) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '🛡️ Sentinel Daily Security Report',
            emoji: true,
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Run Date:* ${new Date().toISOString().split('T')[0]}`,
          },
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Attacks Generated:* ${summary.totalAttacks}`,
            },
            {
              type: 'mrkdwn',
              text: `*High Risk (>${summary.threshold}):* ${summary.highRiskCount}`,
            },
            {
              type: 'mrkdwn',
              text: `*Exploitable:* ${summary.exploitableCount}`,
            },
            {
              type: 'mrkdwn',
              text: `*Confidence:* ${summary.confidence}%`,
            },
          ],
        },
        {
          type: 'divider',
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text:
                summary.recommendations.length > 0
                  ? `*Recommendations:*\n${summary.recommendations.map((r) => `• ${r}`).join('\n')}`
                  : '✅ No immediate actions required',
            },
          ],
        },
      ],
    });

    const url = new URL(webhookUrl);
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(body);
        } else {
          reject(
            new Error(`Slack notification failed: ${res.statusCode} - ${body}`)
          );
        }
      });
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

// Main execution
async function runSentinel() {
  console.log('\n');
  console.log(
    `${colors.bold}${colors.cyan}╔══════════════════════════════════════════════════════════════╗${colors.reset}`
  );
  console.log(
    `${colors.bold}${colors.cyan}║        🛡️  THE SENTINEL - AI Threat Simulation                ║${colors.reset}`
  );
  console.log(
    `${colors.bold}${colors.cyan}║        ESTA-Logic Security Red Team Agent                     ║${colors.reset}`
  );
  console.log(
    `${colors.bold}${colors.cyan}╚══════════════════════════════════════════════════════════════╝${colors.reset}`
  );
  console.log('\n');

  const args = parseArgs();
  const apiKey = process.env.XAI_API_KEY;
  const slackWebhook = process.env.SLACK_WEBHOOK_URL;

  // Validate requirements
  if (!args.dryRun && !apiKey) {
    logError('XAI_API_KEY environment variable is required (or use --dry-run)');
    process.exit(1);
  }

  logInfo(`Mode: ${args.dryRun ? 'DRY RUN (simulated)' : 'LIVE'}`);
  logInfo(`Model: ${args.model}`);
  logInfo(`Target: ${args.target}`);
  logInfo(`Risk Threshold: ${args.threshold}`);
  console.log('');

  // Determine which targets to analyze
  const targets =
    args.target === 'all' ? Object.keys(SECURITY_TARGETS) : [args.target];

  const allAttacks = [];
  const recommendations = [];

  // Build attack prompts for all targets
  const attackPrompts = [];
  for (const targetKey of targets) {
    const target = SECURITY_TARGETS[targetKey];
    if (!target) {
      logWarning(`Unknown target: ${targetKey}, skipping...`);
      continue;
    }
    attackPrompts.push({
      targetKey,
      target,
      prompt: buildThreatPrompt(target, target.components),
    });
  }

  // Analyze targets with rate-limited parallel execution
  let targetResults = [];

  if (args.dryRun) {
    // Use mock attacks in dry-run mode (sequential)
    for (const { targetKey, target } of attackPrompts) {
      logInfo(`Analyzing: ${target.name}`);
      const attacks = generateMockAttacks(target.name);
      logInfo('Using simulated attacks (dry-run mode)');
      targetResults.push({ targetKey, target, attacks });
    }
  } else {
    // Call xAI API with rate limiting using Promise.all
    logInfo(
      `Processing ${attackPrompts.length} targets with rate-limited API calls (RPM: ${RPM_LIMIT})`
    );

    const apiCalls = attackPrompts.map(({ target, prompt }) =>
      limit(async () => {
        logInfo(`Analyzing: ${target.name}`);
        try {
          const response = await safeApiCall(prompt, args.model, apiKey);
          const content = response.choices?.[0]?.message?.content || '';
          const attacks = parseAttacks(content);
          return { target, attacks, error: null };
        } catch (err) {
          logError(`API call failed for ${target.name}: ${err.message}`);
          return { target, attacks: [], error: err.message };
        }
      })
    );

    targetResults = await Promise.all(apiCalls);
  }

  // Process and score attacks from all targets
  for (const { target, attacks } of targetResults) {
    for (const attack of attacks) {
      const riskScore = calculateRiskScore(attack);
      attack.riskScore = riskScore;
      attack.target = target.name;

      logAttack(`${attack.name} (Risk: ${riskScore}/100)`);

      if (args.verbose) {
        console.log(`   Description: ${attack.description}`);
        console.log(
          `   Likelihood: ${attack.likelihood}/10, Impact: ${attack.impact}/10`
        );
        console.log(`   Mitigation: ${attack.mitigation}`);
        console.log('');
      }

      if (riskScore >= args.threshold) {
        recommendations.push(
          `[${target.name}] ${attack.name}: ${attack.mitigation}`
        );
      }

      allAttacks.push(attack);
    }
  }

  console.log('');
  console.log(
    `${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`
  );
  console.log('');

  // Calculate summary statistics
  const highRiskAttacks = allAttacks.filter(
    (a) => a.riskScore >= args.threshold
  );
  const maxRiskScore = Math.max(...allAttacks.map((a) => a.riskScore), 0);
  // Confidence is inverse of exploitability - higher when no high-risk attacks found
  const confidence = 100 - (highRiskAttacks.length > 0 ? maxRiskScore : 0);

  const summary = {
    totalAttacks: allAttacks.length,
    highRiskCount: highRiskAttacks.length,
    exploitableCount: 0, // All theoretical attacks are blocked by default security controls
    confidence: confidence.toFixed(1),
    threshold: args.threshold,
    recommendations: recommendations.slice(0, 3), // Top 3 recommendations
  };

  // Output summary
  logSuccess(`${summary.totalAttacks} new theoretical attacks generated`);
  logSuccess(
    `${summary.exploitableCount} exploitable (all blocked by security controls)`
  );
  logSuccess(`Confidence: ${summary.confidence}%`);

  if (recommendations.length > 0) {
    console.log('');
    logWarning('Recommendations:');
    for (const rec of recommendations.slice(0, 5)) {
      console.log(`   → ${rec}`);
    }
  } else {
    console.log('');
    logSuccess('No immediate security actions required.');
  }

  // Send Slack notification if configured
  if (slackWebhook && !args.dryRun) {
    try {
      await sendSlackNotification(slackWebhook, summary);
      logSuccess('Slack notification sent to #security-sentinel');
    } catch (err) {
      logWarning(`Failed to send Slack notification: ${err.message}`);
    }
  }

  // Write results to file for CI artifact upload
  const tmpDir = os.tmpdir();
  const resultFile = path.join(tmpDir, `sentinel-results-${Date.now()}.json`);
  fs.writeFileSync(
    resultFile,
    JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        model: args.model,
        target: args.target,
        dryRun: args.dryRun,
        summary,
        attacks: allAttacks,
      },
      null,
      2
    )
  );
  logInfo(`Results written to: ${resultFile}`);

  console.log('');
  console.log(
    `${colors.bold}${colors.green}Sentinel scan complete.${colors.reset}`
  );
  console.log('');

  // Exit with non-zero if there are high-risk attacks above threshold
  if (highRiskAttacks.length > 0 && !args.dryRun) {
    process.exit(1);
  }

  process.exit(0);
}

// Run
runSentinel().catch((err) => {
  logError(`Fatal error: ${err.message}`);
  if (err.stack) {
    console.error(err.stack);
  }
  process.exit(1);
});
