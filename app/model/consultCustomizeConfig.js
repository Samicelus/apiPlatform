'use strict';

module.exports = app => {
    const mongoose = app.mongoose;
    const Schema = mongoose.Schema;

    const ConsultCustomizeConfigSchema = new Schema({
        app_oid:{
            type: mongoose.Types.ObjectId,
            ref: 'appConfig'
        },
        config:{
            type: Object
        },
        created: {
            type: Date,
            default: Date.now()
        },
        updated: {
            type: Date,
            default: Date.now()
        }
    }, {versionKey: false});

    return mongoose.model('consultCustomizeConfig', ConsultCustomizeConfigSchema);
};
