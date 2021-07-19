'use strict';

const schema = require('../../const/schema/apiTemplateItem');

module.exports = app => {
    const mongoose = app.mongoose;
    const Schema = mongoose.Schema;

    const ApiTemplateItemSchema = new Schema(schema, {versionKey: false, minimize: false});

    return mongoose.model('apiTemplateItem', ApiTemplateItemSchema);
};