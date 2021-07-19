'use strict';

const schema = require('../../const/schema/consultForm');

module.exports = app => {
    const mongoose = app.mongoose;
    const Schema = mongoose.Schema;

    const ConsultFormSchema = new Schema(schema, {versionKey: false});

    return mongoose.model('consultForm', ConsultFormSchema);
};