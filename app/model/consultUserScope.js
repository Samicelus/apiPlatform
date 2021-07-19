'use strict';

const schema = require('../../const/schema/consultUserScope');

module.exports = app => {
    const mongoose = app.mongoose;
    const Schema = mongoose.Schema;

    const ConsultUserScopeSchema = new Schema(schema, {versionKey: false});

    return mongoose.model('consultUserScope', ConsultUserScopeSchema);
};