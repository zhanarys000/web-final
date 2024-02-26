const mongoose = require('mongoose');

const otherSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Users',
    required: true
  },
  title: {
    type: String,
    required: true
},
price: {
    type: Number,
    required: true
},
description: {
    type: String,
    required: true
},
category: {
    type: String,
    required: true
},
image: {
    type: String,
    required: true
},
rating: {
    rate: {
        type: Number,
        required: true
    },
    count: {
        type: Number,
        required: true
    }
}
});


module.exports =  mongoose.model('Other', otherSchema);;