'use strict';
const moment = require('moment');
moment.locale('zh-cn');
const schema = require('../../const/schema/dataSource');

module.exports = app => {
    const mongoose = app.mongoose;
    const Schema = mongoose.Schema;

    const DataSourceSchema = new Schema(schema, {versionKey: false, minimize: false});

    DataSourceSchema.post('validate', function(doc){
        doc.created = new moment().format('YYYY-MM-DD HH:mm:ss');
    })

    return mongoose.model('dataSource', DataSourceSchema);
};