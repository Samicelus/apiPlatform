'use strict';

const schema = require('../../const/schema/callbackConfig');

module.exports = app => {
    const mongoose = app.mongoose;
    const Schema = mongoose.Schema;

    const callbackConfigSchema = new Schema(schema, {versionKey: false, minimize: false});

    callbackConfigSchema.post('validate', function(doc){
        doc.created = new Date();
        doc.updated = new Date();
    })

    return mongoose.model('callbackConfig', callbackConfigSchema);
};