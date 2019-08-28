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
        consulConf.name += config.keys instanceof Array ? config.keys[0] : config.keys;
        await app.consul.agent.service.register(consulConf);
    }
}
/**
 * 服务发现
 * @param {Application} app app
 */
async function mount(app) {
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

        // ------------ 初始化consul客户端 ------------
        await initClient(app);
        // ------------ 服务注册 ------------
        await regService(app);
        // ------------ 服务发现 ------------
        await mount(app);
    });
};
