'use strict';

const schema = require('../../const/schema/requestBlock');

module.exports = app => {
    const mongoose = app.mongoose;
    const Schema = mongoose.Schema;

    const RequestBlockSchema = new Schema(schema, {versionKey: false, minimize: false});

    return mongoose.model('requestBlock', RequestBlockSchema);
};