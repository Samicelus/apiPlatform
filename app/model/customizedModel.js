'use strict';
const moment = require('moment');
moment.locale('zh-cn');
const schema = require('../../const/schema/customizedModel');

module.exports = app => {
    const mongoose = app.mongoose;
    const Schema = mongoose.Schema;

    const CustomizedModelSchema = new Schema(schema, {versionKey: false, minimize: false});

    CustomizedModelSchema.post('validate', function(doc){
        doc.created = new moment().format('YYYY-MM-DD HH:mm:ss');
    })

    return mongoose.model('customizedModel', CustomizedModelSchema);
};