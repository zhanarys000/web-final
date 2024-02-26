const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    names: [{
        language: String,
        name: String
    }],
    descriptions: [{
        language: String,
        description: String
    }],
    category: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    colors: {
        type: String,
        required: true
    },
    sizes: {
        type: String,
        required: true
    },
    images: {
        type: [String],
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    deletedAt: {
        type: Date
    }
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
