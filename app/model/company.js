'use strict';

const schema = require('../../const/schema/company');

module.exports = app => {
    const mongoose = app.mongoose;
    const Schema = mongoose.Schema;

    const CompanySchema = new Schema(schema, {versionKey: false});

    return mongoose.model('company', CompanySchema);
};
