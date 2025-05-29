const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
  orderId: { 
    type: String, 
    required: true, 
    unique: true 
  },
  userId: { 
    type: String, 
    required: true 
  },
  authToken: {
    type: String,
    required: false 
  },
  amount: { 
    type: Number, 
    required: true 
  },
  currency: { 
    type: String, 
    default: 'BRL' 
  },
  items: [{
    title: String,
    description: String,
    quantity: Number,
    unitPrice: Number
  }],
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected', 'cancelled', 'refunded'],
    default: 'pending'
  },
  paymentMethod: { 
    type: String,
    default: 'simulation'
  },
  paymentId: { 
    type: String 
  },
  paymentUrl: { 
    type: String 
  },
  metadata: { 
    type: Object 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date 
  }
});

const Payment = mongoose.model('Payment', PaymentSchema);
module.exports = Payment;