'use strict';

const schema = require('../../const/schema/apiGroupItem');

module.exports = app => {
    const mongoose = app.mongoose;
    const Schema = mongoose.Schema;

    const ApiGroupItemSchema = new Schema(schema, {versionKey: false, minimize: false});

    return mongoose.model('apiGroupItem', ApiGroupItemSchema);
};