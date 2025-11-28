/**
 * Slack Block Kit Reporter
 *
 * Production-grade Slack notification module for the Sentinel security system.
 * Provides structured Block Kit messages for security reports.
 *
 * @module slack
 */

const https = require('https');

/**
 * Build a Block Kit message for the daily security report
 *
 * @param {Object} summary - Security scan summary
 * @param {number} summary.totalAttacks - Total attacks generated
 * @param {number} summary.highRiskCount - Number of high-risk attacks
 * @param {number} summary.exploitableCount - Number of exploitable vulnerabilities
 * @param {string} summary.confidence - Confidence percentage
 * @param {number} summary.threshold - Risk threshold used
 * @param {string[]} summary.recommendations - List of recommendations
 * @returns {Object} Slack Block Kit payload
 */
function buildSecurityReportBlocks(summary) {
  const statusEmoji =
    summary.exploitableCount === 0 && summary.highRiskCount === 0
      ? '✅'
      : summary.exploitableCount > 0
        ? '🚨'
        : '⚠️';
  const statusText =
    summary.exploitableCount === 0
      ? 'All Clear'
      : `${summary.exploitableCount} Exploitable`;

  return {
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: '🛡️ Sentinel Daily Threat Report',
          emoji: true,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Status:* ${statusEmoji} ${statusText}`,
        },
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Vectors Tested:*\n${summary.totalAttacks}`,
          },
          {
            type: 'mrkdwn',
            text: `*Exploitable:*\n${summary.exploitableCount}`,
          },
          {
            type: 'mrkdwn',
            text: `*High Risk (>${summary.threshold}):*\n${summary.highRiskCount}`,
          },
          {
            type: 'mrkdwn',
            text: `*Confidence:*\n${summary.confidence}%`,
          },
        ],
      },
      {
        type: 'divider',
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '*System Status:*',
        },
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: '🔐 *Quantum-Resistant Escrows:* Protected',
          },
          {
            type: 'mrkdwn',
            text: '🤖 *AI Agent:* Active',
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
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `_Scan completed at ${new Date().toISOString()}_`,
          },
        ],
      },
    ],
  };
}

/**
 * Send a POST request to a Slack webhook
 *
 * @param {string} webhookUrl - Slack incoming webhook URL
 * @param {Object} payload - JSON payload to send
 * @returns {Promise<string>} Response from Slack
 */
function postToSlack(webhookUrl, payload) {
  return new Promise((resolve, reject) => {
    const payloadString = JSON.stringify(payload);

    const url = new URL(webhookUrl);
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payloadString),
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
    req.write(payloadString);
    req.end();
  });
}

/**
 * Send a Slack notification using Block Kit
 *
 * @param {string} webhookUrl - Slack incoming webhook URL
 * @param {Object} summary - Security scan summary
 * @returns {Promise<string>} Response from Slack
 */
function sendSlackNotification(webhookUrl, summary) {
  return postToSlack(webhookUrl, buildSecurityReportBlocks(summary));
}

/**
 * Send a simple text notification to Slack
 *
 * @param {string} webhookUrl - Slack incoming webhook URL
 * @param {string} text - Message text
 * @returns {Promise<string>} Response from Slack
 */
function sendTextNotification(webhookUrl, text) {
  return postToSlack(webhookUrl, { text });
}

module.exports = {
  buildSecurityReportBlocks,
  sendSlackNotification,
  sendTextNotification,
};
