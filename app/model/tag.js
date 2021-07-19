'use strict';

const schema = require('../../const/schema/tag');

module.exports = app => {
    const mongoose = app.mongoose;
    const Schema = mongoose.Schema;

    const TagSchema = new Schema(schema, {versionKey: false, minimize: false});

    return mongoose.model('tag', TagSchema);
};