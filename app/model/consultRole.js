'use strict';

const schema = require('../../const/schema/consultRole');

module.exports = app => {
    const mongoose = app.mongoose;
    const Schema = mongoose.Schema;

    const ConsultRoleSchema = new Schema(schema, {versionKey: false});

    return mongoose.model('consultRole', ConsultRoleSchema);
};