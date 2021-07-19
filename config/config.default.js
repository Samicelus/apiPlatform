/* eslint valid-jsdoc: "off" */

'use strict';

/**
 * @param {Egg.EggAppInfo} appInfo app info
 */
module.exports = appInfo => {
    /**
     * built-in config
     * @type {Egg.EggAppConfig}
     **/
    const config = exports = {};

    // use for cookie sign key, should change to your own and keep security
    config.keys = appInfo.name + '_1585626894600_7869';

    config.baseUrl = 'http://127.0.0.1:7001/v1/public/';

    config.outUrl = 'http://127.0.0.1:7001/v1/public/';

    config.omsUrl = 'https://devims.mobimedical.cn/api/oms/openapi/';

    // add your middleware config here
    config.middleware = ['params', 'report', 'jwt', 'power', 'module'];

    config.module = {
        enable: false
    };

    config.power = {
        enable: false
    };

    //jwt's middleware config seeting
    config.jwt = {
        enable: true,
        ignore:[
            `/v1/public/user/getToken`,
            `/v1/private/user/login`, 
            `/v1/private/user/qywechat/login`,
            `/v0/communication/question/create`,
            `/v0/communication/doctor/search`,
            `/v0/communication/service/open`,
            `/v1/private/consultModulation/apiConfig/xlsx`,
            `/v1/private/consultModulation/apiConfig/doc`,
            `/v1/private/consultModulation/apiConfig/md`,
            `/v1/public/:callbackTag/:app_id/callback`,
            `/v1/public/api/call`,
            `/v1/private/user/weixinQy/userInfo`,
            `/v1/public/IflowProcessTime`
        ]
    };

    config.mongoose = {
        client: {
            url: 'mongodb://127.0.0.1/test',
            options: {
                autoIndex: false,
                reconnectTries: Number.MAX_VALUE,
                reconnectInterval: 500,
                poolSize: 10,
                bufferMaxEntries: 0,
            },
        },
    };

    //add the redis setting to the world
    config.redis = {
        client: {
            port: 6379,          // Redis port
            host: "127.0.0.1",   // Redis host
            password: null,
            db: 1,
        },
    };

    config.io = {
        init: {},
        namespace: {
            '/': {
                connectionMiddleware: [],
                packetMiddleware: []
            }
        },
        redis: {
            host: "127.0.0.1",
            port: 6379,
            auth_pass: null,
            db: 2
        },
    };

    //default security setting
    config.security= {
        csrf: {
            enable: false,
            //ignoreJson:true
        },
        //domainWhiteList: [ 'http://192.168.102.180:8000' ]
    };

    //allow Cors
    config.cors = {
        //origin:'http://192.168.102.180:8000',
        origin:()=>'*',
        credentials: true,
        allowMethods: 'GET,HEAD,PUT,POST,DELETE,PATCH'
    };

    config.cos = {
        client: {
            SecretId: 'AKID3sQlvpIHJ5aqWNqOXVFjyLSIuEm7O2Rd',
            SecretKey: '5uYZLr5YonWzRg06KCvNYmmUcvEI5bLs',
            Bucket: 'jiekoupingtai-1253714281',
            Region: 'ap-chengdu'
        },
        useAgent: true
    }

    // add your user config here
    const userConfig = {
        // myAppName: 'egg',
    };
 
    /**
     * 自定义错误码
     * error code define files
     */
    config.code = require('./errorcode');


    config.multipart = {
        mode: 'file',
        fileExtensions: [
            '.pdf',
            '.doc',
            '.docx'
        ]
    }

    config.httpclient = {
        request: {
            // default timeout of request
            timeout: 60000,
        }
    }

    return {
        ...config,
        ...userConfig,
    };
};
