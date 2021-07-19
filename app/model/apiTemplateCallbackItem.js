'use strict';

const schema = require('../../const/schema/apiTemplateCallbackItem');

module.exports = app => {
    const mongoose = app.mongoose;
    const Schema = mongoose.Schema;

    const ApiTemplateCallbackItemSchema = new Schema(schema, {versionKey: false, minimize: false});

    ApiTemplateCallbackItemSchema.post('validate', function(doc){
        doc.created = new Date();
        doc.updated = new Date();
    })

    return mongoose.model('apiTemplateCallbackItem', ApiTemplateCallbackItemSchema);
};