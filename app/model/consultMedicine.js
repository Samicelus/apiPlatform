'use strict';

const schema = require('../../const/schema/consultMedicine');

module.exports = app => {
    const mongoose = app.mongoose;
    const Schema = mongoose.Schema;

    const consultMedicinSchema = new Schema(schema, {versionKey: false});

    consultMedicinSchema.pre(/update/, async function(){
        this._update["$set"].uniqKey = 
        `${this._update["$set"].company_oid}:${this._update["$set"].branchCode}:${this._update["$set"].hisMedicine}`;
    })

    return mongoose.model('consultMedicine', consultMedicinSchema);
};
