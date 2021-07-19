'use strict';
const moment = require('moment');
moment.locale('zh-cn');

const schema = require('../../const/schema/consultMessage');

module.exports = app => {
    const mongoose = app.mongoose;
    const Schema = mongoose.Schema;

    const ConsultMessageSchema = new Schema(schema, {versionKey: false});

    ConsultMessageSchema.post('validate', function(doc){
        doc.created = new moment().format('YYYY-MM-DD HH:mm:ss');
    })

    return mongoose.model('consultMessage', ConsultMessageSchema);
};