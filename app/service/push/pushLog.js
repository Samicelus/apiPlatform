'use strict';

const Service = require('egg').Service;

class PushLogService extends Service {
    async getPushLog({search, threshold, hideSuccess, hideFail, page, pageSize}) {
        const {ctx:{model, helper},logger, app:{mongoose: {Types: {ObjectId}}}} = this;
        
        let condition = {};

        if(search){
            let smartapp_oids = await model.SmartApp.distinct('_id', {
                name: {
                    "$regex": search
                }
            });
            let company_oids = await model.Company.distinct('_id', {
                company_name: {
                    "$regex": search
                }
            });

            let sender_oids = await model.Sender.distinct('_id', {
                "$or": [
                    {
                        company_oid: {
                            "$in": company_oids
                        }
                    },
                    {
                        smartapp_oid: {
                            "$in": smartapp_oids
                        }
                    }
                ]
            });

            condition.sender_oid = {
                "$in": sender_oids
            }
        }
        
        if(threshold){
            condition.totalTime = {"$gt": threshold}
        }
        if(hideSuccess && !hideFail){
            condition["pushResult.success"] = false;
        }else if(!hideSuccess && hideFail){
            condition["pushResult.success"] = true;
        }

        let list = await model.PushLog.find(condition)
        .sort({
            log_time: -1
        })
        .skip((Number(page)-1)*Number(pageSize))
        .limit(Number(pageSize))
        .populate({
            path: 'sender_oid',
            select: 'company_oid smartapp_oid msgtype',
            populate: {
                path: 'company_oid'
            }
        })
        .populate({
            path: 'sender_oid',
            select: 'company_oid smartapp_oid msgtype',
            populate: {
                path: 'smartapp_oid'
            }
        })
        .lean();
        let count = await model.PushLog.count(condition);
        return {list, count};
    }
}

module.exports = PushLogService;
