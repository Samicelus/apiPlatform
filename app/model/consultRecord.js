'use strict';
//const { STATUS_MAP } = require('../../const/model/record');

const schema = require('../../const/schema/consultRecord');

module.exports = app => {
    const mongoose = app.mongoose;
    const Schema = mongoose.Schema;

    const ConsultRecordSchema = new Schema(schema, {versionKey: false});

    return mongoose.model('consultRecord', ConsultRecordSchema);
};