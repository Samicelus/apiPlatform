'use strict';

const schema = require('../../const/schema/consultInstr');

module.exports = app => {
    const mongoose = app.mongoose;
    const Schema = mongoose.Schema;

    const ConsultInstrSchema = new Schema(schema, {versionKey: false});

    return mongoose.model('consultInstr', ConsultInstrSchema);
};
