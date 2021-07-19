'use strict';

const schema = require('../../const/schema/consultUser');

module.exports = app => {
    const mongoose = app.mongoose;
    const Schema = mongoose.Schema;

    const ConsultUserSchema = new Schema(schema, {versionKey: false});

    return mongoose.model('consultUser', ConsultUserSchema);
};