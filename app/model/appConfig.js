'use strict';

const schema = require('../../const/schema/appConfig');

module.exports = app => {
    const mongoose = app.mongoose;
    const Schema = mongoose.Schema;

    const AppConfigSchema = new Schema(schema, {versionKey: false});

    return mongoose.model('appConfig', AppConfigSchema);
};
