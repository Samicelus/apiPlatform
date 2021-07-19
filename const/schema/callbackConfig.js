const mongoose = require('mongoose');
const { DATA_TYPE_MAP } = require('../module/consult');
const schema = {
    app_oid: {
        type: mongoose.Types.ObjectId,
        ref: 'appConfig'
    },
    apiTemplate_oid: {
        type: mongoose.Types.ObjectId,
        ref: 'apiTemplate',
        required: false
    },
    apiGroup_oid: {
        type: mongoose.Types.ObjectId,
        ref: 'apiGroup',
        required: false
    },
    name: {
        type: String
    },
    callbackUrl: { 
        type: String
    },
    callbackTag: {
        type: String
    },
    mock: {
        enable: {
            type: Boolean,
            default: false
        },
        dataType:{
            type: String,
            enum: Object.keys(DATA_TYPE_MAP),
            default: "json"
        },
        mockReturn: {
            type: Object,
            default: {}
        }
    },
    created: {
        type: Date
    },
    updated: {
        type: Date
    }
}

module.exports = schema;