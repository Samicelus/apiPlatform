'use strict';

const schema = require('../../const/schema/apiTemplate');

module.exports = app => {
    const mongoose = app.mongoose;
    const Schema = mongoose.Schema;

    const ApiTemplateSchema = new Schema(schema, {versionKey: false, minimize: false});

    return mongoose.model('apiTemplate', ApiTemplateSchema);
};