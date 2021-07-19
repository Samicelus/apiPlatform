'use strict';
const schema = require('../../const/schema/apiLog');
const moment = require('moment');
moment.locale('zh-cn');

module.exports = app => {
    const mongoose = app.mongoose;
    const Schema = mongoose.Schema;

    const ApiLogSchema = new Schema(schema, {versionKey: false, minimize: false});

    ApiLogSchema.post('validate', function(doc){
        doc.log_time = new moment().format('YYYY-MM-DD HH:mm:ss');
        doc.created = new Date();
    })

    return mongoose.model('apiLog', ApiLogSchema);
};