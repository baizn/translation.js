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

class T {

  /**
   * 判断 superAgent 的错误对象的类型
   * @param {{timeout?:Number,status?:Number}} superAgentErr
   * @returns {String}
   */
  static errorType( superAgentErr ) {
    let type;
    if ( superAgentErr.timeout ) {
      type = 'timeout';
    } else if ( !superAgentErr.status ) {
      type = 'network error';
    } else {
      type = 'server error';
    }
    return type;
  }

  constructor() {
    this.defaultApi = 'BaiDu';
    this.api = {};
    this.errMsg = {
      timeout : '查询时超时了，请稍后再试。' ,
      'network error' : '网络错误，请检查网络设置，然后重试。' ,
      'server error' : '服务器出错了，请稍候重试。'
    };
  }

  /**
   * 创建一个翻译实例
   * @param {String} apiName
   * @param {*} config
   * @returns {API}
   */
  create( apiName , config ) {
    const api = this.api ,
      apiArr = api[ apiName ] || (api[ apiName ] = []) ,
      a = new T[ apiName ]( config );

    apiArr.push( a );

    return a;
  }

  /**
   * 翻译方法
   * @param {Query} queryObj
   * @returns {Promise}
   */
  translate( queryObj ) {
    return this.call( 'translate' , queryObj );
  }

  /**
   * 返回语音 url 的方法
   * @param queryObj
   * @returns {Promise}
   */
  audio( queryObj ) {
    return this.call( 'audio' , queryObj );
  }

  /**
   * 检测语种的方法。注意，此方法返回的语种类型是 API 相关的，可能不会遵守标准。
   * @param queryObj
   * @returns {Promise}
   */
  detect( queryObj ) {
    return this.call( 'detect' , queryObj );
  }

  /**
   * 调用实例方法
   * @param {String} method - 想调用实例的哪个方法
   * @param {Query} queryObj
   * @returns {Promise}
   */
  call( method , queryObj ) {
    return new Promise( ( resolve , reject )=> {
      const apiArr = this.api[ queryObj.api || this.defaultApi ];
      if ( !apiArr ) {
        return reject( `没有注册 ${queryObj.api} API。` );
      }

      const a = apiArr.shift();
      apiArr.push( a );
      a[ method ]( queryObj ).then( resolve , superAgentError => {
        reject( this.errMsg[ T.errorType( superAgentError ) ] );
      } );
    } );
  }
}

// 绑定构造函数
[ require( './baidu' ) , require( './youdao' ) ].forEach( klass => {
  T[ klass.name ] = klass;
} );

module.exports = T;
