'use strict';

const schema = require('../../const/schema/consultDiag');

module.exports = app => {
    const mongoose = app.mongoose;
    const Schema = mongoose.Schema;

    const ConsultDiagSchema = new Schema(schema, {versionKey: false});

    return mongoose.model('consultDiag', ConsultDiagSchema);
};
