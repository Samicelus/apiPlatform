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

    config.baseUrl = 'http://api-platform.mobimedical.cn/api/v1/public/';

    config.outUrl = 'https://openapi.mobimedical.cn/v1/public/';

    config.omsUrl = 'https://testims.mobimedical.cn/api/oms/openapi/';

    config.cluster = {
        listen: {
            port: 7001,
            hostname: '0.0.0.0'
        }
    }

    // use for cookie sign key, should change to your own and keep security
    config.keys = appInfo.name + '_1585626894600_7869';

    // add your middleware config here

    config.mongoose = {
        client: {
            url: 'mongodb://rdoctor:362bc188@192.168.2.13:27017,192.168.2.12:27017,192.168.2.6:27017/HuaXi?authSource=HuaXi&replicaSet=cmgo-kecq7k4j_0',
        },
    };

    //add the redis setting to the world
    config.redis = {
        client: {
            port: 6379,          // Redis port
            host: '192.168.2.5',   // Redis host
            password: 'jkjY3L#wXP2pVMn&',
            db: 0,
        },
    };

    config.bus = {
        debug: true,
        concurrency: 1,             //Bull队列处理的并发数
        listener: {
            ignore: null,           //忽略目录中的文件
            baseDir: 'listener',
            options: {              //Bull Job 配置
                attempts: 5,
                backoff: {
                    delay: 3000,
                    type: 'fixed'
                }
            }
        },
        job: {
            ignore: null,           //忽略目录中的文件
            baseDir: 'job',
            options: {              //Bull Job 配置
                attempts: 5,
                backoff: {
                    delay: 3000,
                    type: 'fixed'
                }
            }
        },
        bull: {
            redis: {
                port: 6379,          // Redis port
                host: '192.168.2.5',   // Redis host
                password: 'jkjY3L#wXP2pVMn&',
                db: 0
            }
        },
        queue: {
            default: 'default',     //默认队列名称
            prefix: 'bus'           //队列前缀
        },
        queues: {}
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
            port: 6379,          // Redis port
            host: '192.168.2.5',   // Redis host
            password: 'jkjY3L#wXP2pVMn&',
            db: 2
        },
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
