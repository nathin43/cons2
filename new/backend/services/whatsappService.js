/**
 * WhatsApp Notification Service — UltraMsg API
 *
 * Provider: https://ultramsg.com
 * Set the following in your .env:
 *   ULTRAMSG_INSTANCE_ID=your_instance_id
 *   ULTRAMSG_TOKEN=your_token
 *
 * Phone numbers must be stored in E.164 format, e.g. +919876543210
 */

const https = require('https');
const querystring = require('querystring');

/**
 * Normalise a raw phone string to E.164 (+91XXXXXXXXXX for India).
 * Strips all non-digit characters, then prepends country code if missing.
 */
function normalisePhone(raw) {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, '');
  // Already has country code (≥ 12 digits for India)
  if (digits.length >= 12) return `+${digits}`;
  // 10-digit Indian mobile number — prepend +91
  if (digits.length === 10) return `+91${digits}`;
  return `+${digits}`;
}

/**
 * Send a WhatsApp message via the UltraMsg REST API.
 *
 * @param {string} to    - Recipient phone number (any common format)
 * @param {string} body  - Plain-text message body
 * @returns {Promise<void>}
 */
async function sendWhatsAppMessage(to, body) {
  const instanceId = process.env.ULTRAMSG_INSTANCE_ID;
  const token = process.env.ULTRAMSG_TOKEN;

  if (!instanceId || !token) {
    console.warn('[WhatsApp] ULTRAMSG_INSTANCE_ID or ULTRAMSG_TOKEN not configured — skipping send.');
    return;
  }

  const phone = normalisePhone(to);
  if (!phone) {
    console.warn('[WhatsApp] No phone number available — skipping send.');
    return;
  }

  const payload = querystring.stringify({ token, to: phone, body });

  return new Promise((resolve, reject) => {
    const options = {
      method: 'POST',
      hostname: 'api.ultramsg.com',
      path: `/${instanceId}/messages/chat`,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(payload),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.sent === 'true' || parsed.sent === true) {
            console.log(`[WhatsApp] Message sent to ${phone}`);
            resolve(parsed);
          } else {
            console.error('[WhatsApp] Send failed:', data);
            resolve(); // non-fatal — don't throw
          }
        } catch {
          console.error('[WhatsApp] Response parse error:', data);
          resolve(); // non-fatal
        }
      });
    });

    req.on('error', (err) => {
      console.error('[WhatsApp] Request error (non-fatal):', err.message);
      resolve(); // non-fatal — order flow must not break
    });

    req.write(payload);
    req.end();
  });
}

/**
 * Notify user their order was cancelled.
 */
async function notifyOrderCancelled(phone, { userName, orderNumber }) {
  const message =
    `Hello ${userName},\n\n` +
    `Your order *#${orderNumber}* has been cancelled successfully.\n\n` +
    `Refund will be processed within *5–7 business days* to your original payment method.\n\n` +
    `Thank you for shopping with *Mani Electricals*. 🙏`;

  return sendWhatsAppMessage(phone, message);
}

module.exports = { sendWhatsAppMessage, notifyOrderCancelled };
