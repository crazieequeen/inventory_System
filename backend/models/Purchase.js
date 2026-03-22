const mongoose = require('mongoose');

const purchaseSchema = new mongoose.Schema({
  products: [{
    productId: String,
    productName: String,
    quantity: Number
  }],
  supplier: {
    type: String,
    required: true
  },
  deliveryDate: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Purchase', purchaseSchema);
