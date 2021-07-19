'use strict';

module.exports = app => {
    const { router, controller } = app;

    // version
    //使用egg-router-plus优化后的写法
    const apiRouter = router.namespace('/v1/public');
    apiRouter.post('/sourceConfig',controller.dataSource.addSourceConfig);
    apiRouter.patch('/:source_id/sourceConfig',controller.dataSource.updateSourceConfig);
    apiRouter.get('/sourceConfig',controller.dataSource.listSourceConfig);
    apiRouter.post('/customizeModel',controller.dataSource.addCustomizeModel);
    apiRouter.patch('/:model_id/customizeModel',controller.dataSource.updateCustomizeModel);
    apiRouter.get('/customizeModel',controller.dataSource.listCustomizeModel);
    apiRouter.get('/getTable',controller.dataSource.getTable);
    apiRouter.get('/getStructure',controller.dataSource.getStructure);
    apiRouter.get('/getData',controller.dataSource.getData);
    apiRouter.post('/testDataSource', controller.dataSource.test);
    apiRouter.post('/constructSelectedSchema', controller.dataSource.constructSelectedSchema);
    apiRouter.post('/autoConstructSchema', controller.dataSource.autoConstructSchema);

    apiRouter.get('/analyseData', controller.dataSource.analyseData);
};
