# translation.js

[![Build Status](https://img.shields.io/travis/lmk123/translation.js/master.svg?style=flat-square)](https://travis-ci.org/lmk123/translation.js)
[![Coverage Status](https://img.shields.io/coveralls/lmk123/translation.js/master.svg?style=flat-square)](https://coveralls.io/github/lmk123/translation.js?branch=master)
[![dependencies Status](https://img.shields.io/david/lmk123/translation.js.svg?style=flat-square)](https://david-dm.org/lmk123/translation.js)
[![devDependencies Status](https://img.shields.io/david/dev/lmk123/translation.js.svg?style=flat-square)](https://david-dm.org/lmk123/translation.js#info=devDependencies)
[![Bower Version](https://img.shields.io/bower/v/translation.js.svg?style=flat-square)](https://github.com/lmk123/translation.js/releases)
[![NPM Version](https://img.shields.io/npm/v/translation.js.svg?style=flat-square)](https://www.npmjs.com/package/translation.js)

## 为什么要用 translation.js？

### 统一接口调用方式

互联网上有很多可供免费使用的翻译接口，比如百度翻译、谷歌翻译、有道翻译、必应翻译等等，它们的接口不尽相同，但原理都是发起 HTTP 请求获取翻译结果。translation.js 的目标就是统一这些接口的调用方式，可以使用一种方法调用不同的多个接口。借助于 [Browserify](http://browserify.org/) 与 [SuperAgent](https://github.com/visionmedia/superagent) 的力量，它可以同时运行在 node.js 与浏览器端。

### 负载均衡

以百度翻译接口为例，你可以申请多个 apiKey 在 translation.js 中生成多个百度翻译实例，那么调用百度翻译时， translation.js 会比较各个实例调用的次数然后用次数最少的那个实例进行翻译。这样做能有效降低由于使用次数过多而导致 apiKey 被封禁的风险。

### 自定义翻译接口

如果某一个翻译接口没有被添加，你也可以很方便的自定义翻译接口。欢迎提交 PR 添加更多的翻译接口！

## 使用示例

```js
const Translation = require('translation.js'),
      t = new Translation();

t.create('BaiDu',{ apiKey:'YourApiKey - 1' });
t.create('BaiDu',{ apiKey:'YourApiKey - 2' });
// and more...

// 翻译
t.translate({ api:'BaiDu', text:'test' }).then(resultObj => console.dir(resultObj) , errMsg => console.log(errMsg));

// 获取这段文本的语音地址
t.audio({ api:'BaiDu', text:'test' }).then(audioUrl => console.log(audioUrl) , errMsg => console.log(errMsg));

// 检测语种
t.detect({ api:'BaiDu', text:'test' }).then(lan => console.log(lan) , errMsg => console.log(errMsg));
```

## 在浏览器中使用

载入 browser/translation.js ，构造函数会定义为全局变量 `Translation`。

**注意**：内置的翻译接口都不支持 [CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/Access_control_CORS)，请确保浏览器端的运行环境允许跨域，例如你可以在 [Chrome 扩展程序](https://developer.chrome.com/extensions) 中使用。

## 许可

[MIT](https://github.com/lmk123/translation.js/blob/master/LICENSE.md)

## One More Thing...

这个项目原本是[划词翻译](https://github.com/lmk123/crx-selection-translate)的一部分，被用于统一翻译接口的调用方式；在开发 v6.0 版的划词翻译中，我想扩展它的功能，然后发现它完全可以被抽离出来单独维护——于是我就这么做了 :)
