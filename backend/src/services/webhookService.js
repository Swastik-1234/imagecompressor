const axios = require('axios');
const connection = require('../config/database');

class WebhookService {
  static async create(requestId, webhookUrl) {
    return new Promise((resolve, reject) => {
      connection.query(
        'INSERT INTO webhooks (request_id, webhook_url) VALUES (?, ?)',
        [requestId, webhookUrl],
        (err, result) => {
          if (err) reject(err);
          else resolve(result);
        }
      );
    });
  }

  static async trigger(requestId, data) {
    try {
      // Get webhook URL from database
      const [rows] = await new Promise((resolve, reject) => {
        connection.query(
          'SELECT webhook_url FROM webhooks WHERE request_id = ?',
          [requestId],
          (err, rows) => {
            if (err) reject(err);
            else resolve([rows, null]);
          }
        );
      });

      if (rows && rows.length > 0 && rows[0].webhook_url) {
        await axios.post(rows[0].webhook_url, {
          requestId,
          status: 'completed',
          processedAt: new Date(),
          data
        });
      }
    } catch (error) {
      console.error('Webhook trigger failed:', error);
    }
  }
}

module.exports = WebhookService;