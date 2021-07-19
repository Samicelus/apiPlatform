'use strict';
const mongoose = require('mongoose');
const mysql = require('mysql');
const moment = require('moment');
moment.locale('zh-cn');
const Service = require('egg').Service;

class sourceService extends Service {

    async addSourceConfig({app_id, sourceName, description, dbType, connectStr, dbName, login, password}){
        const {ctx: { model }, app: {mongoose: {Types: {ObjectId}}}} = this;

        let dataSource = await model.DataSource({
            app_oid: ObjectId(app_id),
            sourceName,
            description,
            dbType,
            connectStr,
            dbName,
            login,
            password
        }).save();

        return dataSource;
    }

    async updateSourceConfig({source_id, dbType, dbName, description, connectStr, login, password}){
        const {ctx: { model }} = this;
        let setter = {
            dbType,
            dbName,
            description,
            connectStr,
            login,
            password
        };
        let dataSource = await model.DataSource.findByIdAndUpdate(source_id, {"$set": setter});
        return dataSource;
    }

    async listSourceConfig({app_id, search, page=1, pageSize=10, sortField, sortOrder}){
        const {ctx: { model }, app: {mongoose: {Types: { ObjectId }}}} = this;
        
        let condition = {
            app_oid: ObjectId(app_id)
        };
        
        if(search){
            condition.sourceName = {"$regex": search};
        }

        let sort = {
            "created": -1
        }

        if(sortField){
            sort = {};
            sort[sortField] = sortOrder == "ascend" ? 1: -1;  
        }

        const list = await model.DataSource.find(condition)
        .sort(sort)
        .skip((Number(page)-1)*Number(pageSize))
        .limit(Number(pageSize))
        .lean();

        for(let index in list){
            let source = list[index];
            source.modelCount = await model.CustomizedModel.count({
                source_oid: ObjectId(source._id)
            });
        }

        let count = await model.DataSource.count(condition);
        return {list, count};
    }

    async addCustomizeModel({source_id, collectionName, schema}){
        const {ctx: { model }, app: {mongoose: {Types: {ObjectId}}}} = this;

        let customizeModel = await model.CustomizedModel.findOne(
            {
                source_oid: ObjectId(source_id),
                name: collectionName
            }
        );

        if(!customizeModel){
            customizeModel = await model.CustomizedModel(
                {
                    source_oid: ObjectId(source_id),
                    name: collectionName,
                    modelSchema: schema
                }
            ).save();
        }

        return customizeModel;
    }
    
    async updateCustomizeModel({model_id, schema}){
        const {ctx: { model }, app: {mongoose: {Types: { ObjectId }}}} = this;
        return await model.CustomizedModel.findOneAndUpdate({_id: ObjectId(model_id)}, {
            "$set": {
                modelSchema: schema
            }
        }, {"upsert":true});
    }

    async listCustomizeModel({source_id, search, page=1, pageSize=10, sortField, sortOrder}){
        const {ctx: { model }, app: {mongoose: {Types: { ObjectId }}}} = this;
        
        let condition = {
            source_oid: ObjectId(source_id)
        };
        
        if(search){
            condition.name = {"$regex": search};
        }

        let sort = {
            "created": -1
        }

        if(sortField){
            sort = {};
            sort[sortField] = sortOrder == "ascend" ? 1: -1;  
        }

        const list = await model.CustomizedModel.find(condition)
        .sort(sort)
        .skip((Number(page)-1)*Number(pageSize))
        .limit(Number(pageSize))
        .lean();
        let count = await model.CustomizedModel.count(condition);
        return {list, count};
    }

    async getTables({app_id, sourceName}){
        const {ctx: { helper }} = this;

        let {dbType, tables} = await helper.showTable({app_id, sourceName});

        return {dbType, tables};
    }

    async getStructure({app_id, sourceName, collectionName}){
        const {ctx: { helper }} = this;

        let {dbType, structure, source_id} = await helper.showModel({app_id, sourceName, collectionName});

        return {dbType, structure, source_id};
    }

    async getData({app_id, sourceName, collectionName, query, joins}){
        const {ctx: { model, helper }, app: {mongoose: {Types: {ObjectId}}}} = this;

        let {retModel, dbType, conn, populations} = await helper.customizeModel({
            app_id, 
            sourceName, 
            collectionName,
            joins
        });

        let data;

        switch(dbType){
            case 'mongodb':
                let instance = retModel.find(query?JSON.parse(query):{})
                if(Array.isArray(joins) && joins.length>0){
                    for(let key in joins){
                        let join = joins[key];
                        instance.populate({
                            path: join.joinKey
                        })
                    }
                }
                data = await instance.lean();
                break;
            case 'mysql':
                let finalQuery = "";
                let joinQuery = "";
                if(Array.isArray(joins) && joins.length>0){

                    for(let key in joins){
                        let join = joins[key];
                        joinQuery += ` ${join.joinType} ${join.joinModel} ON ${collectionName+'.'+join.joinKey}=${join.joinModel+'.'+join.targetKey}`
                    }

                }

                data = await new Promise((resolve, reject)=>{
                    finalQuery += `SELECT * FROM ${collectionName}`
                    +joinQuery
                    +`${query?' WHERE '+query:''}`;

                    conn.query(finalQuery, function(error, results, fields){
                        if(error){
                            reject(error);
                        }else{
                            resolve(results);
                        }
                    })
                })
                break;
            default:
                break;
        }

        return data;
    }

    async fetchExistSchema({app_id, sourceName}){
        const {ctx: { model }, app: {mongoose: {Types: {ObjectId}}}} = this;

        const dataSource = await model.DataSource.findOne({
            app_oid: mongoose.Types.ObjectId(app_id),
            sourceName: sourceName
        }).lean();

        let source_id = dataSource._id
        let condition = {
            source_oid: source_id
        }

        const existSchemas = await model.CustomizedModel.distinct('name', condition);

        return {source_id, existSchemas};
    }
    
    async test({source_id}){
        const {ctx: { model }, logger, app} = this;

        const dataSource = await model.DataSource.findById(source_id);

        const {dbType, connectStr, dbName, login, password} = dataSource;

        let url = formUrl({dbType, connectStr, dbName, login, password});

        let result = false;
        
        let conn;

        try{
            switch(dbType){
                case 'mongodb':
                    conn = await mongoose.createConnection(url, {useNewUrlParser: true});
                    if(conn.readyState == "1"){
                        dataSource.tested = true;
                        dataSource.testTime = new moment().format('YYYY-MM-DD HH:mm:ss');
                        await dataSource.save();
                        result = true;
                    }
                    break;
                case 'mysql':
                    conn = await new Promise((resolve, reject)=>{
                        conn = mysql.createConnection(url);
                        conn.connect(function(err){
                            if(err){
                                reject(err);
                            }else{
                                resolve(conn);
                            }
                        })
                    })
                    if(conn.state == "authenticated"){
                        dataSource.tested = true;
                        dataSource.testTime = new moment().format('YYYY-MM-DD HH:mm:ss');
                        await dataSource.save();
                        result = true;
                    }
                    break;
                default:
                    break;
            }
        }catch(e){
            dataSource.tested = false;
            dataSource.testTime = new moment().format('YYYY-MM-DD HH:mm:ss');
            await dataSource.save();
        }
        
        return {result};
    }
}

function formUrl({dbType, connectStr, dbName, login, password}){
    switch(dbType){
        case 'mongodb':
            return `mongodb://${login?(login+':'+password+'@'):''}${connectStr}${dbName?'/'+dbName:''}`
        case 'mysql':
            return {
                host: connectStr.split(':')[0],
                port: connectStr.split(':')[1],
                user: login,
                password: password,
                database: dbName
            }
        default:
            break;
    }
}

module.exports = sourceService;
