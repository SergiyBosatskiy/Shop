const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const catSchema = new Schema({
    mainCat: String,
    mainCatUrl: String,
    subCat: {}
});

const Cat = mongoose.model('Cat', catSchema);
module.exports = Cat;