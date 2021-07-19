'use strict';

const schema = require('../../const/schema/consultDuration');

module.exports = app => {
    const mongoose = app.mongoose;
    const Schema = mongoose.Schema;

    const ConsultDurationSchema = new Schema(schema, {versionKey: false});

    return mongoose.model('consultDuration', ConsultDurationSchema);
};