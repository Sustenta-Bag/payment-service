const dotenv = require('dotenv');
dotenv.config();

module.exports = {
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 3001,  mongodb: {
    uri: process.env.MONGODB_URI
  },  
  rabbitmq: {
    url: process.env.RABBITMQ_URL,
    queues: {
      paymentRequests: 'payment_requests',
      paymentResults: 'payment_results',
      notifications: 'process_notification'
    },
    exchanges: {
      payments: 'payments_exchange',
      notifications: 'process_notification_exchange'
    }
  },
  payment: {
    simulation: {
      callbackUrl: process.env.PAYMENT_SIMULATION_CALLBACK_URL || 'http://localhost:3001/api/payment-simulation',
      notificationUrl: process.env.PAYMENT_SIMULATION_NOTIFICATION_URL || 'http://localhost:3001/api/payments/webhook'
    }
  }
};