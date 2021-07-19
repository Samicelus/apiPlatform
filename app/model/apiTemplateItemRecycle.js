'use strict';

const schema = require('../../const/schema/apiTemplateItemRecycle');

module.exports = app => {
    const mongoose = app.mongoose;
    const Schema = mongoose.Schema;

    const ApiTemplateItemRecycleSchema = new Schema(schema, {versionKey: false, minimize: false});

    return mongoose.model('apiTemplateItemRecycle', ApiTemplateItemRecycleSchema);
};