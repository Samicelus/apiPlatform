'use strict';

const schema = require('../../const/schema/dataBlock');

module.exports = app => {
    const mongoose = app.mongoose;
    const Schema = mongoose.Schema;

    const DataBlockSchema = new Schema(schema, {versionKey: false, minimize: false});

    return mongoose.model('dataBlock', DataBlockSchema);
};