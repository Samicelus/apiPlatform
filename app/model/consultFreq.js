'use strict';

const schema = require('../../const/schema/consultFreq');

module.exports = app => {
    const mongoose = app.mongoose;
    const Schema = mongoose.Schema;

    const ConsultFreqSchema = new Schema(schema, {versionKey: false});

    return mongoose.model('consultFreq', ConsultFreqSchema);
};