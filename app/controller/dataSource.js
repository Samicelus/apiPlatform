'use strict';

const Controller = require('egg').Controller;
const { DB_TYPES } = require('../../const/module/customizeModel');

// 定义controller所使用的参数校验规则
// helper里将ctx.validate方法调用封装了一下
// 新的 helper.validate方法接受的参数有3个选项:
// query, body, params 如果存在, 将对对应入参进行校验
// 这3个选项内具体配置方法参见 parameter 插件: https://github.com/node-modules/parameter
const Rules = {
    addSourceConfigRule: {
        body: {
            app_id: {
                type: 'string',
                required: true,
                regex: /^[a-f0-9]{24,24}$/
            }, 
            sourceName: {
                type: 'string',
                required: true
            }, 
            description: {
                type: 'string',
                required: false
            }, 
            dbType: {
                type: 'enum',
                values: DB_TYPES
            }, 
            connectStr: {
                type: 'string',
                required: true
            }, 
            dbName: {
                type: 'string',
                required: false
            }, 
            login: {
                type: 'string',
                required: false
            }, 
            password: {
                type: 'string',
                required: false
            }
        },
    },
    updateSourceConfigRule: {
        params: {
            source_id: {
                type: 'string',
                required: true,
                regex: /^[a-f0-9]{24,24}$/
            }
        },
        body: {
            description: {
                type: 'string',
                required: false
            }, 
            dbType: {
                type: 'enum',
                values: DB_TYPES,
                required: false
            }, 
            connectStr: {
                type: 'string',
                required: false
            }, 
            dbName: {
                type: 'string',
                required: false
            }, 
            login: {
                type: 'string',
                required: false
            }, 
            password: {
                type: 'string',
                required: false
            }
        }
    },
    listSourceConfigRule: {
        query: {
            app_id: {
                type: 'string',
                required: true,
                regex: /^[a-f0-9]{24,24}$/
            },
            search: {
                type: 'string',
                required: false
            },
            page: {
                type: 'int',
                convertType: 'int',
                required: false,
                default: 1,
                min: 1
            },
            pageSize: {
                type: 'int',
                convertType: 'int',
                required: false,
                default: 20,
                min: 10,
                max: 200
            },
            sortField: {
                type: 'enum',
                required: false,
                values: [ "dbType", "dbName" ]
            },
            sortOrder: {
                type: 'enum',
                required: false,
                values: [ "ascend", "descend" ]
            }
        },
    },
    addCustomizeModelRule: {
        body: {
            source_id: {
                type: 'string',
                required: true,
                regex: /^[a-f0-9]{24,24}$/
            }, 
            modelName: {
                type: 'string'
            }, 
            schema: {
                type: 'object'
            }
        }
    },
    updateCustomizeModelRule: {
        params: {
            model_id: {
                type: 'string',
                required: true,
                regex: /^[a-f0-9]{24,24}$/
            }
        },
        body: {
            schema: {
                type: 'object'
            }
        }
    },
    listCustomizeModelRule: {
        query: {
            source_id: {
                type: 'string',
                required: true,
                regex: /^[a-f0-9]{24,24}$/
            },
            search: {
                type: 'string',
                required: false
            },
            page: {
                type: 'int',
                convertType: 'int',
                required: false,
                default: 1,
                min: 1
            },
            pageSize: {
                type: 'int',
                convertType: 'int',
                required: false,
                default: 20,
                min: 10,
                max: 200
            },
            sortField: {
                type: 'enum',
                required: false,
                values: [ "source_id" ]
            },
            sortOrder: {
                type: 'enum',
                required: false,
                values: [ "ascend", "descend" ]
            }
        }
    },
    getTableRule: {
        query: {
            app_id: {
                type: 'string',
                required: true,
                regex: /^[a-f0-9]{24,24}$/
            }, 
            sourceName: {
                type: 'string',
                required: true
            }
        }
    },
    getStructureRule: {
        query: {
            app_id: {
                type: 'string',
                required: true,
                regex: /^[a-f0-9]{24,24}$/
            }, 
            sourceName: {
                type: 'string',
                required: true
            }, 
            modelName: {
                type: 'string',
                required: true
            }
        }
    },
    getDataRule: {
        query: {
            app_id: {
                type: 'string',
                required: true,
                regex: /^[a-f0-9]{24,24}$/
            }, 
            sourceName: {
                type: 'string',
                required: true
            }, 
            modelName: {
                type: 'string',
                required: true
            }, 
            query: {
                type: 'string',
                required: false
            }
        }
    },
    autoConstructSchemaRule: {
        body: {
            app_id: {
                type: 'string',
                required: true,
                regex: /^[a-f0-9]{24,24}$/
            }, 
            sourceName: {
                type: 'string',
                required: true
            }
        }
    },
    constructSelectedSchemaRule: {
        body: {
            app_id: {
                type: 'string',
                required: true,
                regex: /^[a-f0-9]{24,24}$/
            }, 
            sourceName: {
                type: 'string',
                required: true
            },
            preAddSchemas: {
                type: 'array',
                itemType: 'string',
                required: true
            }
        }
    },
    testRule: {
        body: {
            source_id: {
                type: 'string',
                required: true,
                regex: /^[a-f0-9]{24,24}$/
            }
        }
    },
    analyseDataRule: {
        query: {
            source_id: {
                type: 'string',
                required: true,
                regex: /^[a-f0-9]{24,24}$/
            },
            model_id: {
                type: 'string',
                required: true,
                regex: /^[a-f0-9]{24,24}$/
            }
        }
    }
};

class sourceController extends Controller {
    async addSourceConfig() {
        const { ctx, logger } = this;
        ctx.helper.validate(Rules.addSourceConfigRule);
        try{
            const {
                request:{
                    body:{
                        app_id, 
                        sourceName, 
                        description, 
                        dbType, 
                        connectStr, 
                        dbName, 
                        login, 
                        password
                    }
                }
            } = ctx;

            let dataSource = await ctx.service.dataSource.sourceConfig
            .addSourceConfig({
                app_id, 
                sourceName, 
                description, 
                dbType, 
                connectStr, 
                dbName, 
                login, 
                password
            })

            ctx.body = {
                result: true,
                dataSource
            }
        }catch(e){
            logger.error(e);
            ctx.body = {
                result: false,
                message: e.message
            }
        }
    };

    async updateSourceConfig(){
        const { ctx, logger } = this;
        ctx.helper.validate(Rules.updateSourceConfigRule);
        try{
            const {
                params:{
                    source_id
                },
                request:{
                    body:{
                        description, 
                        dbType, 
                        connectStr, 
                        dbName, 
                        login, 
                        password
                    }
                }
            } = ctx;

            let dataSource = await ctx.service.dataSource.sourceConfig
            .updateSourceConfig({source_id, dbType, dbName, description, connectStr, login, password})

            ctx.body = {
                result: true,
                dataSource
            }
        }catch(e){
            logger.error(e);
            ctx.body = {
                result: false,
                message: e.message
            }
        }
    };

    async listSourceConfig(){
        const { ctx, logger } = this;
        ctx.helper.validate(Rules.listSourceConfigRule);
        try{
            const {
                query:{
                    app_id,
                    search,
                    page,
                    pageSize,
                    sortField, 
                    sortOrder
                }
            } = ctx;

            let { list, count } = await ctx.service.dataSource.sourceConfig
            .listSourceConfig({
                app_id,
                search,
                page,
                pageSize,
                sortField, 
                sortOrder
            });

            ctx.body = {
                result: true,
                list,
                count,
                page,
                pageSize
            }
        }catch(e){
            logger.error(e);
            ctx.body = {
                result: false,
                message: e.message
            }
        }
    };

    async addCustomizeModel(){
        const { ctx, logger } = this;
        ctx.helper.validate(Rules.addCustomizeModelRule);
        try{

            const {
                request:{
                    body:{
                        source_id, 
                        modelName, 
                        schema
                    }
                }
            } = ctx;

            let customizeModel = await ctx.service.dataSource.sourceConfig
            .addCustomizeModel({source_id, collectionName: modelName, schema});

            ctx.body = {
                result: true,
                customizeModel
            }
        }catch(e){
            logger.error(e);
            ctx.body = {
                result: false,
                message: e.message
            }
        }
    };

    async updateCustomizeModel(){
        const { ctx, logger } = this;
        ctx.helper.validate(Rules.updateCustomizeModelRule);
        try{

            const {
                params: {
                    model_id
                },
                request:{
                    body:{
                        schema
                    }
                }
            } = ctx;

            let customizeModel = await ctx.service.dataSource.sourceConfig
            .updateCustomizeModel({model_id, schema});

            ctx.body = {
                result: true,
                customizeModel
            }
        }catch(e){
            logger.error(e);
            ctx.body = {
                result: false,
                message: e.message
            }
        }
    };

    async listCustomizeModel(){
        const { ctx, logger } = this;
        ctx.helper.validate(Rules.listCustomizeModelRule);
        try{
            const {
                query:{
                    source_id,
                    search,
                    page,
                    pageSize,
                    sortField, 
                    sortOrder
                }
            } = ctx;

            let { list, count } = await ctx.service.dataSource.sourceConfig
            .listCustomizeModel({source_id, search, page, pageSize, sortField, sortOrder});

            ctx.body = {
                result: true,
                list,
                count,
                page,
                pageSize
            }
        }catch(e){
            logger.error(e);
            ctx.body = {
                result: false,
                message: e.message
            }
        }
    };

    async getTable(){
        const { ctx, logger, app: {_} } = this;
        ctx.helper.validate(Rules.getTableRule);

        try {
            const {
                query:{
                    app_id, 
                    sourceName
                }
            } = ctx;

            let {dbType, tables} = await ctx.service.dataSource.sourceConfig
            .getTables({app_id, sourceName});

            let {source_id, existSchemas} = await ctx.service.dataSource.sourceConfig
            .fetchExistSchema({app_id, sourceName});

            let preAddSchemas = _.pullAll(tables, existSchemas);

            ctx.body = {
                result: true,
                dbType,
                existSchemas,
                preAddSchemas
            }

        }catch(e){
            logger.error(e);
            ctx.body = {
                result: false,
                message: e.message
            }
        }
    }

    async getStructure(){
        const { ctx, logger } = this;
        ctx.helper.validate(Rules.getStructureRule);

        try {
            const {
                query:{
                    app_id, 
                    sourceName, 
                    modelName
                }
            } = ctx;

            let {dbType, structure} = await ctx.service.dataSource.sourceConfig
            .getStructure({app_id, sourceName, collectionName: modelName});

            ctx.body = {
                result: true,
                dbType,
                structure
            }

        }catch(e){
            logger.error(e);
            ctx.body = {
                result: false,
                message: e.message
            }
        }
    };

    async getData(){
        const { ctx, logger } = this;
        ctx.helper.validate(Rules.getDataRule);
        try{
            const {
                query:{
                    app_id, 
                    sourceName, 
                    modelName, 
                    query
                }
            } = ctx;

            let data = await ctx.service.dataSource.sourceConfig
            .getData({app_id, sourceName, collectionName: modelName, query});

            ctx.body = {
                result: true,
                data
            }
        }catch(e){
            logger.error(e);
            ctx.body = {
                result: false,
                message: e.message
            }
        }
    };

    async constructSelectedSchema(){
        const { ctx, logger, app: {_} } = this;
        ctx.helper.validate(Rules.constructSelectedSchemaRule);
        logger.info(new Date());
        try {
            const {
                request:{
                    body:{
                        app_id, 
                        sourceName,
                        preAddSchemas
                    }
                }
            } = ctx;

            let schemas = [];
            for(let preAddSchema of preAddSchemas){
                let {structure, source_id} = await ctx.service.dataSource.sourceConfig
                .getStructure({app_id, sourceName, collectionName:preAddSchema});
                let customizeModel = await ctx.service.dataSource.sourceConfig
                .addCustomizeModel({source_id, collectionName:preAddSchema, schema:structure});
                schemas.push(customizeModel);
            }

            ctx.body = {
                result: true,
                schemas
            }

        }catch(e){
            logger.error(e);
            ctx.body = {
                result: false,
                message: e.message
            }
        }
    };

    async autoConstructSchema(){
        const { ctx, logger, app: {_} } = this;
        ctx.helper.validate(Rules.autoConstructSchemaRule);

        try {
            const {
                request:{
                    body:{
                        app_id, 
                        sourceName
                    }
                }
            } = ctx;

            let {tables} = await ctx.service.dataSource.sourceConfig
            .getTables({app_id, sourceName});

            let {source_id, existSchemas} = await ctx.service.dataSource.sourceConfig
            .fetchExistSchema({app_id, sourceName});

            let preAddSchemas = _.pullAll(tables, existSchemas);

            let schemas = [];
            for(let preAddSchema of preAddSchemas){
                let {structure} = await ctx.service.dataSource.sourceConfig
                .getStructure({app_id, sourceName, collectionName:preAddSchema});

                let customizeModel = await ctx.service.dataSource.sourceConfig
                .addCustomizeModel({source_id, collectionName:preAddSchema, schema:structure});

                schemas.push(customizeModel);
            }

            ctx.body = {
                result: true,
                source_id,
                schemas
            }

        }catch(e){
            logger.error(e);
            ctx.body = {
                result: false,
                message: e.message
            }
        }
    };

    async test(){
        const { ctx, logger } = this;
        ctx.helper.validate(Rules.testRule);

        try{

            const {
                request:{
                    body:{
                        source_id
                    }
                }
            } = ctx;

            let { result } = await ctx.service.dataSource.sourceConfig
            .test({source_id});

            ctx.body = {
                result: true,
                connected: result
            }
        }catch(e){
            logger.error(e);
            ctx.body = {
                result: false,
                message: e.message
            }
        }
        
    };

    async analyseData(){
        const { ctx, logger } = this;
        ctx.helper.validate(Rules.analyseDataRule);

        try{

            const {source_id, model_id} = ctx.query;

            let invalidData = await ctx.service.dataSource.dataAnalyse
            .analyseCollection({source_id, model_id});

            ctx.body = {
                result: true,
                data: invalidData
            }
        }catch(e){
            logger.error(e);
            ctx.body = {
                result: false,
                message: e.message
            }
        }
    }
}

module.exports = sourceController;
