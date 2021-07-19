'use strict';

const schema = require('../../const/schema/consultInspection');

module.exports = app => {
    const mongoose = app.mongoose;
    const Schema = mongoose.Schema;

    const consultInspecSchema = new Schema(schema, {versionKey: false});

    consultInspecSchema.pre(/update/, async function(){
        this._update["$set"].uniqKey = 
        `${this._update["$set"].company_oid}:${this._update["$set"].branchCode}:${this._update["$set"].hisInspection}`;
    })

    return mongoose.model('consultInspection', consultInspecSchema);
};
