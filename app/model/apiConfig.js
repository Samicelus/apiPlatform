'use strict';

const schema = require('../../const/schema/apiConfig');

module.exports = app => {
    const mongoose = app.mongoose;
    const Schema = mongoose.Schema;

    const ApiConfigSchema = new Schema(schema, {versionKey: false, minimize: false});

    return mongoose.model('apiConfig', ApiConfigSchema);
};