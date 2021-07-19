'use strict';

module.exports = app => {
    const mongoose = app.mongoose;
    const Schema = mongoose.Schema;

    const ModuleConfigSchema = new Schema({
        app_oid: { 
            type: mongoose.Types.ObjectId,
            ref: 'appConfig',
            required: true
        },
        name: {                         //模块名
            type: String
        },
        key: {                          //模块标识符
            type: String
        },
        actions: {                      //模块行为
            type: Object,
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

    return mongoose.model('moduleConfig', ModuleConfigSchema);
};
