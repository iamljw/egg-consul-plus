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
 * 服务注册
 * @param {Application} app app
 */
async function regConsul(app) {
    const { config } = app;
    const { consul: consulConf } = config;
    const consul = require('consul')(Object.assign({},
        consulConf.server,
        {
            promisify: fromCallback,
            secure: false
        }));
    app.consul = consul;

    await consul.agent.service.register(consulConf);
}
/**
 * 服务发现
 * @param {Application} app app
 */
async function findService(app) {
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

module.exports = app => {
    app.beforeStart(async () => {

        // ------------ 服务注册 ------------
        await regConsul(app);
        // ------------ 服务发现 ------------
        await findService(app);
    });
};
