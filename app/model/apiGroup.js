'use strict';

const schema = require('../../const/schema/apiGroup');

module.exports = app => {
    const mongoose = app.mongoose;
    const Schema = mongoose.Schema;

    const ApiGroupSchema = new Schema(schema, {versionKey: false, minimize: false});

    return mongoose.model('apiGroup', ApiGroupSchema);
};