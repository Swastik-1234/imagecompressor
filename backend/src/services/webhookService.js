const axios = require('axios');
const pool = require('../config/database');

class WebhookService {
  static async notify(requestId) {
    try {
      const [request] = await pool.execute(
        'SELECT webhook_url FROM processing_requests WHERE id = ?',
        [requestId]
      );

      if (request[0]?.webhook_url) {
        await axios.post(request[0].webhook_url, {
          requestId,
          status: 'completed',
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Webhook notification failed:', error);
    }
  }
}

module.exports = WebhookService; 