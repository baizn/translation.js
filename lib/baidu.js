// @see http://developer.baidu.com/wiki/index.php?title=帮助文档首页/百度翻译/翻译API

'use strict';
const request = require( 'superagent' ) ,
  langsMap = {
    en : 'en' ,
    th : 'th' ,
    ru : 'ru' ,
    pt : 'pt' ,
    de : 'de' ,
    it : 'it' ,
    zh : 'zh' ,
    'zh-CN' : 'zh' ,
    'zh-TW' : 'zh' ,
    ja : 'jp' ,
    ko : 'kor' ,
    es : 'spa' ,
    fr : 'fra' ,
    ar : 'ara'
  };

class BaiDu {

  /**
   * 百度翻译构造函数
   * @param {Object} config
   * @param {String} config.apiKey
   * @param {Number} [config.timeout=0] - 查询翻译结果或检测语言时的超时时间，单位毫秒，默认为零。
   */
  constructor( config ) {

    if ( !config || !config.apiKey ) {
      throw new Error( '百度翻译必须要有API Key,否则无法使用翻译接口.' );
    }

    this.apiKey = config.apiKey;
    this.timeout = config.timeout || 0;

    this.name = '百度翻译';
    this.link = 'http://fanyi.baidu.com/';
    this.errMsg = {
      52001 : '百度翻译正忙，请稍后再试' ,
      52002 : '百度翻译出现内部错误' ,
      52003 : '百度封禁了此 api key，请重新申请'
    };
  }

  /**
   * 翻译的方法
   * @param queryObj
   * @returns {Promise}
   */
  translate( queryObj ) {
    return new Promise( ( resolve , reject )=> {
      request
        .get( 'https://openapi.baidu.com/public/2.0/bmt/translate' )
        .query( {
          client_id : this.apiKey ,
          from : langsMap[ queryObj.from ] || 'auto' ,
          to : langsMap[ queryObj.to ] || 'auto' ,
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
  transform( rawRes , queryObj ) {
    const obj = {
      text : queryObj.text ,
      response : rawRes
    };

    //如果有错误码则直接处理错误
    if ( rawRes.error_code ) {
      obj.error = this.errMsg[ rawRes.error_code ];
    } else {
      obj.to = rawRes.to;
      obj.from = rawRes.from;
      obj.linkToResult = this.link + `#auto/${rawRes.to}/${queryObj.text}`;
      if ( Array.isArray( rawRes.trans_result ) ) {
        obj.result = [];
        rawRes.trans_result.forEach( v => obj.result.push( v.dst ) );
        obj.result = obj.result.join( '\n' );
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
  detect( queryObj ) {
    return new Promise( ( resolve , reject )=> {
      const from = queryObj.from;

      if ( from ) {
        const lang = langsMap[ from ];
        if ( lang ) {
          resolve( lang );
        } else {
          reject( null );
        }
        return;
      }

      request
        .post( 'http://fanyi.baidu.com/langdetect' )
        .send( 'query=' + queryObj.text.slice( 0 , 73 ) )
        .end( ( err , res )=> {
          if ( err ) {
            reject( err );
          } else {
            const body = res.body;
            if ( 0 === body.error ) {
              resolve( body.lan );
            } else {
              reject( null );
            }
          }
        } );
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
      .then( lang => `http://fanyi.baidu.com/gettts?lan=${lang}&text=${queryObj.text}&spd=2&source=web` );
  }
}

module.exports = BaiDu;
