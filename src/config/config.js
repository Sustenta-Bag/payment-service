const dotenv = require('dotenv');
dotenv.config();

module.exports = {
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 3001,
  mongodb: {
    uri: process.env.MONGODB_URI
  },  rabbitmq: {
    url: process.env.RABBITMQ_URL,
    queues: {
      paymentRequests: 'payment_requests',
      paymentResults: 'payment_results'
    },
    exchanges: {
      payments: 'payments_exchange',
      notifications: 'process_notification_exchange'
    }
  },
  mercadopago: {
    accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
    webhookUrl: process.env.MERCADOPAGO_WEBHOOK_URL
  }
};