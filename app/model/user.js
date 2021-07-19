'use strict';

module.exports = app => {
    const mongoose = app.mongoose;
    const Schema = mongoose.Schema;

    //医互通user表，仅作关联查询用
    const UserSchema = new Schema({
        nickname:String,
        nickname_en: String,
        pwd:String,
        token:String,
        last_login_date:String,
        registered:Number,
        sign_up_from: String,
        avatar: String,
        is_comuser:Number,
        phones: Array,
        emails: Array,
        emails_check: Array,
        tuishiben_id: String,
        created:String,
        modified:String
    }, {versionKey: false});

    return mongoose.model('user', UserSchema);
};