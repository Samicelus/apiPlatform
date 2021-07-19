'use strict';
const _ = require('lodash');
const moment = require('moment');
const querystring = require('querystring');
moment.locales('zh-cn');
// app/service/api.js
const Service = require('egg').Service;
const soap = require('soap');
const crypto = require('crypto');
const xml2js = require('xml2js-force-cdata');
const parser = new xml2js.Parser({
    explicitArray: false
});
const Parameter = require('parameter');
const parameter = new Parameter();

class ApiService extends Service {
    /**
     * 请求外部api并返回:
     * 
     * 获取api配置 --> 判断是否有已缓存结果 --是--> 获取缓存结果 --> 按需求解析返回并输出结果
     *                         |                                    ^
     *                         否                                   |
     *                         v                                    |
     *                  是否有前置请求 --否--> 请求远程api --> 是否缓存结果 --是--> 缓存入redis
     *                         |                    ^
     *                         是                   |
     *                         v                    |
     *                  完成前置请求 --> 用前置请求结果包装本次请求
     * 
     * @param {String}      app_id  在线问诊应用id
     * @param {String}      apiName api名称
     * @param {Object}      params api中用来从数据库获取数据所用的 consult_id, consultAdvice_id, consultRecord_id, consultMessage_id
     */
    async callConfigedApi ({app_id, apiName, company_id, hospitalId, tagName, type, params={}, apiLog={}}){
        const {ctx: { model, helper, validate }, logger, app: {mongoose: {Types: { ObjectId }}, _, redis}} = this;
        let returned;
        let tempPaths = [];
        let isRequest = false;//是否完成整个请求
        if(app_id){
            apiLog.app_oid = ObjectId(app_id);
        }
        apiLog.process = [];
        apiLog.callResult={
        };
        let t0, t1, tt;
        t0 = new Date().getTime();
        let apiObj;
        let callError;
        try{

            apiLog.params = JSON.stringify(params);
            t1 = new Date().getTime();
            let getConfigLog = {
                state: "getConfig"
            }
            apiLog.process.push(getConfigLog);

            if(app_id && apiName){
                apiObj = await model.ApiConfig.findOne({
                    name: apiName,
                    app_oid: ObjectId(app_id)
                }).lean();
            }else if((company_id || hospitalId) && tagName){
                let tag = await model.Tag.findOne({tagName}).lean();
                if(!tag){
                    throw new Error(`不存在对应的tagName:${tagName}`);
                }
                let appCondition = {};
                if(company_id){
                    appCondition = {
                        company_oid: ObjectId(company_id)
                    }
                }
                if(hospitalId){
                    appCondition = {
                        "company.hospitalId": hospitalId
                    }
                }
                let app_oids = await model.AppConfig.distinct('_id', appCondition);
                let apiCondition = {
                    app_oid: {"$in":app_oids},
                    tag_oid: tag._id
                }
                if(type){
                    apiCondition.type = type;
                }
                apiObj = await model.ApiConfig.findOne(apiCondition).lean();
                if(!apiObj){
                    throw new Error(`目标接口应用不存在 tagName为 ${tagName} 的接口配置`);
                }
                apiLog.app_oid = apiObj.app_oid;
            }
            

            if(!apiObj){
                let errMsg = `app:${app_id}中未找到配置的api:${apiName}`;
                throw new Error(`app:${app_id}中未找到配置的api:${apiName}`);
            }
            app_id = apiObj.app_oid;
            apiLog.api_oid = apiObj._id;
            apiLog.versionTag = apiObj.versionTag;
            apiLog.tag_oid = apiObj.tag_oid;
            apiLog.apiGroup_oid = apiObj.apiGroup_oid;
            apiLog.apiTemplate_oid = apiObj.apiTemplate_oid;
            //用以存结果
            let result;
            let dataSource = {};
            let preResult;
            let customConfig = {};

            if(apiObj.mockReturn){
                return this.ctx.service.groupTag.tag.getTestReturn(
                    {
                        api_id: apiObj._id
                    }
                )
            }

            //回调映射
            let callbackTagMap = {};
            const thisAppCallbacks = await model.CallbackConfig.find({app_oid:apiObj.app_oid}).lean();
            let baseUrl = this.config.baseUrl;
            for(let callbackConfig of thisAppCallbacks){
                callbackTagMap[callbackConfig.callbackTag] = `${baseUrl}${callbackConfig.callbackTag}/${callbackConfig.app_oid}/callback`;
            }

            const customizeConfig = await model.ConsultCustomizeConfig.findOne({
                app_oid: ObjectId(app_id)
            }).lean();

            if(customizeConfig && customizeConfig.config){
                customConfig = customizeConfig.config;
            }
            
            tt = new Date().getTime();
            getConfigLog.time = tt-t1;

            //如果有缓存,则从缓存中取
            if(apiObj.cache && apiObj.cache.isCached){

                apiLog.resultFromCache = true;

                t1 = new Date().getTime();
                let fromCacheLog = {
                    state: "fromCache"
                }
                apiLog.process.push(fromCacheLog);

                let key = `consult:${app_id}:${apiObj.cache.cacheKey}`;

                apiLog.cacheKey = key;

                //logger.info(`${apiName} got from cached: ${key}`);
                let cached = await redis.get(key);
                if(cached){
                    try {
                        result = JSON.parse(cached);
                    }catch(e){
                        result = cached;
                    }
                }

                tt = new Date().getTime();
                fromCacheLog.time = tt-t1;
            }
            let url, data;
            //没有缓存结果或缓存已过期
            if(!result){

                t1 = new Date().getTime();
                let parseDataLog = {
                    state: "parseData"
                }
                apiLog.process.push(parseDataLog);

                let hostRoute = [];
                if(apiObj.host){
                    hostRoute.push(apiObj.host);
                }
                if(apiObj.url){
                    hostRoute.push(apiObj.url);
                }
                
                url = (apiObj.protocal||"") + hostRoute.join('/');
                
                data = {
                    ...apiObj.data
                };
                data = translateData(params, data);
                
                tt = new Date().getTime();
                parseDataLog.time = tt-t1;


                t1 = new Date().getTime();
                let formHeaderLog = {
                    state: "formHeader"
                }
                apiLog.process.push(formHeaderLog);

                let method = apiObj.method;
                let headers = {
                    "Content-Type": "application/json"
                };
                if(apiObj.headers){
                    headers = _.merge(
                        headers,
                        apiObj.headers
                    )
                }

                tt = new Date().getTime();
                formHeaderLog.time = tt-t1;

                //如果有前置请求
                if(apiObj.pre && apiObj.pre.hasPre){
                    
                    t1 = new Date().getTime();
                    let callPreApiLog = {
                        state: "callPreApi"
                    }
                    apiLog.process.push(callPreApiLog);

                    preResult = await this.ctx.service.api.callConfigedApi({
                        app_id: apiObj.app_oid,
                        apiName: apiObj.pre.apiName,
                        params
                    });
                    //将preApi的结果按照processReturn的设置写入本次请求的相应部分
                    for(let key in apiObj.pre.processReturn){
                        const thisProcess = apiObj.pre.processReturn[key];
                        if(preResult[key]){
                            //针对该字段的处理写入请求的header
                            if(thisProcess.header){
                                if(!headers){
                                    headers = {};
                                }
                                headers[thisProcess.header.name] = preResult[key];
                            }
                            //针对该字段的处理写入请求的body
                            if(thisProcess.body){
                                if(["POST","PUT","DELETE","PATCH"].includes(method)){
                                    let source = _.set(
                                        {},
                                        thisProcess.body.name,
                                        preResult[key]
                                    );
                                    data = _.merge(data, source);
                                }
                            }
                            //针对该字段的处理写入请求的querystring
                            if(thisProcess.query){
                                if(["GET","HEAD"].includes(method)){
                                    let source = _.set(
                                        {},
                                        thisProcess.query.name,
                                        preResult[key]
                                    );
                                    data = _.merge(data, source);
                                }else{
                                    url += `?${thisProcess.query.name}=${preResult[key]}`
                                }
                            }
                        }
                    }

                    tt = new Date().getTime();
                    callPreApiLog.time = tt-t1;
                }

                //从数据库取数据
                if(apiObj.dataSource && apiObj.dataSource.length > 0){

                    t1 = new Date().getTime();
                    let queryDatabaseLog = {
                        state: "queryDatabase"
                    }
                    apiLog.process.push(queryDatabaseLog);

                    for(let sourceConfig of apiObj.dataSource){

                        if(sourceConfig.targetModel){
                            let modelInstance = model[sourceConfig.targetModel]
                            .findById(params[idPath(sourceConfig.targetModel)]);
                            if(sourceConfig.populate && 
                                Array.isArray(sourceConfig.populate)){
                                for(let linkedPopolate of sourceConfig.populate){
                                    let populateOption = {};
                                    let current = populateOption;
                                    let parent;
                                    linkedPopolate.split(" ").forEach(item => {
                                        current.path = item;
                                        current.populate = {};
                                        parent = current;
                                        current = current.populate;
                                    })
                                    if(parent){
                                        delete parent.populate;
                                    }
                                    modelInstance.populate(populateOption);
                                }
                            }
                            dataSource[lowerCapital(sourceConfig.targetModel)] = await modelInstance;
                        }else if(sourceConfig.sourceName && sourceConfig.collectionName){
                            dataSource[sourceConfig.path] = await this.ctx.service.dataSource.sourceConfig
                            .getData({
                                app_id, 
                                sourceName: sourceConfig.sourceName, 
                                collectionName: sourceConfig.collectionName, 
                                query: translateQuery(params, (sourceConfig.dbType=="mongodb"?sourceConfig.query:sourceConfig.where)),
                                joins: sourceConfig.joins
                            });
                        }

                    }

                    tt = new Date().getTime();
                    queryDatabaseLog.time = tt-t1;
                }

                //组合数据
                if(apiObj.dataMerge && Object.keys(apiObj.dataMerge).length>0){

                    t1 = new Date().getTime();
                    let mergeDataLog = {
                        state: "mergeData"
                    }
                    apiLog.process.push(mergeDataLog);

                    tempPaths = [];
                    let dataMerge = await getReturn(
                        {
                            result, 
                            dataSource, 
                            preResult,
                            customConfig,
                            params,
                            callbackTagMap,
                            tempPaths
                        }, 
                        apiObj.dataMerge,
                        helper
                    )
                    for(let tempPath of tempPaths){
                        _.unset(dataMerge, tempPath);
                    }
                    data = _.merge(
                        data, 
                        dataMerge
                    )

                    tt = new Date().getTime();
                    mergeDataLog.time = tt-t1;
                }
                

                if(method === "SOAP" && apiObj.stringifyPath){

                    t1 = new Date().getTime();
                    let stringifyDataLog = {
                        state: "stringifyData"
                    }
                    apiLog.process.push(stringifyDataLog);

                    _.set(data,
                        apiObj.stringifyPath,
                        JSON.stringify(_.get(data, apiObj.stringifyPath))
                    )

                    tt = new Date().getTime();
                    stringifyDataLog.time = tt-t1;
                }

                //发送数据前是否进行签名
                if(apiObj.sign && apiObj.sign.enabled){

                    t1 = new Date().getTime();
                    let signLog = {
                        state: "sign"
                    }
                    apiLog.process.push(signLog);

                    let tempSign = "";
                    let signObj = {};
                    if(apiObj.sign.useData){
                        signObj = {...data}
                    }
                    if(apiObj.sign.addedParam && typeof apiObj.sign.addedParam == 'object'){

                        tempPaths = [];
                        let signParams = await getReturn(
                            {
                                result,
                                dataSource, 
                                preResult,
                                customConfig,
                                params,
                                callbackTagMap,
                                tempPaths
                            }, 
                            apiObj.sign.addedParam,
                            helper
                        );
                        for(let tempPath of tempPaths){
                            _.unset(signParams, tempPath);
                        }

                        _.merge(
                            signObj, 
                            signParams
                        )
                    }
                    //ascii排序
                    let sorted = helper.sortByAscii(signObj, apiObj.sign.signNull);
                    // let preSignStr = querystring.stringify(sorted);
                    // 不对中文进行URIencode
                    let preSignStr = querystring.stringify(sorted,'&','=',{ encodeURIComponent: value => value});
                    let signPath = apiObj.sign.path?apiObj.sign.path:'sign';
                    //logger.info("加密前排序字符串")
                    //logger.info(preSignStr);
                    if(apiObj.sign.preSalt){
                        preSignStr = apiObj.sign.preSalt + preSignStr;
                    }
                    if(apiObj.sign.salt){
                        preSignStr += apiObj.sign.salt;
                    }

                    logger.info('签名前字符串：', preSignStr);

                    let signed = "";
                    switch(apiObj.sign.algorithm){
                        case "md5":
                            signed = helper.md5(preSignStr, apiObj.sign.encode);
                            break;
                        case "sha1":
                            signed = helper.sha1(preSignStr, apiObj.sign.encode);
                            break;
                        case "hmac":
                            let signSecretConfig = _.get(customConfig, apiObj.sign.signSecret);
                            let signSecret = signSecretConfig?(signSecretConfig.value||signSecretConfig.default):''
                            signed = helper.hmac(preSignStr, apiObj.sign.encode, signSecret);
                            break;
                        case "sm3":
                            signed = helper.sm3(preSignStr);
                        default:
                            break;
                    }
                    switch(apiObj.sign.signPosition){
                        case "body":
                            data[signPath] = signed;
                            break;
                        case "query":
                            data[signPath] = signed;
                            break;
                        case "header":
                            headers[signPath] = signed;
                            break;
                        default:
                            break;
                    }

                    tt = new Date().getTime();
                    signLog.time = tt-t1;
                }

                apiLog.url = `${url} \n\r headers: ${_.reduce(_.map(_.toPairs(headers),function(inner){
                    return `[${inner[0]}]:${inner[1]}\n\r`
                }),function(result, item){
                    return result+item
                },'')}`;
                apiLog.data = JSON.stringify(data);
                apiLog.method = method;

                if(apiObj.mock && apiObj.mock.enable){
                    //使用mock
                    t1 = new Date().getTime();
                    let mockLog = {
                        state: "mock"
                    }
                    apiLog.process.push(mockLog);
                    result = apiObj.mock.mockReturn;
                    isRequest = true;
                    tt = new Date().getTime();
                    mockLog.time = tt-t1;
                }else{
                    //实际请求
                    t1 = new Date().getTime();
                    let requestLog = {
                        state: "request"
                    }
                    apiLog.process.push(requestLog);
                    if(method === "SOAP"){
                        logger.info(data);
                        result = await callSoap(url, apiObj.funcName, data, apiObj.createWSDLOptions||{}, apiObj.wsseOptions, logger);
                        apiLog.data = result.xml;
                        delete result.xml;
                    }else{
                        if(method.toLowerCase()=="post" && apiObj.bodyConfig && apiObj.bodyConfig.bodyType && apiObj.bodyConfig.bodyType != 'json'){
                            switch(apiObj.bodyConfig.bodyType){
                                case "xml":
                                    let xmlObj = {};
                                    xmlObj[apiObj.bodyConfig.envelope] = data
                                    data = xmlInside(xmlObj, apiObj.bodyConfig.cdata);
                                    apiLog.data = data;
                                    break;
                                default:
                                    break;
                            }
                        }
                        let callRes = (await this.ctx.curl(url,
                            {
                                method,
                                data,
                                headers,
                                dataType: apiObj.dataType || 'json'
                            }
                        ));
                        result = callRes.data;
                        apiLog.callResult.status = callRes.status;
                        if(callRes.status != 200){
                            throw new Error(JSON.stringify(result));
                        }
                    }
                    isRequest = true;
                    tt = new Date().getTime();
                    requestLog.time = tt-t1;
                }

                if(apiObj.dataType === 'text'){
                    logger.info(result.length);
                    if(result.length > 50000){
                        apiLog.result = result.slice(0,50000) + '...';
                    }else{
                        apiLog.result = result;
                    }
                }else{
                    let recordResult = JSON.stringify(result);
                    logger.info(recordResult.length);
                    if(recordResult.length > 50000){
                        apiLog.result = recordResult.slice(0,50000) + '...';
                    }else{
                        apiLog.result = recordResult;
                    }
                }

                if(apiObj.validateConfig && apiObj.validateConfig.validateResult && apiObj.validateConfig.rule){
                    const error = parameter.validate(apiObj.validateConfig.rule, result);
                    if(error){
                        throw new Error(error.map(item=>`接口返回校验失败: ${item.field} 字段不符合要求 ${item.message}, code: ${item.code}`).join('|'));
                    }
                }

                console.log('开始解析数据...')

                if(apiObj.dataType === 'text' && apiObj.convertText){
                    //logger.info(`解析type: ${apiObj.convertText}`)
                    t1 = new Date().getTime();
                    let parseTextLog = {
                        state: "parseText"
                    }
                    apiLog.process.push(parseTextLog);
                    //logger.info('result:')
                    //logger.info(result)

                    switch(apiObj.convertText){
                        case 'xml':
                            result = await parser.parseStringPromise(result);
                            break;
                        case 'json':
                            logger.info('json字符串序列化...')
                            result = JsonParseRecursive(result);
                            break;
                        case 'stringfy':
                            logger.info('json对象字符串化...')
                            result = JSON.stringify(result);
                            break;
                        default:
                            break;
                    }

                    tt = new Date().getTime();
                    parseTextLog.time = tt-t1;

                    //logger.info('解析后数据:')
                    //logger.info(result)
                }
            }

            t1 = new Date().getTime();
            let returnLog = {
                state: "return"
            }
            apiLog.process.push(returnLog);
            
            //组合返回,不需要组合则直接返回接口返回
            if(apiObj.return){
                tempPaths = [];
                returned = await getReturn({result, dataSource, preResult, customConfig, params, callbackTagMap, tempPaths}, apiObj.return, helper);
                for(let tempPath of tempPaths){
                    _.unset(returned, tempPath);
                }
            } else {
                returned = result;
            }
            

            tt = new Date().getTime();
            returnLog.time = tt-t1;

            // logger.info(`***************${url}*****************`);
            // logger.info(dataSource);
            // logger.info(data);
            // logger.info(result);

            //缓存请求结果
            if(isRequest && apiObj.cache && apiObj.cache.isCached){

                t1 = new Date().getTime();
                let toCacheLog = {
                    state: "toCache"
                }
                apiLog.process.push(toCacheLog);

                let key = `consult:${app_id}:${apiObj.cache.cacheKey}`;
                let str;
                if(typeof result === "string"){
                    str = result;
                }else{
                    try{
                        str = JSON.stringify(result);
                    }catch(e){
                        throw new Error(`api请求:${apiName}返回解析错误`)
                    }
                }
                let cacheTime = apiObj.cache.cacheTime.default;
                if(apiObj.cache.cacheTime.byReturn){
                    //TODO: 从返回获取数据缓存时间
                }
                await redis.set(key, str, "EX", cacheTime);

                tt = new Date().getTime();
                toCacheLog.time = tt-t1;
            }

            apiLog.callResult.success = true;
            tt = new Date().getTime();
            apiLog.totalTime = tt-t0;

        }catch(e){
            
            if(apiLog.app_oid && apiLog.api_oid){
                await this.ctx.service.qywechat.alertBug({
                    app_id: apiLog.app_oid, 
                    api_id: apiLog.api_oid,
                    message: e.message
                });
            }

            apiLog.callResult.error = e.stack;
            apiLog.callResult.success = false;
            apiLog.process.push({
                state: "error"
            });
            tt = new Date().getTime();
            apiLog.totalTime = tt-t0;
            logger.error(e);
            callError = e.stack;
        }

        //console.log(apiLog)
        //记录调用日志
        let log = await model.ApiLog(apiLog).save();
        return returned || callError || {};
    }
}

module.exports = ApiService;

function JsonParseRecursive(str){
    console.log(str);
    if(typeof str == 'string'){
        return JsonParseRecursive(JSON.parse(str));
    }else{
        return str;
    }
}

async function getReturn({result, dataSource, preResult, customConfig, params, callbackTagMap, tempPaths, currentPath=[]}, returnConfig, helper){
    if(typeof returnConfig === "object"){
        let returned = {};
        for(let key in returnConfig){
            let thisParam = returnConfig[key];
            let paramSource;
            switch(thisParam.from){
                case "return":
                    paramSource = _.get(returned, thisParam.path);
                    break;
                case "dataSource":
                    paramSource = thisParam.path?_.get(dataSource[thisParam.source], thisParam.path):dataSource[thisParam.source];
                    break;
                case "preResult":
                    if(thisParam.path){
                        paramSource = _.get(preResult, thisParam.path);
                    }else{
                        paramSource = preResult
                    }
                    break;
                case "system":
                    paramSource = getSystemResult(thisParam.method, thisParam.options, returned);
                    break;
                case "customConfig":
                    let tempconfig = _.get(customConfig, thisParam.path)
                    paramSource = tempconfig.value || tempconfig.default;
                    break;
                case 'result':
                    if(thisParam.path){
                        paramSource = _.get(result, thisParam.path);
                    }else{
                        paramSource = result
                    }
                    if (thisParam.required&&!paramSource) {
                        throw new Error(`api请求:${paramSource}返回解析错误`);
                    }
                    break;
                case 'value':
                    paramSource = thisParam.value;
                    break;
                case 'params':
                    if(thisParam.path){
                        paramSource = _.get(params, thisParam.path);
                    }else{
                        paramSource = params
                    }
                    break;
                case 'callbackUrl':
                    paramSource = callbackTagMap[thisParam.path];
                    break;
                default:
                    if(thisParam.value){
                        paramSource = thisParam.value;
                    }else{
                        paramSource = _.get(result, thisParam.path);
                    }
                    break;
            }
            let tempValue = paramSource;
            if(thisParam.convert){
                tempValue = await convert({
                    result: paramSource,
                    dataSource,
                    preResult,
                    customConfig,
                    params,
                    callbackTagMap,
                    tempPaths,
                    currentPath: currentPath.concat([key])
                }, thisParam.convert,
                helper);
            }
            if(thisParam.desensitization){
                tempValue = desensitization(tempValue, thisParam.desensitization);
            }
            _.set(
                returned,
                thisParam.key || key,
                tempValue
            );
            if(thisParam.temp){
                tempPaths.push(key);
            }
        }
        return returned;
    }else{
        return _.get(result, returnConfig);
    }
}

function desensitization(str, type){
    if(["string","number"].includes(typeof str)){
        str = str.toString()
        switch(type){
            case "phone":
                return str.slice(0,3)+str.slice(3,-4).replace(/./g,"*")+str.slice(-4);
            case "idCard":
                return str.slice(0,3)+str.slice(3,-4).replace(/./g,"*")+str.slice(-4);
            case "passport":
                return str.slice(0,2)+str.slice(2,-3).replace(/./g,"*")+str.slice(-3);
            case "whole":
                return str.replace(/./g, '*');
            default:
                return str;
        }
    }else{
        return str
    }
}

function getSystemResult(method, options, data){
    switch(method){
        case "dateFormat":
            return moment().format('YYYY-MM-DD');
        case 'dateNow':
            return Date.now().toString();
        case 'secondNow':
            return Date.now().toString().slice(0,-3);
        case 'randomString':
            return crypto.createHash('sha1').update(Math.random().toString()).digest('hex').slice(0, 32);
        case 'stringConcat':            //字段字符串拼接
            return stringConcat(options.expression, data);
        case 'mergeList':               //列表整合，类似于联表
            return mergeList(options.lists, options.primaryKey, data);
        case 'filter':
            return _.filter(data, options.filter);
        default:
            return;
    }
}

function stringConcat(expression, data){
    if(data){
        for(let key in data){
            let tempRegex = new RegExp(`\\$\\{${key}\\}`, 'g');
            let replaced = data[key];
            expression = expression.replace(tempRegex, replaced);
        }
    }
    return expression;
}

/**
 * 列表整合，类似于联表
 * @param {Array} lists 联表数据列表:data的相对路径path和联表字段refKey
 * @param {String} primaryKey 最终主字段
 * @param {*} data 数据来源
 */
function mergeList(lists, primaryKey, data){
    let preMergeObject = {};
    let returnedArray = [];
    if(lists){
        for(let listItem of lists){
            let list = _.cloneDeep(_.get(data, listItem.path));
            let refKey = listItem.refKey;
            if(Array.isArray(list)){
                for(let item of list){
                    if(preMergeObject[item[refKey]]){
                        preMergeObject[item[refKey]] = _.merge(preMergeObject[item[refKey]], item);
                    }else{
                        preMergeObject[item[refKey]] = item;
                    }
                }
            }
        }
    }
    for(let key in preMergeObject){
        preMergeObject[key][primaryKey] = key;
        returnedArray.push(preMergeObject[key]);
    }
    return returnedArray;
}

async function convert({result, dataSource, preResult, customConfig, params, callbackTagMap, tempPaths, currentPath}, convert, helper){
    let ret = result;
    let secretConfig;
    switch(convert.type){
        case "Boolean":
            if(convert.enum  && convert.enum.length){
                ret = convertToString(result, convert.default, convert.enum);
            }else{
                ret = Boolean(result);
            }
            break;
        case "String":
            if(convert.decoded){
                result = new Buffer.from(result, convert.coding).toString();
            }
            if(convert.decrypt){
                secretConfig = _.get(customConfig, convert.decryptSecret)
                //当只要求对值转换为base64的
                if (!convert.decryptMethod&&convert.coding) {
                    result = Buffer.from(result).toString(result.coding);
                }
                result = helper.decrypt(result, convert.decryptMethod, secretConfig.value || secretConfig.default, convert.coding)
            }
            if(convert.enum  && convert.enum.length){
                ret = convertToString(result, convert.default, convert.enum);
            }else{
                ret = result.toString();
            }
            if(convert.encrypt){
                secretConfig = _.get(customConfig, convert.encryptSecret)
                ret = helper.encrypt(ret, convert.encryptMethod, secretConfig.value || secretConfig.default, convert.coding)
            }
            if(convert.hashed){
                ret = helper[convert.encryptMethod](ret, convert.coding);
            }
            if(convert.encoded){
                ret = new Buffer.from(ret).toString(convert.coding);
            }
            if(convert.toUpperCase){
                ret = ret.toUpperCase();
            }
            if(convert.toLowerCase){
                ret = ret.toLowerCase();
            }
            break;
        case "Number":
            if(convert.enum && convert.enum.length){
                ret = convertToString(result, convert.default, convert.enum);
            }else{
                ret = Number(result);
            }
            break;
        case "Object":
            let res = result;
            //result是一个json字符串，需要转化
            if(convert.decrypt){
                secretConfig = _.get(customConfig, convert.decryptSecret)
                res = helper.decrypt(res, convert.decryptMethod, secretConfig.value || secretConfig.default, convert.coding)
            }
            if(convert.parse){
                try{
                    res = JSON.parse(res);
                }catch(e){
                    res = {
                        error: 1,
                        message: e.message,
                        source: res
                    }
                }
            }else if(convert.fromXml){
                try{
                    res = await parser.parseStringPromise(res);
                }catch(e){
                    res = {
                        error: 1,
                        message: e.message,
                        source: res
                    }
                }
            }
            ret = res;
            if(convert.return && Object.keys(convert.return).length){
                let innerTempPaths = [];
                ret = await getReturn({result:res, dataSource, preResult, customConfig, params, callbackTagMap, tempPaths:innerTempPaths, currentPath}, convert.return, helper)
                for(let tempPath of innerTempPaths){
                    _.unset(ret, tempPath);
                }
            }
            if (convert.stringify) {
                ret = JSON.stringify(ret);
            }
            if(convert.toXml){
                ret = xmlInside(ret, convert.cdata);
            }
            if(convert.encrypt){
                secretConfig = _.get(customConfig, convert.encryptSecret)
                ret = helper.encrypt(ret, convert.encryptMethod, secretConfig.value || secretConfig.default, convert.coding)
            }
            if(convert.hashed){
                ret = helper[convert.encryptMethod](ret, convert.coding);
            }
            if(convert.encoded){
                ret = new Buffer.from(ret).toString(convert.coding);
            }
            if(convert.toUpperCase){
                ret = ret.toUpperCase();
            }
            if(convert.toLowerCase){
                ret = ret.toLowerCase();
            }
            break;
        case "Array":
            if(convert.itemType === "Object" && convert.return){
                ret = [];
                if(!Array.isArray(result)){
                    result = [result];
                }
                for(let key in result){
                    let res = result[key];
                    if(convert.decrypt){
                        secretConfig = _.get(customConfig, convert.decryptSecret);
                        res = helper.decrypt(res, convert.decryptMethod, secretConfig.value || secretConfig.default, convert.coding)
                    }
                    if(convert.parse){
                        try{
                            res = JSON.parse(res);
                        }catch(e){
                            res = {
                                error: 1,
                                message: e.message,
                                source: res
                            }
                        }
                    }else if(convert.fromXml){
                        try{
                            res = await parser.parseStringPromise(res);
                        }catch(e){
                            res = {
                                error: 1,
                                message: e.message,
                                source: res
                            }
                        }
                    }
                    
                    let innerTempPaths = [];

                    let element = await getReturn({
                        result: res,
                        dataSource,
                        preResult,
                        customConfig,
                        params,
                        callbackTagMap,
                        tempPaths: innerTempPaths,
                        currentPath: currentPath.concat([key])
                    }, convert.return, helper);

                    for(let tempPath of innerTempPaths){
                        _.unset(element, tempPath);
                    }

                    if(convert.useResult){
                        element = _.merge(res, element);
                    }

                    if(convert.toXml){
                        element = xmlInside(element, convert.cdata);
                        if(convert.encrypt){
                            secretConfig = _.get(customConfig, convert.encryptSecret);
                            element = helper.encrypt(element, convert.encryptMethod, secretConfig.value || secretConfig.default, convert.coding)
                        }
                    }
                    ret.push(element);
                }
            }
            break;
        case "callbackUrl":
            ret = callbackTagMap[result];
            break;
        case "reducedArrayObject":
            let allKeys = _.reduce(result, function(final, item){
                return _.union(final, Object.keys(item))
            }, [])
            ret = _.reduce(result, function(final, item){
                for(let key of allKeys){
                    if(!final[key]){
                        final[key] = [];
                    }
                    final[key].push(item[key])
                }
                return final;
            }, {})
            break;
        case "arrayJoin":
            if(Array.isArray(result)){
                ret = result.join(convert.joinArraySeparator||"");
            }
            break;
        case "stringSplit":
            if(typeof result == 'string'){
                ret = result.split(convert.stringSplitSeparator||"");
            }
            break;
        default:
            break;
    }
    return ret;
}

function convertToString(source, defaultValue, enumerables){
    let temp = (defaultValue != undefined)?defaultValue:source;
    console.log('******************')
    console.log('temp:',temp);
    for(let item of enumerables){
        console.log('***********')
        console.log(item);
        if(judgeEnum(source, item.condition)){
            temp = item.value;
        }
    }
    return temp;
}

/**
 * 将对象内所有字段转化成xml, 如{abc:"123"} 会转化成 "<abc>123</abc>"
 * @param {*} obj 待转化对象
 * @param {*} cdata 是否包裹<![CDATA[]]>
 */
function xmlInside(obj, cdata){
    let temp = "";
    let keyLength = Object.keys(obj).length;
    for(let key in obj){
        let tempBuilder = new xml2js.Builder({
            headless:true,
            rootName:key,
            renderOpts:{
                pretty:false
            },
            cdata: cdata?'force':false
        });
        if(key == 'root' && keyLength == 1){
            temp += tempBuilder.buildObject(obj);
        }else{
            temp += tempBuilder.buildObject(obj[key]);
        }
    }
    return temp;
}

/**
 * 判断enum项是否成立
 * 
 * @param {Object} condition 判断enum项是否成立的条件
 * @return {Boolean} 判断结果,true则原值会被enum[x].value替代
 */
function judgeEnum(returnedValue, condition){
    console.log('*************')
    console.log(returnedValue, condition);
    let result = true;
    for(let key in condition){
        try{
            switch(key){
                case "eq":
                    if(returnedValue != condition[key]){
                        result = false;
                    }
                    break;
                case "ne":
                    if(returnedValue === condition[key]){
                        result = false;
                    }
                    break;
                case "in":
                    if(!condition[key].includes(returnedValue)){
                        result = false;
                    }
                    break;
                case "nin":
                    if(condition[key].includes(returnedValue)){
                        result = false;
                    }
                    break;
                case "regex":
                    if(!condition[key].test(returnedValue)){
                        result = false;
                    }
                    break;
                case "gt":
                    if(returnedValue <= condition[key]){
                        result = false;
                    }
                    break;
                case "gte":
                    if(returnedValue < condition[key]){
                        result = false;
                    }
                    break;
                case "lt":
                    if(returnedValue >= condition[key]){
                        result = false;
                    }
                    break;
                case "lte":
                    if(returnedValue > condition[key]){
                        result = false;
                    }
                    break;
                case "type":
                    if(typeof condition[key] != returnedValue){
                        result = false;
                    }
                    break;
                case "typein":
                    if(!returnedValue.includes(typeof condition[key])){
                        result = false;
                    }
                    break;
                case "typenin":
                    if(returnedValue.includes(typeof condition[key])){
                        result = false;
                    } 
                    break;
                case "exists":
                    if((returnedValue && !condition[key]) || (!returnedValue && condition[key])){
                        resutl = false;
                    }
                    break;
                default:
                    break;
            }
        }catch(e){
            //判断有误，输出判断失败
            result = false;
        }
    }
    return result;
}


function lowerCapital(str){
    return str.charAt(0).toLowerCase()+str.slice(1);
}

function idPath(str){
    return lowerCapital(str)+'_id';
}

function translateData(params, data){
    let dataStr = JSON.stringify(data);
    if(params){
        for(let key in params){
            let tempRegex = new RegExp(`\\$\\{${key}\\}`, 'g');
            let replaced = params[key];
            dataStr = dataStr.replace(tempRegex, replaced);
        }
    }
    return JSON.parse(dataStr);
}

function translateQuery(params, query){
    let dataStr = query;
    if(params){
        for(let key in params){
            let tempRegex = new RegExp(`\\$\\{${key}\\}`, 'g');
            let replaced = params[key]||'';
            dataStr = dataStr.replace(tempRegex, replaced);
        }
    }
    return dataStr;
}

async function callSoapAsync(url, funcName, arg, logger){
    let client = await soap.createClientAsync(url, {
        endpoint: url
    });
    let [result, body, header, xml] = await (_.get(client, funcName+'Async'))(arg);
    result.xml = xml;
    return result;
}

/**
 * 调用Web Service
 * @param {String} url          接口地址
 * @param {String} funcName     方法名称
 * @param {Object} arg          入参，之后会被转化为xml
 */
async function callSoap(url, funcName, arg, createWSDLOptions, wsseOptions, logger){
    return new Promise(function(resolve, reject){
        logger.info(`about to connect soap server on: ${url} ...`);
        let options = {
            endpoint: url
        };
        if(createWSDLOptions.forceSoap12Headers){
            options.forceSoap12Headers = true;
        }
        soap.createClient(url, options, function(err, client){
            if(err){
                reject(err);
            }else{
                logger.info(client);
                if(wsseOptions && wsseOptions.enable){
                    let wsSecurity = new soap.WSSecurity(wsseOptions.username, wsseOptions.password, {});
                    client.setSecurity(wsSecurity);
                }
                let method = _.get(client, funcName);
                method(arg, function(err, result, body, header, xml){
                    if(err){
                        reject(err);
                    }
                    result.xml = xml;
                    resolve(result);
                })
            }
        }, url)
    })
}