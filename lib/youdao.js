// @see http://fanyi.youdao.com/openapi?path=data-mode#bd

/**
 * 有道翻译返回的数据结构
 * @typedef {Object} YouDaoRes
 * @property {Number} errorCode - 有道翻译错误码，0 表示正常
 * @property {{phonetic?:String,explains?:String[]}} [basic] - 翻译结果的源语种，百度格式的
 * @property {String[]} [translation] - 翻译结果，偶尔抽风可能没有
 */

'use strict';
const request = require( 'superagent' ) ,
  standard2custom = {
    en : 'eng' ,
    ja : 'jap' ,
    ko : 'ko' ,
    fr : 'fr' ,
    ru : 'ru' ,
    es : 'es'
  } ,
  custom2standard = {
    eng : 'en' ,
    jap : 'ja' ,
    ko : 'ko' ,
    fr : 'fr' ,
    ru : 'ru' ,
    es : 'es'
  };

class YouDao {

  /**
   * 在标准语种与自定义语种之间转换，默认会将标准语种转换为自定义语种
   * @param {String} lang
   * @param {Boolean} [invert] - 但如果 invert 为真值，则会将自定义语种转换为标准语种
   * @return {String}
   */
  static resolve( lang , invert ) {
    return (invert ? custom2standard : standard2custom )[ lang.toLowerCase() ] || null;
  }

  /**
   * 有道翻译构造函数
   * @param {Object} config
   * @param {String} config.apiKey
   * @param {String} config.keyFrom
   * @param {Number} [config.timeout=0] - 查询翻译结果或检测语言时的超时时间，单位毫秒，默认为零。
   */
  constructor( config ) {

    if ( !config || !config.apiKey || !config.keyFrom ) {
      throw new Error( '有道翻译必须要有API Key及keyFrom,否则无法使用翻译接口.' );
    }

    this.apiKey = config.apiKey;
    this.keyFrom = config.keyFrom;
    this.timeout = config.timeout || 0;

    this.name = '有道翻译';
    this.link = 'http://fanyi.youdao.com/';
    this.errMsg = {
      20 : '有道翻译服务一次性只能翻译200个字符' ,
      30 : '有道翻译暂时无法翻译这段文本' ,
      40 : '有道翻译不支持这种语言' ,
      50 : 'api key被封禁' ,
      60 : '无词典结果'
    };
  }

  /**
   * 翻译的方法。有道不支持指定源语种或目标语种。
   * @param queryObj
   * @returns {Promise}
   */
  translate( queryObj ) {
    return new Promise( ( resolve , reject )=> {
      request
        .get( 'https://fanyi.youdao.com/openapi.do' )
        .query( {
          key : this.apiKey ,
          keyfrom : this.keyFrom ,
          type : 'data' ,
          doctype : 'json' ,
          version : '1.1' ,
          q : queryObj.text
        } )
        .timeout( this.timeout )
        .end( ( err , res )=> {
          if ( err ) {
            reject( err );
          } else {
            resolve( this.transform( res.body , queryObj ) );
          }
        } );
    } );
  }

  /**
   * 将有道接口的数据转换为统一格式
   * @param {YouDaoRes} rawRes
   * @param {Query} queryObj
   * @returns {{}}
   */
  transform( rawRes , queryObj ) {
    const obj = {
      text : queryObj.text ,
      response : rawRes ,
      linkToResult : `http://fanyi.youdao.com/translate?i=${queryObj.text}`
    };

    //如果有错误码则直接处理错误
    if ( 0 !== rawRes.errorCode ) {
      obj.error = this.errMsg[ rawRes.errorCode ];
    } else {

      // 详细释义
      try {
        const basic = rawRes.basic;
        obj.detailed = basic.explains;
        obj.phonetic = basic.phonetic;
      }
      catch ( e ) {}

      // 翻译结果
      try {
        obj.result = rawRes.translation;
      }
      catch ( e ) {}

      if ( !obj.detailed && !obj.result ) {
        obj.error = this.name + '没有返回有效的翻译结果，请稍后重试。';
      }
    }

    return obj;
  }

  /**
   * 检测语种的方法，有道没有，所以若提供源语种就总是返回 null
   * @param {Query} queryObj
   * @returns {Promise}
   */
  detect( queryObj ) {
    return new Promise( ( resolve , reject )=> {
      const from = queryObj.from;

      if ( YouDao.resolve( from ) ) {
        resolve( from );
      } else {
        reject( null );
      }

    } );
  }

  /**
   * 返回语音播放的 url
   * @param queryObj
   * @returns {Promise}
   */
  audio( queryObj ) {
    return this
      .detect( queryObj )
      .then( lang => {
        const l = YouDao.resolve( lang );
        return `http://tts.youdao.com/fanyivoice?keyfrom=fanyi%2Eweb%2Eindex&le=${l}&word=${queryObj.text}`;
      } );
  }
}

module.exports = YouDao;
