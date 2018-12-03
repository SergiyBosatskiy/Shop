const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const itemSchema = new Schema({
    title: String,
    seo: String,
    price: { current: Number, old: Number, action: Number },
    description: String,
    about: String,
    date: { type: Date, default: Date.now },
    image: []
});

const Items = mongoose.model('Items', itemSchema);
module.exports = Items;