# egg-consul-plus

[![NPM version][npm-image]][npm-url]
[![build status][travis-image]][travis-url]
[![Test coverage][codecov-image]][codecov-url]
[![David deps][david-image]][david-url]
[![Known Vulnerabilities][snyk-image]][snyk-url]
[![npm download][download-image]][download-url]

[npm-image]: https://img.shields.io/npm/v/egg-consul-plus.svg?style=flat-square
[npm-url]: https://npmjs.org/package/egg-consul-plus
[travis-image]: https://img.shields.io/travis/eggjs/egg-consul-plus.svg?style=flat-square
[travis-url]: https://travis-ci.org/eggjs/egg-consul-plus
[codecov-image]: https://img.shields.io/codecov/c/github/eggjs/egg-consul-plus.svg?style=flat-square
[codecov-url]: https://codecov.io/github/eggjs/egg-consul-plus?branch=master
[david-image]: https://img.shields.io/david/eggjs/egg-consul-plus.svg?style=flat-square
[david-url]: https://david-dm.org/eggjs/egg-consul-plus
[snyk-image]: https://snyk.io/test/npm/egg-consul-plus/badge.svg?style=flat-square
[snyk-url]: https://snyk.io/test/npm/egg-consul-plus
[download-image]: https://img.shields.io/npm/dm/egg-consul-plus.svg?style=flat-square
[download-url]: https://npmjs.org/package/egg-consul-plus

<!--
Description here.
-->

## 依赖说明

### 依赖的 egg 版本

egg-consul-plus 版本 | egg 1.x
--- | ---
1.x | 😁
0.x | ❌

### 依赖的插件
<!--

如果有依赖其它插件，请在这里特别说明。如

- security
- multipart

-->
## 安装插件

```bash
$ npm i egg-consul-plus
// 或者
$ yarn add egg-consul-plus
```

## 开启插件

```js
// config/plugin.js
exports.consulPlus = {
  enable: true,
  package: 'egg-consul-plus',
};
```

## 使用场景

- Why and What: 基于 consul 开发的 egg 插件，实现服务的自动注册和发现。
- How: 开启插件后会在当前应用实例 app 上挂载 consul 客户端和 services 服务列表，分别用`app.consul`和`app.services`进行引用。
## 详细配置

```js
consul: {
    server: {
        host: '127.0.0.1', // 注册中心ip地址
        port: 8500 // 注册中心端口号
    },
    services: [ // 服务发现列表
        {
            referName: 'consulPlusTest', // 引用名，后续可用 app.services.referName 访问服务
            comment: 'consulPlusTest', // 备注
            serviceId: 'consul-plus-test' // 服务id
        }
    ],
    register: true, // 是否注册当前模块，默认为false
    name: 'consul-plus-test', // 注册id
    tags: ['consul-plus-test'], // 标签信息
    check: {
        http: 'http://127.0.0.1:7777', // 健康检测地址
        interval: '5s', // 健康检测间隔
        notes: 'http service check',
        status: 'critical'
    },
    address: '127.0.0.1', // 当前模块的注册地址
    port: 7777 // 当前模块的注册端口号
}
```

## 单元测试

<!-- 描述如何在单元测试中使用此插件，例如 schedule 如何触发。无则省略。-->

## 提问交流

请到 [egg issues](https://github.com/iamljw/egg-consul-plus/issues) 异步交流。

## License

[MIT](LICENSE)
