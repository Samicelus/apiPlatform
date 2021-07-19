'use strict';

const schema = require('../../const/schema/apiConfigHistory');

module.exports = app => {
    const mongoose = app.mongoose;
    const Schema = mongoose.Schema;

    const ApiConfigHistorySchema = new Schema(schema, {versionKey: false, minimize: false});

    return mongoose.model('apiConfigHistory', ApiConfigHistorySchema);
};