'use strict';

const schema = require('../../const/schema/consultPatient');

module.exports = app => {
    const mongoose = app.mongoose;
    const Schema = mongoose.Schema;

    const ConsultPatientSchema = new Schema(schema, {versionKey: false});

    let birth = ConsultPatientSchema.virtual('birth');
    birth.get(function(){
        return this.profile.indentityCard.slice(6,14);
    });
    let sex = ConsultPatientSchema.virtual('sex');
    sex.get(function(){
        return (this.profile.indentityCard.slice(16,16)[0]%2 == 0)?"女":"男";
    })

    return mongoose.model('consultPatient', ConsultPatientSchema);
};