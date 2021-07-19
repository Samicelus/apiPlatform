'use strict';

// app/service/user.js
const _ = require('lodash');
const Service = require('egg').Service;

class CallbackService extends Service {
    async getCallbackResult({app_id, callbackTag, body={}, query={}, headers, requestIp, callbackLog={}}) {
        const {ctx: { model }, logger, app: {mongoose: {Types: { ObjectId }}}} = this;
        let callRes;
        let result;
        let status;
        callbackLog.process = [];
        callbackLog.callResult={
        };
        let t0, t1, tt;
        t0 = new Date().getTime();
        try{
            //合并post和get入参
            body = _.merge(body, query);
            t1 = new Date().getTime();
            let getConfigLog = {
                state: "getConfig"
            }
            callbackLog.process.push(getConfigLog);

            let callbackConfig = await model.CallbackConfig.findOne({
                callbackTag,
                app_oid: ObjectId(app_id)
            }).lean();
            tt = new Date().getTime();
            getConfigLog.time = tt-t1;

            callbackLog.callbackConfig_oid = callbackConfig._id; 
            callbackLog.app_oid = ObjectId(app_id);
            callbackLog.requestIp = requestIp;

            try{
                callbackLog.requestBody = JSON.stringify(body,null,2);
            }catch(e){
                callbackLog.requestBody = body;
            }
            
            callbackLog.requestHeader = JSON.stringify(headers,null,2);

            if(callbackConfig.mock && callbackConfig.mock.enable){
                //使用mock返回
                t1 = new Date().getTime();
                let mockLog = {
                    state: "mock"
                }
                callbackLog.process.push(mockLog);
                result = callbackConfig.mock.mockReturn;
                tt = new Date().getTime();
                mockLog.time = tt-t1;
            }else{
                //走回调接口时，返回hospitalId
                let appConfig = await model.AppConfig.findOne({_id:ObjectId(app_id)}).lean();
                let hospitalId = appConfig.company?appConfig.company.hospitalId:"";
                //实际走回调接口
                t1 = new Date().getTime();
                let invokeCallbackLog = {
                    state: "invokeCallback"
                }
                callbackLog.process.push(invokeCallbackLog);
                headers.host = "";
                callRes = (await this.ctx.curl(callbackConfig.callbackUrl,
                    {
                        method: 'POST',
                        contentType:'json',
                        data: body,
                        headers,
                        dataType: 'json'
                    }
                ));

                result = callRes.data;
                if(typeof(result) == "object"){
                    result.hospitalId = hospitalId;
                }
                status = callRes.status;
                tt = new Date().getTime();
                invokeCallbackLog.time = tt-t1;
            }

            if(typeof(result) == "object"){
                callbackLog.result = JSON.stringify(result);
            }else{
                callbackLog.result = result;
            }
            callbackLog.callResult.status = status
            callbackLog.callResult.success = true;

            tt = new Date().getTime();
            callbackLog.totalTime = tt-t0;

        }catch(e){
            callbackLog.callResult.error = e.stack;
            callbackLog.callResult.success = false;
            callbackLog.process.push({
                state: "error"
            });
            tt = new Date().getTime();
            callbackLog.totalTime = tt-t0;
            logger.error(e.stack);
        }

        //记录回调日志
        let log = await model.CallbackLog(callbackLog).save();

        return result? result : {};
    }
}

module.exports = CallbackService;
