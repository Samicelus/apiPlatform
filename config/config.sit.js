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

    config.baseUrl = 'http://rd-testapi.mobimedical.cn/consultModulation/v1/public/';

    config.outUrl = 'http://rd-testapi.mobimedical.cn/consultModulation/v1/public/';

    config.cluster = {
        listen: {
            port: 7001,
            hostname: '0.0.0.0'
        }
    }

    config.logger = {
        outputJSON: true,
        level: 'DEBUG'
    }

    // use for cookie sign key, should change to your own and keep security
    config.keys = appInfo.name + '_1585626894600_7869';

    // add your middleware config here

    config.mongoose = {
        client: {
            url: 'mongodb://huaxi:541R4evB@mongodb:27017/huaxi',
        },
    };

    //add the redis setting to the world
    config.redis = {
        client: {
            port: 6379,          // Redis port
            host: 'redis',   // Redis host
            password: null,
            db: 0,
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
            host: "redis",
            port: 6379,
            auth_pass: null,
            db: 2
        },
    };

    config.alinode = {
        server: 'wss://agentserver.node.aliyun.com:8080',
        appid: '84862',
        secret: '662b23305b9986b732a178efd2598c7d379c59e2'
    };

    // add your user config here
    const userConfig = {
        // myAppName: 'egg',
    };

    /**
     * 自定义错误码
     * error code define files
     */
    config.code = require('./errorcode');

    return {
        ...config,
        ...userConfig,
    };
};
