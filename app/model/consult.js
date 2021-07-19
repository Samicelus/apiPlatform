'use strict';

const schema = require('../../const/schema/consult');

module.exports = app => {
    const mongoose = app.mongoose;
    const Schema = mongoose.Schema;

    const ConsultSchema = new Schema(schema, {versionKey: false});

    return mongoose.model('consult', ConsultSchema);
};
