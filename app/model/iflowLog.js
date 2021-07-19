'use strict';
const moment = require('moment');
moment.locale('zh-cn');

const schema = require('../../const/schema/iflowLog');

module.exports = app => {
    const mongoose = app.mongoose;
    const Schema = mongoose.Schema;

    const IflowLogSchema = new Schema(schema, {versionKey: false});

    IflowLogSchema.post('validate', function(doc){
        doc.log_time = new moment().format('YYYY-MM-DD HH:mm:ss');
    })

    return mongoose.model('iflowLog', IflowLogSchema);
};
