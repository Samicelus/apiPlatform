'use strict';

const schema = require('../../const/schema/sender');

module.exports = app => {
    const mongoose = app.mongoose;
    const Schema = mongoose.Schema;

    const SenderSchema = new Schema(schema, {versionKey: false});

    return mongoose.model('sender', SenderSchema);
};
