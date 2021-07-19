'use strict';

const schema = require('../../const/schema/consultUom');

module.exports = app => {
    const mongoose = app.mongoose;
    const Schema = mongoose.Schema;

    const ConsultUomSchema = new Schema(schema, {versionKey: false});

    return mongoose.model('consultUom', ConsultUomSchema);
};
