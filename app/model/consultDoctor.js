'use strict';
//const {DOCTOR_PROPERTY_MAP, TEXT_PUSH_TYPE_MAP, CA_STATE_MAP} = require('../../const/model/doctor');

const schema = require('../../const/schema/consultDoctor');

module.exports = app => {
    const mongoose = app.mongoose;
    const Schema = mongoose.Schema;

    const ConsultDoctorSchema = new Schema(schema, {versionKey: false});

    return mongoose.model('consultDoctor', ConsultDoctorSchema);
};