'use strict';

const Controller = require('egg').Controller;

// 定义controller所使用的参数校验规则
// helper里将ctx.validate方法调用封装了一下
// 新的 helper.validate方法接受的参数有3个选项:
// query, body, params 如果存在, 将对对应入参进行校验
// 这3个选项内具体配置方法参见 parameter 插件: https://github.com/node-modules/parameter
const Rules = {
    callApiRule: {
        body: {
            app_id: {
                type: 'string',
                required: false,
                regex: /^[a-f0-9]{24,24}$/
            },
            apiName: {
                type: 'string',
                required: false
            },
            company_id: {
                type: 'string',
                required: false,
                regex: /^[a-f0-9]{24,24}$/
            },
            hospitalId: {
                type: 'int',
                required: false
            },
            tagName: {
                type: 'string',
                required: false
            },
            type: {                     //同一类型的接口可能存在不同形态
                type: 'string',
                required: false
            },
            params: {
                type: 'object',
                required: false
            }
        },
    },
};

class ApiController extends Controller {
    async callApi() {
        const { ctx, logger } = this;
        try {
            ctx.helper.validate(Rules.callApiRule);
            const {app_id, apiName, company_id, hospitalId, tagName, type, params} = ctx.request.body;
            //检查当前用户可见company权限
            // let userScopeChecked = await ctx.service.user.checkUserScope({
            //     app_id, 
            //     company_id, 
            //     userInfo: ctx.request.userInfo
            // })
            //不在此处做医院可见权限判断
            let userScopeChecked = true;
            if(!userScopeChecked){
                ctx.body = {
                    success: false,
                    code: '401',
                    message: 'unauthorized userScope!'
                };
            }else{
                logger.info(`about to invoque: ${ctx.request.body.apiName}`)

                let result = await ctx.service.api.callConfigedApi({
                    app_id,
                    apiName,
                    company_id, 
                    hospitalId,
                    tagName,
                    type,
                    params,
                });

                ctx.body = {
                    success: true,
                    data: result,
                    code: '200',
                    message: ''
                };
            }
        }catch(e){
            logger.error(e.stack);
            ctx.body = {
                success: false,
                code: 'J001',
                message: e.message
            }
        }
    };
}

module.exports = ApiController;
