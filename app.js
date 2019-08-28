'use strict';

const Bluebird = require('bluebird');

function fromCallback(fn) {
    return new Bluebird(function(resolve, reject) {
        try {
            return fn(function(err, data, res) {
                if (err) {
                    err.res = res;
                    return reject(err);
                }
                return resolve([data, res]);
            });
        } catch (err) {
            return reject(err);
        }
    });
}
/**
 * 初始化consul客户端
 * @param {Application} app app
 */
async function initClient(app) {
    const { config } = app;
    const { consul: consulConf } = config;
    const consul = require('consul')(Object.assign({},
        consulConf.server,
        {
            promisify: fromCallback,
            secure: false
        }));
    app.consul = consul;
}
/**
 * 注册服务
 * @param {Application} app app
 */
async function regService(app) {
    const { config } = app;
    const { consul: consulConf } = config;
    if (consulConf.register) {
        if (consulConf.multiInstance) {
            consulConf.name += config.keys instanceof Array ? config.keys[0] : config.keys;
        }
        await app.consul.agent.service.register(consulConf);
    }
}
/**
 * 服务发现(同步)
 * @param {Application} app app
 */
async function findServiceSync(app) {
    app.services = {};
    const { services } = app.config.consul;
    for (const elem of services) {
        const { referName, serviceId } = elem;
        // 通过服务id获得ws
        const checks = await app.consul.agent.check.list();
        const services = await app.consul.agent.service.list();
        if (Object.keys(checks).length <= 0) {
            throw new Error(`找不到该服务:${serviceId}`);
        }
        const checkId = 'service:' + serviceId;
        const check = checks[0][checkId];
        if (!check) {
            throw new Error(`找不到该服务:${serviceId}`);
        }
        if (check.Status !== 'passing') {
            throw new Error(`服务异常:${serviceId}`);
        }
        const service = services[0][serviceId];
        const { Address, Port } = service;
        app.services[referName] = 'http://' + Address + ':' + Port;
    }
    app.logger.info('app.services', app.services);
}
/**
 * 服务发现(异步)
 * @param {Application} app app
 */
async function findService(app) {
    const { services: servicesConf } = app.config.consul;
    app.services = new Proxy({}, {
        get: async (target, propKey, receiver) => {
            const matchedService = servicesConf.find(elem => elem.referName === propKey);
            if (!matchedService) {
                return;
            }
            let { serviceId } = matchedService;
            const checks = await app.consul.agent.check.list();
            const services = await app.consul.agent.service.list();
            if (Object.keys(checks).length === 0) {
                return;
            }
            const checkId = 'service:' + serviceId;
            const keys = Object.keys(checks[0]);
            const targetServices = keys.filter(elem => {
                return elem.startsWith(checkId) && checks[0][elem].Status === 'passing';
            });
            if (targetServices.length === 0) {
                return;
            }
            const rand = Math.floor(Math.random() * targetServices.length);
            serviceId = targetServices[rand].split(':')[1];
            const service = services[0][serviceId];
            const { Address, Port } = service;

            return 'http://' + Address + ':' + Port;
        }
    });
}

module.exports = app => {
    app.beforeStart(async () => {

        const { multiInstance } = app.config.consul;
        // ------------ 初始化consul客户端 ------------
        await initClient(app);
        // ------------ 服务注册 ------------
        await regService(app);
        // ------------ 服务发现 ------------
        if (multiInstance) {
            await findService(app);
        } else {
            await findServiceSync(app);
        }
    });
};
