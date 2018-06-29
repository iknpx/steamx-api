const uuid = require('shortid');
const mongoose = require('../libs/mongoose');

const appSchema = new mongoose.Schema({
    appid: {
        default: uuid.generate,
        indenx: true,
        type: String,
        unique: true,
    },
    name: String,
    multiplayer: Boolean,
    empty: {
        type: Boolean,
        default: true,
    },
    description: String,
    image: String,
    score: Number,
    bg: String,
    date: String,
}, { timestamps: true, id: false });

module.exports = mongoose.model('apps', appSchema);
