'use strict';

const schema = require('../../const/schema/box');

module.exports = app => {
    const mongoose = app.mongoose;
    const Schema = mongoose.Schema;

    const BoxSchema = new Schema(schema, {versionKey: false, minimize: false});

    return mongoose.model('box', BoxSchema);
};