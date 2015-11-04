(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
// @see http://developer.baidu.com/wiki/index.php?title=帮助文档首页/百度翻译/翻译API

'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var request = require('superagent'),
    langsMap = {
  en: 'en',
  th: 'th',
  ru: 'ru',
  pt: 'pt',
  de: 'de',
  it: 'it',
  zh: 'zh',
  'zh-CN': 'zh',
  'zh-TW': 'zh',
  ja: 'jp',
  ko: 'kor',
  es: 'spa',
  fr: 'fra',
  ar: 'ara'
};

var BaiDu = (function () {

  /**
   * 百度翻译构造函数
   * @param {Object} config
   * @param {String} config.apiKey
   * @param {Number} [config.timeout=0] - 查询翻译结果或检测语言时的超时时间，单位毫秒，默认为零。
   */

  function BaiDu(config) {
    _classCallCheck(this, BaiDu);

    if (!config || !config.apiKey) {
      throw new Error('百度翻译必须要有API Key,否则无法使用翻译接口.');
    }

    this.apiKey = config.apiKey;
    this.timeout = config.timeout || 0;

    this.name = '百度翻译';
    this.link = 'http://fanyi.baidu.com/';
    this.errMsg = {
      52001: '百度翻译正忙，请稍后再试',
      52002: '百度翻译出现内部错误',
      52003: '百度封禁了此 api key，请重新申请'
    };
  }

  /**
   * 翻译的方法
   * @param queryObj
   * @returns {Promise}
   */

  _createClass(BaiDu, [{
    key: 'translate',
    value: function translate(queryObj) {
      var _this = this;

      return new Promise(function (resolve, reject) {
        request.get('https://openapi.baidu.com/public/2.0/bmt/translate').query({
          client_id: _this.apiKey,
          from: langsMap[queryObj.from] || 'auto',
          to: langsMap[queryObj.to] || 'auto',
          q: queryObj.text
        }).timeout(_this.timeout).end(function (err, res) {
          if (err) {
            reject(err);
          } else {
            resolve(_this.transform(res.body, queryObj));
          }
        });
      });
    }

    /**
     * 百度翻译返回的数据结构
     * @typedef {Object} BaiDuRes
     * @property {Number} [error_code] - 百度翻译错误码
     * @property {String} from - 翻译结果的源语种，百度格式的
     * @property {String} to - 翻译结果的目标语种，百度格式的
     * @property {{src:String,dst:String}[]} [trans_result] - 翻译结果，偶尔抽风可能没有
     */

    /**
     * 将百度接口的数据转换为统一格式
     * @param {BaiDuRes} rawRes
     * @param {Query} queryObj
     * @returns {{}}
     */

  }, {
    key: 'transform',
    value: function transform(rawRes, queryObj) {
      var obj = {
        text: queryObj.text,
        response: rawRes
      };

      //如果有错误码则直接处理错误
      if (rawRes.error_code) {
        obj.error = this.errMsg[rawRes.error_code];
      } else {
        obj.to = rawRes.to;
        obj.from = rawRes.from;
        obj.linkToResult = this.link + ('#auto/' + rawRes.to + '/' + queryObj.text);
        if (Array.isArray(rawRes.trans_result)) {
          obj.result = [];
          rawRes.trans_result.forEach(function (v) {
            return obj.result.push(v.dst);
          });
          obj.result = obj.result.join('\n');
        } else {
          obj.result = '啊哦，百度返回了一个奇怪的东西，等一会儿再试试看吧。';
        }
      }

      return obj;
    }

    /**
     * 检测语种的方法， 返回的语种为百度自己格式的语种。
     * @param {Query} queryObj
     * @returns {Promise}
     */

  }, {
    key: 'detect',
    value: function detect(queryObj) {
      return new Promise(function (resolve, reject) {
        var from = queryObj.from;

        if (from) {
          var lang = langsMap[from];
          if (lang) {
            resolve(lang);
          } else {
            reject(null);
          }
          return;
        }

        request.post('http://fanyi.baidu.com/langdetect').send('query=' + queryObj.text.slice(0, 73)).end(function (err, res) {
          if (err) {
            reject(err);
          } else {
            var body = res.body;
            if (0 === body.error) {
              resolve(body.lan);
            } else {
              reject(null);
            }
          }
        });
      });
    }

    /**
     * 返回语音播放的 url
     * @param queryObj
     * @returns {Promise}
     */

  }, {
    key: 'audio',
    value: function audio(queryObj) {
      return this.detect(queryObj).then(function (lang) {
        return 'http://fanyi.baidu.com/gettts?lan=' + lang + '&text=' + queryObj.text + '&spd=2&source=web';
      });
    }
  }]);

  return BaiDu;
})();

module.exports = BaiDu;

},{"superagent":6}],2:[function(require,module,exports){
/**
 * 一个 API 对象
 * @typedef {Object} API
 * @property {String} id - 此接口的唯一 id
 * @property {String} name - 此接口的中文名称
 * @property {String} link - 此接口的在线网址
 * @property {Function} detect - 传递一段文本，返回一个 Promise。正常结果为此 API 自己支持的语种名称，如不支持则 reject null，或者如果出现网络错误则 reject SuperAgent 的 error 对象
 * @property {Function} translate - 传递一个查询对象，返回一个 Promise。正常结果为翻译结果对象，如果出现网络错误则 reject SuperAgent 的 error 对象
 * @property {Function} audio - 传递一个查询对象，返回一个 Promise。正常结果为一段指向这段文本的音频地址，如不支持则 reject null，或者如果出现网络错误则 reject SuperAgent 的 error 对象
 */

/**
 * 查询对象。注意：查询对象里的语种都是谷歌翻译格式的
 * @typedef {Object} Query
 * @property {String} text - 要查询或者朗读的文本
 * @property {String} [from="auto"] - 这段文本的语种
 * @property {String} [to="auto"] - 期望得到的翻译语种
 * @property {String} [api] - 期望使用哪种翻译引擎翻译或朗读
 */

/**
 * @typedef {Object} Result
 *
 * 无论正常与否，下面的属性都必有
 * @property {API} api - 使用哪个接口查询到的此次结果
 * @property {String} text - 等同于 Query 中的 text
 * @property {Object} response - 此翻译引擎的原始未经转换的数据
 *
 * 查询结果正常的情况下：
 * @property {String} [result] - 查询结果
 * @property {String} [linkToResult] - 此翻译引擎的在线翻译地址
 * @property {String} [from] - 此翻译引擎返回的源语种，注意这不是谷歌格式的语种，也不一定是 Query 里指定的语种
 * @property {String} [to] - 此翻译引擎返回的目标语种，注意这不是谷歌格式的语种，也不一定是 Query 里指定的语种
 * @property {String[]} [detailed] - 详细释义
 * @property {String} [phonetic] - 音标
 *
 * 查询结果异常的情况下：
 * @property {String} [error] - 错误消息，出错时必选
 */

'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Translation = (function () {
  _createClass(Translation, null, [{
    key: 'errorType',

    /**
     * 判断 superAgent 的错误对象的类型
     * @param {{timeout?:Number,status?:Number}} superAgentErr
     * @returns {String}
     */
    value: function errorType(superAgentErr) {
      var type = undefined;
      if (superAgentErr.timeout) {
        type = 'timeout';
      } else if (!superAgentErr.status) {
        type = 'network error';
      } else {
        type = 'server error';
      }
      return type;
    }
  }]);

  function Translation() {
    _classCallCheck(this, Translation);

    this.defaultApi = 'BaiDu';
    this.api = {};
    this.errMsg = {
      timeout: '查询时超时了，请稍后再试。',
      'network error': '网络错误，请检查网络设置，然后重试。',
      'server error': '服务器出错了，请稍候重试。'
    };
  }

  /**
   * 创建一个翻译实例
   * @param {String} apiName
   * @param {*} config
   * @returns {API}
   */

  _createClass(Translation, [{
    key: 'create',
    value: function create(apiName, config) {
      var api = this.api,
          apiArr = api[apiName] || (api[apiName] = []),
          a = new Translation[apiName](config);

      apiArr.push(a);

      return a;
    }

    /**
     * 翻译方法
     * @param {Query} queryObj
     * @returns {Promise}
     */

  }, {
    key: 'translate',
    value: function translate(queryObj) {
      return this.call('translate', queryObj);
    }

    /**
     * 返回语音 url 的方法
     * @param queryObj
     * @returns {Promise}
     */

  }, {
    key: 'audio',
    value: function audio(queryObj) {
      return this.call('audio', queryObj);
    }

    /**
     * 检测语种的方法。注意，此方法返回的语种类型是 API 相关的，可能不会遵守标准。
     * @param queryObj
     * @returns {Promise}
     */

  }, {
    key: 'detect',
    value: function detect(queryObj) {
      return this.call('detect', queryObj);
    }

    /**
     * 调用实例方法
     * @param {String} method - 想调用实例的哪个方法
     * @param {Query} queryObj
     * @returns {Promise}
     */

  }, {
    key: 'call',
    value: function call(method, queryObj) {
      var _this = this;

      return new Promise(function (resolve, reject) {
        var apiArr = _this.api[queryObj.api || _this.defaultApi];
        if (!apiArr) {
          return reject('没有注册 ' + queryObj.api + ' API。');
        }

        var a = apiArr.shift();
        apiArr.push(a);
        a[method](queryObj).then(resolve, function (superAgentError) {
          reject(_this.errMsg[Translation.errorType(superAgentError)]);
        });
      });
    }
  }]);

  return Translation;
})();

// 绑定构造函数

[require('./baidu'), require('./youdao')].forEach(function (klass) {
  Translation[klass.name] = klass;
});

module.exports = Translation;

if (typeof window !== 'undefined') {
  window.Translation = Translation;
}

},{"./baidu":1,"./youdao":3}],3:[function(require,module,exports){
// @see http://fanyi.youdao.com/openapi?path=data-mode#bd

/**
 * 有道翻译返回的数据结构
 * @typedef {Object} YouDaoRes
 * @property {Number} errorCode - 有道翻译错误码，0 表示正常
 * @property {{phonetic?:String,explains?:String[]}} [basic] - 翻译结果的源语种，百度格式的
 * @property {String[]} [translation] - 翻译结果，偶尔抽风可能没有
 */

'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _typeof(obj) { return obj && typeof Symbol !== "undefined" && obj.constructor === Symbol ? "symbol" : typeof obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var request = require('superagent'),
    langsMap = {
  en: 'eng',
  ja: 'jap',
  ko: 'ko',
  fr: 'fr'
};

var YouDao = (function () {
  _createClass(YouDao, null, [{
    key: 'checkRes',

    /**
     * 检查有道服务器返回的数据格式是否正确。运营商（例如长城宽带）偶尔也会篡改服务器返回的数据格式
     * @param {YouDaoRes} rawRes
     * @returns {Boolean}
     */
    value: function checkRes(rawRes) {

      // 格式必须是 object
      if ('object' !== (typeof rawRes === 'undefined' ? 'undefined' : _typeof(rawRes))) {
        return false;
      }

      // errorCode 必须有
      if (!rawRes.hasOwnProperty('errorCode')) {
        return false;
      }

      // 正常情况下，translation 和 basic.explains 两者必有其一
      if (0 === rawRes.errorCode && !Array.isArray(rawRes.translation) && !(rawRes.basic && Array.isArray(rawRes.basic.explains))) {
        return false;
      }

      return true;
    }

    /**
     * 有道翻译构造函数
     * @param {Object} config
     * @param {String} config.apiKey
     * @param {String} config.keyFrom
     * @param {Number} [config.timeout=0] - 查询翻译结果或检测语言时的超时时间，单位毫秒，默认为零。
     */

  }]);

  function YouDao(config) {
    _classCallCheck(this, YouDao);

    if (!config || !config.apiKey || !config.keyFrom) {
      throw new Error('有道翻译必须要有API Key及keyFrom,否则无法使用翻译接口.');
    }

    this.apiKey = config.apiKey;
    this.keyFrom = config.keyFrom;
    this.timeout = config.timeout || 0;

    this.name = '有道翻译';
    this.link = 'http://fanyi.youdao.com/';
    this.errMsg = {
      20: '有道翻译服务一次性只能翻译200个字符',
      30: '有道翻译暂时无法翻译这段文本',
      40: '有道翻译不支持这种语言',
      50: 'api key被封禁',
      60: '无词典结果'
    };
  }

  /**
   * 翻译的方法。有道不支持指定源语种或目标语种。
   * @param queryObj
   * @returns {Promise}
   */

  _createClass(YouDao, [{
    key: 'translate',
    value: function translate(queryObj) {
      var _this = this;

      return new Promise(function (resolve, reject) {
        request.get('https://fanyi.youdao.com/openapi.do').query({
          key: _this.apiKey,
          keyfrom: _this.keyFrom,
          type: "data",
          doctype: "json",
          version: "1.1",
          q: queryObj.text
        }).timeout(_this.timeout).end(function (err, res) {
          if (err) {
            reject(err);
          } else {
            resolve(_this.transform(res.body, queryObj));
          }
        });
      });
    }

    /**
     * 将有道接口的数据转换为统一格式
     * @param {YouDaoRes} rawRes
     * @param {Query} queryObj
     * @returns {{}}
     */

  }, {
    key: 'transform',
    value: function transform(rawRes, queryObj) {
      var obj = {
        text: queryObj.text,
        response: rawRes
      };

      // 运营商偶尔会将数据结构改掉
      if (!YouDao.checkRes(rawRes)) {
        obj.error = '翻译服务器返回了错误的数据，请稍后重试';
        return obj;
      }

      //如果有错误码则直接处理错误
      if (0 !== rawRes.errorCode) {
        obj.error = this.errMsg[rawRes.errorCode];
      } else {
        obj.linkToResult = 'http://fanyi.youdao.com/translate?i=' + queryObj.text;

        /*
         * 对于单词和短语，有道翻译有详细的解释，但对于长文本则没有；
         * rawRes.basic.explains 是一个数组，每个元素都是对查询的文本的详细解释。
         * rawRes.basic下还有一个 phonetic 字符串属性，表示查询单词的音标
         */
        var basic = rawRes.basic;
        if (basic) {
          if (Array.isArray(basic.explains)) {
            obj.detailed = basic.explains;
          }

          // 如果有音标
          if (basic.phonetic) {
            obj.phonetic = basic.phonetic;
          }
        }

        //翻译结果，虽然这是一个数组，但至今只有一个元素
        if (Array.isArray(rawRes.translation)) {
          obj.result = rawRes.translation.join('\n');
        }
      }

      return obj;
    }

    /**
     * 检测语种的方法，有道没有，所以若提供源语种就总是返回 null
     * @param {Query} queryObj
     * @returns {Promise}
     */

  }, {
    key: 'detect',
    value: function detect(queryObj) {
      return new Promise(function (resolve, reject) {
        var from = queryObj.from;

        if (!from) {
          return reject(null);
        }

        var lang = langsMap[from];

        if (lang) {
          resolve(lang);
        } else {
          reject(null);
        }
      });
    }

    /**
     * 返回语音播放的 url
     * @param queryObj
     * @returns {Promise}
     */

  }, {
    key: 'audio',
    value: function audio(queryObj) {
      return this.detect(queryObj).then(function (lang) {
        return 'http://tts.youdao.com/fanyivoice?keyfrom=fanyi%2Eweb%2Eindex&le=' + lang + '&word=' + queryObj.text;
      });
    }
  }]);

  return YouDao;
})();

module.exports = YouDao;

},{"superagent":6}],4:[function(require,module,exports){

/**
 * Expose `Emitter`.
 */

module.exports = Emitter;

/**
 * Initialize a new `Emitter`.
 *
 * @api public
 */

function Emitter(obj) {
  if (obj) return mixin(obj);
};

/**
 * Mixin the emitter properties.
 *
 * @param {Object} obj
 * @return {Object}
 * @api private
 */

function mixin(obj) {
  for (var key in Emitter.prototype) {
    obj[key] = Emitter.prototype[key];
  }
  return obj;
}

/**
 * Listen on the given `event` with `fn`.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.on =
Emitter.prototype.addEventListener = function(event, fn){
  this._callbacks = this._callbacks || {};
  (this._callbacks[event] = this._callbacks[event] || [])
    .push(fn);
  return this;
};

/**
 * Adds an `event` listener that will be invoked a single
 * time then automatically removed.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.once = function(event, fn){
  var self = this;
  this._callbacks = this._callbacks || {};

  function on() {
    self.off(event, on);
    fn.apply(this, arguments);
  }

  on.fn = fn;
  this.on(event, on);
  return this;
};

/**
 * Remove the given callback for `event` or all
 * registered callbacks.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.off =
Emitter.prototype.removeListener =
Emitter.prototype.removeAllListeners =
Emitter.prototype.removeEventListener = function(event, fn){
  this._callbacks = this._callbacks || {};

  // all
  if (0 == arguments.length) {
    this._callbacks = {};
    return this;
  }

  // specific event
  var callbacks = this._callbacks[event];
  if (!callbacks) return this;

  // remove all handlers
  if (1 == arguments.length) {
    delete this._callbacks[event];
    return this;
  }

  // remove specific handler
  var cb;
  for (var i = 0; i < callbacks.length; i++) {
    cb = callbacks[i];
    if (cb === fn || cb.fn === fn) {
      callbacks.splice(i, 1);
      break;
    }
  }
  return this;
};

/**
 * Emit `event` with the given args.
 *
 * @param {String} event
 * @param {Mixed} ...
 * @return {Emitter}
 */

Emitter.prototype.emit = function(event){
  this._callbacks = this._callbacks || {};
  var args = [].slice.call(arguments, 1)
    , callbacks = this._callbacks[event];

  if (callbacks) {
    callbacks = callbacks.slice(0);
    for (var i = 0, len = callbacks.length; i < len; ++i) {
      callbacks[i].apply(this, args);
    }
  }

  return this;
};

/**
 * Return array of callbacks for `event`.
 *
 * @param {String} event
 * @return {Array}
 * @api public
 */

Emitter.prototype.listeners = function(event){
  this._callbacks = this._callbacks || {};
  return this._callbacks[event] || [];
};

/**
 * Check if this emitter has `event` handlers.
 *
 * @param {String} event
 * @return {Boolean}
 * @api public
 */

Emitter.prototype.hasListeners = function(event){
  return !! this.listeners(event).length;
};

},{}],5:[function(require,module,exports){

/**
 * Reduce `arr` with `fn`.
 *
 * @param {Array} arr
 * @param {Function} fn
 * @param {Mixed} initial
 *
 * TODO: combatible error handling?
 */

module.exports = function(arr, fn, initial){  
  var idx = 0;
  var len = arr.length;
  var curr = arguments.length == 3
    ? initial
    : arr[idx++];

  while (idx < len) {
    curr = fn.call(null, curr, arr[idx], ++idx, arr);
  }
  
  return curr;
};
},{}],6:[function(require,module,exports){
/**
 * Module dependencies.
 */

var Emitter = require('emitter');
var reduce = require('reduce');

/**
 * Root reference for iframes.
 */

var root;
if (typeof window !== 'undefined') { // Browser window
  root = window;
} else if (typeof self !== 'undefined') { // Web Worker
  root = self;
} else { // Other environments
  root = this;
}

/**
 * Noop.
 */

function noop(){};

/**
 * Check if `obj` is a host object,
 * we don't want to serialize these :)
 *
 * TODO: future proof, move to compoent land
 *
 * @param {Object} obj
 * @return {Boolean}
 * @api private
 */

function isHost(obj) {
  var str = {}.toString.call(obj);

  switch (str) {
    case '[object File]':
    case '[object Blob]':
    case '[object FormData]':
      return true;
    default:
      return false;
  }
}

/**
 * Determine XHR.
 */

request.getXHR = function () {
  if (root.XMLHttpRequest
      && (!root.location || 'file:' != root.location.protocol
          || !root.ActiveXObject)) {
    return new XMLHttpRequest;
  } else {
    try { return new ActiveXObject('Microsoft.XMLHTTP'); } catch(e) {}
    try { return new ActiveXObject('Msxml2.XMLHTTP.6.0'); } catch(e) {}
    try { return new ActiveXObject('Msxml2.XMLHTTP.3.0'); } catch(e) {}
    try { return new ActiveXObject('Msxml2.XMLHTTP'); } catch(e) {}
  }
  return false;
};

/**
 * Removes leading and trailing whitespace, added to support IE.
 *
 * @param {String} s
 * @return {String}
 * @api private
 */

var trim = ''.trim
  ? function(s) { return s.trim(); }
  : function(s) { return s.replace(/(^\s*|\s*$)/g, ''); };

/**
 * Check if `obj` is an object.
 *
 * @param {Object} obj
 * @return {Boolean}
 * @api private
 */

function isObject(obj) {
  return obj === Object(obj);
}

/**
 * Serialize the given `obj`.
 *
 * @param {Object} obj
 * @return {String}
 * @api private
 */

function serialize(obj) {
  if (!isObject(obj)) return obj;
  var pairs = [];
  for (var key in obj) {
    if (null != obj[key]) {
      pairs.push(encodeURIComponent(key)
        + '=' + encodeURIComponent(obj[key]));
    }
  }
  return pairs.join('&');
}

/**
 * Expose serialization method.
 */

 request.serializeObject = serialize;

 /**
  * Parse the given x-www-form-urlencoded `str`.
  *
  * @param {String} str
  * @return {Object}
  * @api private
  */

function parseString(str) {
  var obj = {};
  var pairs = str.split('&');
  var parts;
  var pair;

  for (var i = 0, len = pairs.length; i < len; ++i) {
    pair = pairs[i];
    parts = pair.split('=');
    obj[decodeURIComponent(parts[0])] = decodeURIComponent(parts[1]);
  }

  return obj;
}

/**
 * Expose parser.
 */

request.parseString = parseString;

/**
 * Default MIME type map.
 *
 *     superagent.types.xml = 'application/xml';
 *
 */

request.types = {
  html: 'text/html',
  json: 'application/json',
  xml: 'application/xml',
  urlencoded: 'application/x-www-form-urlencoded',
  'form': 'application/x-www-form-urlencoded',
  'form-data': 'application/x-www-form-urlencoded'
};

/**
 * Default serialization map.
 *
 *     superagent.serialize['application/xml'] = function(obj){
 *       return 'generated xml here';
 *     };
 *
 */

 request.serialize = {
   'application/x-www-form-urlencoded': serialize,
   'application/json': JSON.stringify
 };

 /**
  * Default parsers.
  *
  *     superagent.parse['application/xml'] = function(str){
  *       return { object parsed from str };
  *     };
  *
  */

request.parse = {
  'application/x-www-form-urlencoded': parseString,
  'application/json': JSON.parse
};

/**
 * Parse the given header `str` into
 * an object containing the mapped fields.
 *
 * @param {String} str
 * @return {Object}
 * @api private
 */

function parseHeader(str) {
  var lines = str.split(/\r?\n/);
  var fields = {};
  var index;
  var line;
  var field;
  var val;

  lines.pop(); // trailing CRLF

  for (var i = 0, len = lines.length; i < len; ++i) {
    line = lines[i];
    index = line.indexOf(':');
    field = line.slice(0, index).toLowerCase();
    val = trim(line.slice(index + 1));
    fields[field] = val;
  }

  return fields;
}

/**
 * Return the mime type for the given `str`.
 *
 * @param {String} str
 * @return {String}
 * @api private
 */

function type(str){
  return str.split(/ *; */).shift();
};

/**
 * Return header field parameters.
 *
 * @param {String} str
 * @return {Object}
 * @api private
 */

function params(str){
  return reduce(str.split(/ *; */), function(obj, str){
    var parts = str.split(/ *= */)
      , key = parts.shift()
      , val = parts.shift();

    if (key && val) obj[key] = val;
    return obj;
  }, {});
};

/**
 * Initialize a new `Response` with the given `xhr`.
 *
 *  - set flags (.ok, .error, etc)
 *  - parse header
 *
 * Examples:
 *
 *  Aliasing `superagent` as `request` is nice:
 *
 *      request = superagent;
 *
 *  We can use the promise-like API, or pass callbacks:
 *
 *      request.get('/').end(function(res){});
 *      request.get('/', function(res){});
 *
 *  Sending data can be chained:
 *
 *      request
 *        .post('/user')
 *        .send({ name: 'tj' })
 *        .end(function(res){});
 *
 *  Or passed to `.send()`:
 *
 *      request
 *        .post('/user')
 *        .send({ name: 'tj' }, function(res){});
 *
 *  Or passed to `.post()`:
 *
 *      request
 *        .post('/user', { name: 'tj' })
 *        .end(function(res){});
 *
 * Or further reduced to a single call for simple cases:
 *
 *      request
 *        .post('/user', { name: 'tj' }, function(res){});
 *
 * @param {XMLHTTPRequest} xhr
 * @param {Object} options
 * @api private
 */

function Response(req, options) {
  options = options || {};
  this.req = req;
  this.xhr = this.req.xhr;
  // responseText is accessible only if responseType is '' or 'text' and on older browsers
  this.text = ((this.req.method !='HEAD' && (this.xhr.responseType === '' || this.xhr.responseType === 'text')) || typeof this.xhr.responseType === 'undefined')
     ? this.xhr.responseText
     : null;
  this.statusText = this.req.xhr.statusText;
  this.setStatusProperties(this.xhr.status);
  this.header = this.headers = parseHeader(this.xhr.getAllResponseHeaders());
  // getAllResponseHeaders sometimes falsely returns "" for CORS requests, but
  // getResponseHeader still works. so we get content-type even if getting
  // other headers fails.
  this.header['content-type'] = this.xhr.getResponseHeader('content-type');
  this.setHeaderProperties(this.header);
  this.body = this.req.method != 'HEAD'
    ? this.parseBody(this.text ? this.text : this.xhr.response)
    : null;
}

/**
 * Get case-insensitive `field` value.
 *
 * @param {String} field
 * @return {String}
 * @api public
 */

Response.prototype.get = function(field){
  return this.header[field.toLowerCase()];
};

/**
 * Set header related properties:
 *
 *   - `.type` the content type without params
 *
 * A response of "Content-Type: text/plain; charset=utf-8"
 * will provide you with a `.type` of "text/plain".
 *
 * @param {Object} header
 * @api private
 */

Response.prototype.setHeaderProperties = function(header){
  // content-type
  var ct = this.header['content-type'] || '';
  this.type = type(ct);

  // params
  var obj = params(ct);
  for (var key in obj) this[key] = obj[key];
};

/**
 * Force given parser
 * 
 * Sets the body parser no matter type.
 * 
 * @param {Function}
 * @api public
 */

Response.prototype.parse = function(fn){
  this.parser = fn;
  return this;
};

/**
 * Parse the given body `str`.
 *
 * Used for auto-parsing of bodies. Parsers
 * are defined on the `superagent.parse` object.
 *
 * @param {String} str
 * @return {Mixed}
 * @api private
 */

Response.prototype.parseBody = function(str){
  var parse = this.parser || request.parse[this.type];
  return parse && str && (str.length || str instanceof Object)
    ? parse(str)
    : null;
};

/**
 * Set flags such as `.ok` based on `status`.
 *
 * For example a 2xx response will give you a `.ok` of __true__
 * whereas 5xx will be __false__ and `.error` will be __true__. The
 * `.clientError` and `.serverError` are also available to be more
 * specific, and `.statusType` is the class of error ranging from 1..5
 * sometimes useful for mapping respond colors etc.
 *
 * "sugar" properties are also defined for common cases. Currently providing:
 *
 *   - .noContent
 *   - .badRequest
 *   - .unauthorized
 *   - .notAcceptable
 *   - .notFound
 *
 * @param {Number} status
 * @api private
 */

Response.prototype.setStatusProperties = function(status){
  // handle IE9 bug: http://stackoverflow.com/questions/10046972/msie-returns-status-code-of-1223-for-ajax-request
  if (status === 1223) {
    status = 204;
  }

  var type = status / 100 | 0;

  // status / class
  this.status = this.statusCode = status;
  this.statusType = type;

  // basics
  this.info = 1 == type;
  this.ok = 2 == type;
  this.clientError = 4 == type;
  this.serverError = 5 == type;
  this.error = (4 == type || 5 == type)
    ? this.toError()
    : false;

  // sugar
  this.accepted = 202 == status;
  this.noContent = 204 == status;
  this.badRequest = 400 == status;
  this.unauthorized = 401 == status;
  this.notAcceptable = 406 == status;
  this.notFound = 404 == status;
  this.forbidden = 403 == status;
};

/**
 * Return an `Error` representative of this response.
 *
 * @return {Error}
 * @api public
 */

Response.prototype.toError = function(){
  var req = this.req;
  var method = req.method;
  var url = req.url;

  var msg = 'cannot ' + method + ' ' + url + ' (' + this.status + ')';
  var err = new Error(msg);
  err.status = this.status;
  err.method = method;
  err.url = url;

  return err;
};

/**
 * Expose `Response`.
 */

request.Response = Response;

/**
 * Initialize a new `Request` with the given `method` and `url`.
 *
 * @param {String} method
 * @param {String} url
 * @api public
 */

function Request(method, url) {
  var self = this;
  Emitter.call(this);
  this._query = this._query || [];
  this.method = method;
  this.url = url;
  this.header = {};
  this._header = {};
  this.on('end', function(){
    var err = null;
    var res = null;

    try {
      res = new Response(self);
    } catch(e) {
      err = new Error('Parser is unable to parse the response');
      err.parse = true;
      err.original = e;
      return self.callback(err);
    }

    self.emit('response', res);

    if (err) {
      return self.callback(err, res);
    }

    if (res.status >= 200 && res.status < 300) {
      return self.callback(err, res);
    }

    var new_err = new Error(res.statusText || 'Unsuccessful HTTP response');
    new_err.original = err;
    new_err.response = res;
    new_err.status = res.status;

    self.callback(new_err, res);
  });
}

/**
 * Mixin `Emitter`.
 */

Emitter(Request.prototype);

/**
 * Allow for extension
 */

Request.prototype.use = function(fn) {
  fn(this);
  return this;
}

/**
 * Set timeout to `ms`.
 *
 * @param {Number} ms
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.timeout = function(ms){
  this._timeout = ms;
  return this;
};

/**
 * Clear previous timeout.
 *
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.clearTimeout = function(){
  this._timeout = 0;
  clearTimeout(this._timer);
  return this;
};

/**
 * Abort the request, and clear potential timeout.
 *
 * @return {Request}
 * @api public
 */

Request.prototype.abort = function(){
  if (this.aborted) return;
  this.aborted = true;
  this.xhr.abort();
  this.clearTimeout();
  this.emit('abort');
  return this;
};

/**
 * Set header `field` to `val`, or multiple fields with one object.
 *
 * Examples:
 *
 *      req.get('/')
 *        .set('Accept', 'application/json')
 *        .set('X-API-Key', 'foobar')
 *        .end(callback);
 *
 *      req.get('/')
 *        .set({ Accept: 'application/json', 'X-API-Key': 'foobar' })
 *        .end(callback);
 *
 * @param {String|Object} field
 * @param {String} val
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.set = function(field, val){
  if (isObject(field)) {
    for (var key in field) {
      this.set(key, field[key]);
    }
    return this;
  }
  this._header[field.toLowerCase()] = val;
  this.header[field] = val;
  return this;
};

/**
 * Remove header `field`.
 *
 * Example:
 *
 *      req.get('/')
 *        .unset('User-Agent')
 *        .end(callback);
 *
 * @param {String} field
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.unset = function(field){
  delete this._header[field.toLowerCase()];
  delete this.header[field];
  return this;
};

/**
 * Get case-insensitive header `field` value.
 *
 * @param {String} field
 * @return {String}
 * @api private
 */

Request.prototype.getHeader = function(field){
  return this._header[field.toLowerCase()];
};

/**
 * Set Content-Type to `type`, mapping values from `request.types`.
 *
 * Examples:
 *
 *      superagent.types.xml = 'application/xml';
 *
 *      request.post('/')
 *        .type('xml')
 *        .send(xmlstring)
 *        .end(callback);
 *
 *      request.post('/')
 *        .type('application/xml')
 *        .send(xmlstring)
 *        .end(callback);
 *
 * @param {String} type
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.type = function(type){
  this.set('Content-Type', request.types[type] || type);
  return this;
};

/**
 * Set Accept to `type`, mapping values from `request.types`.
 *
 * Examples:
 *
 *      superagent.types.json = 'application/json';
 *
 *      request.get('/agent')
 *        .accept('json')
 *        .end(callback);
 *
 *      request.get('/agent')
 *        .accept('application/json')
 *        .end(callback);
 *
 * @param {String} accept
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.accept = function(type){
  this.set('Accept', request.types[type] || type);
  return this;
};

/**
 * Set Authorization field value with `user` and `pass`.
 *
 * @param {String} user
 * @param {String} pass
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.auth = function(user, pass){
  var str = btoa(user + ':' + pass);
  this.set('Authorization', 'Basic ' + str);
  return this;
};

/**
* Add query-string `val`.
*
* Examples:
*
*   request.get('/shoes')
*     .query('size=10')
*     .query({ color: 'blue' })
*
* @param {Object|String} val
* @return {Request} for chaining
* @api public
*/

Request.prototype.query = function(val){
  if ('string' != typeof val) val = serialize(val);
  if (val) this._query.push(val);
  return this;
};

/**
 * Write the field `name` and `val` for "multipart/form-data"
 * request bodies.
 *
 * ``` js
 * request.post('/upload')
 *   .field('foo', 'bar')
 *   .end(callback);
 * ```
 *
 * @param {String} name
 * @param {String|Blob|File} val
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.field = function(name, val){
  if (!this._formData) this._formData = new root.FormData();
  this._formData.append(name, val);
  return this;
};

/**
 * Queue the given `file` as an attachment to the specified `field`,
 * with optional `filename`.
 *
 * ``` js
 * request.post('/upload')
 *   .attach(new Blob(['<a id="a"><b id="b">hey!</b></a>'], { type: "text/html"}))
 *   .end(callback);
 * ```
 *
 * @param {String} field
 * @param {Blob|File} file
 * @param {String} filename
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.attach = function(field, file, filename){
  if (!this._formData) this._formData = new root.FormData();
  this._formData.append(field, file, filename);
  return this;
};

/**
 * Send `data`, defaulting the `.type()` to "json" when
 * an object is given.
 *
 * Examples:
 *
 *       // querystring
 *       request.get('/search')
 *         .end(callback)
 *
 *       // multiple data "writes"
 *       request.get('/search')
 *         .send({ search: 'query' })
 *         .send({ range: '1..5' })
 *         .send({ order: 'desc' })
 *         .end(callback)
 *
 *       // manual json
 *       request.post('/user')
 *         .type('json')
 *         .send('{"name":"tj"})
 *         .end(callback)
 *
 *       // auto json
 *       request.post('/user')
 *         .send({ name: 'tj' })
 *         .end(callback)
 *
 *       // manual x-www-form-urlencoded
 *       request.post('/user')
 *         .type('form')
 *         .send('name=tj')
 *         .end(callback)
 *
 *       // auto x-www-form-urlencoded
 *       request.post('/user')
 *         .type('form')
 *         .send({ name: 'tj' })
 *         .end(callback)
 *
 *       // defaults to x-www-form-urlencoded
  *      request.post('/user')
  *        .send('name=tobi')
  *        .send('species=ferret')
  *        .end(callback)
 *
 * @param {String|Object} data
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.send = function(data){
  var obj = isObject(data);
  var type = this.getHeader('Content-Type');

  // merge
  if (obj && isObject(this._data)) {
    for (var key in data) {
      this._data[key] = data[key];
    }
  } else if ('string' == typeof data) {
    if (!type) this.type('form');
    type = this.getHeader('Content-Type');
    if ('application/x-www-form-urlencoded' == type) {
      this._data = this._data
        ? this._data + '&' + data
        : data;
    } else {
      this._data = (this._data || '') + data;
    }
  } else {
    this._data = data;
  }

  if (!obj || isHost(data)) return this;
  if (!type) this.type('json');
  return this;
};

/**
 * Invoke the callback with `err` and `res`
 * and handle arity check.
 *
 * @param {Error} err
 * @param {Response} res
 * @api private
 */

Request.prototype.callback = function(err, res){
  var fn = this._callback;
  this.clearTimeout();
  fn(err, res);
};

/**
 * Invoke callback with x-domain error.
 *
 * @api private
 */

Request.prototype.crossDomainError = function(){
  var err = new Error('Origin is not allowed by Access-Control-Allow-Origin');
  err.crossDomain = true;
  this.callback(err);
};

/**
 * Invoke callback with timeout error.
 *
 * @api private
 */

Request.prototype.timeoutError = function(){
  var timeout = this._timeout;
  var err = new Error('timeout of ' + timeout + 'ms exceeded');
  err.timeout = timeout;
  this.callback(err);
};

/**
 * Enable transmission of cookies with x-domain requests.
 *
 * Note that for this to work the origin must not be
 * using "Access-Control-Allow-Origin" with a wildcard,
 * and also must set "Access-Control-Allow-Credentials"
 * to "true".
 *
 * @api public
 */

Request.prototype.withCredentials = function(){
  this._withCredentials = true;
  return this;
};

/**
 * Initiate request, invoking callback `fn(res)`
 * with an instanceof `Response`.
 *
 * @param {Function} fn
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.end = function(fn){
  var self = this;
  var xhr = this.xhr = request.getXHR();
  var query = this._query.join('&');
  var timeout = this._timeout;
  var data = this._formData || this._data;

  // store callback
  this._callback = fn || noop;

  // state change
  xhr.onreadystatechange = function(){
    if (4 != xhr.readyState) return;

    // In IE9, reads to any property (e.g. status) off of an aborted XHR will
    // result in the error "Could not complete the operation due to error c00c023f"
    var status;
    try { status = xhr.status } catch(e) { status = 0; }

    if (0 == status) {
      if (self.timedout) return self.timeoutError();
      if (self.aborted) return;
      return self.crossDomainError();
    }
    self.emit('end');
  };

  // progress
  var handleProgress = function(e){
    if (e.total > 0) {
      e.percent = e.loaded / e.total * 100;
    }
    self.emit('progress', e);
  };
  if (this.hasListeners('progress')) {
    xhr.onprogress = handleProgress;
  }
  try {
    if (xhr.upload && this.hasListeners('progress')) {
      xhr.upload.onprogress = handleProgress;
    }
  } catch(e) {
    // Accessing xhr.upload fails in IE from a web worker, so just pretend it doesn't exist.
    // Reported here:
    // https://connect.microsoft.com/IE/feedback/details/837245/xmlhttprequest-upload-throws-invalid-argument-when-used-from-web-worker-context
  }

  // timeout
  if (timeout && !this._timer) {
    this._timer = setTimeout(function(){
      self.timedout = true;
      self.abort();
    }, timeout);
  }

  // querystring
  if (query) {
    query = request.serializeObject(query);
    this.url += ~this.url.indexOf('?')
      ? '&' + query
      : '?' + query;
  }

  // initiate request
  xhr.open(this.method, this.url, true);

  // CORS
  if (this._withCredentials) xhr.withCredentials = true;

  // body
  if ('GET' != this.method && 'HEAD' != this.method && 'string' != typeof data && !isHost(data)) {
    // serialize stuff
    var contentType = this.getHeader('Content-Type');
    var serialize = request.serialize[contentType ? contentType.split(';')[0] : ''];
    if (serialize) data = serialize(data);
  }

  // set header fields
  for (var field in this.header) {
    if (null == this.header[field]) continue;
    xhr.setRequestHeader(field, this.header[field]);
  }

  // send stuff
  this.emit('request', this);
  xhr.send(data);
  return this;
};

/**
 * Faux promise support
 *
 * @param {Function} fulfill
 * @param {Function} reject
 * @return {Request}
 */

Request.prototype.then = function (fulfill, reject) {
  return this.end(function(err, res) {
    err ? reject(err) : fulfill(res);
  });
}

/**
 * Expose `Request`.
 */

request.Request = Request;

/**
 * Issue a request:
 *
 * Examples:
 *
 *    request('GET', '/users').end(callback)
 *    request('/users').end(callback)
 *    request('/users', callback)
 *
 * @param {String} method
 * @param {String|Function} url or callback
 * @return {Request}
 * @api public
 */

function request(method, url) {
  // callback
  if ('function' == typeof url) {
    return new Request('GET', method).end(url);
  }

  // url first
  if (1 == arguments.length) {
    return new Request('GET', method);
  }

  return new Request(method, url);
}

/**
 * GET `url` with optional callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed|Function} data or fn
 * @param {Function} fn
 * @return {Request}
 * @api public
 */

request.get = function(url, data, fn){
  var req = request('GET', url);
  if ('function' == typeof data) fn = data, data = null;
  if (data) req.query(data);
  if (fn) req.end(fn);
  return req;
};

/**
 * HEAD `url` with optional callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed|Function} data or fn
 * @param {Function} fn
 * @return {Request}
 * @api public
 */

request.head = function(url, data, fn){
  var req = request('HEAD', url);
  if ('function' == typeof data) fn = data, data = null;
  if (data) req.send(data);
  if (fn) req.end(fn);
  return req;
};

/**
 * DELETE `url` with optional callback `fn(res)`.
 *
 * @param {String} url
 * @param {Function} fn
 * @return {Request}
 * @api public
 */

request.del = function(url, fn){
  var req = request('DELETE', url);
  if (fn) req.end(fn);
  return req;
};

/**
 * PATCH `url` with optional `data` and callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed} data
 * @param {Function} fn
 * @return {Request}
 * @api public
 */

request.patch = function(url, data, fn){
  var req = request('PATCH', url);
  if ('function' == typeof data) fn = data, data = null;
  if (data) req.send(data);
  if (fn) req.end(fn);
  return req;
};

/**
 * POST `url` with optional `data` and callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed} data
 * @param {Function} fn
 * @return {Request}
 * @api public
 */

request.post = function(url, data, fn){
  var req = request('POST', url);
  if ('function' == typeof data) fn = data, data = null;
  if (data) req.send(data);
  if (fn) req.end(fn);
  return req;
};

/**
 * PUT `url` with optional `data` and callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed|Function} data or fn
 * @param {Function} fn
 * @return {Request}
 * @api public
 */

request.put = function(url, data, fn){
  var req = request('PUT', url);
  if ('function' == typeof data) fn = data, data = null;
  if (data) req.send(data);
  if (fn) req.end(fn);
  return req;
};

/**
 * Expose `request`.
 */

module.exports = request;

},{"emitter":4,"reduce":5}]},{},[2]);
