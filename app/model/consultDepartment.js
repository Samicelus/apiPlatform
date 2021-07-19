'use strict';

const schema = require('../../const/schema/consultDepartment');

module.exports = app => {
    const mongoose = app.mongoose;
    const Schema = mongoose.Schema;

    const ConsultDepartmentSchema = new Schema(schema, {versionKey: false});

    return mongoose.model('consultDepartment', ConsultDepartmentSchema);
};
