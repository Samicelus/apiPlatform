'use strict';
//const {SEND_STATE_MAP, DIAGNOSIS_TYPE_MAP} = require('../../const/model/advice');

const schema = require('../../const/schema/consultAdvice');

module.exports = app => {
    const mongoose = app.mongoose;
    const Schema = mongoose.Schema;

    const ConsultAdviceSchema = new Schema(schema, {versionKey: false});

    return mongoose.model('consultAdvice', ConsultAdviceSchema);
};