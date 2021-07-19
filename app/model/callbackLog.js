'use strict';

const schema = require('../../const/schema/callbackLog');
const moment = require('moment');
moment.locale('zh-cn');

module.exports = app => {
    const mongoose = app.mongoose;
    const Schema = mongoose.Schema;

    const callbackLogSchema = new Schema(schema, {versionKey: false, minimize: false});

    callbackLogSchema.post('validate', function(doc){
        doc.log_time = new moment().format('YYYY-MM-DD HH:mm:ss');
        doc.created = new Date();
        doc.updated = new Date();
    })

    return mongoose.model('callbackLog', callbackLogSchema);
};