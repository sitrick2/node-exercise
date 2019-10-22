const mongoose = require('mongoose');
const winston = require('winston');
const config = require('config');

module.exports = function () {
    const options = {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useFindAndModify: false,
        useCreateIndex: true
    };

    const db = config.get('db');
    mongoose.connect(db, options)
        .then(() => winston.info(`Connected to ${ db }...`));
};