/**
 * @see http://api.fanyi.baidu.com/api/trans/product/apidoc
 */

'use strict';
const request = require( 'superagent' ) ,

// http://api.fanyi.baidu.com/api/trans/product/apidoc#languageList
  standard2custom = {
    en : 'en' ,
    th : 'th' ,
    ru : 'ru' ,
    pt : 'pt' ,
    el : 'el' ,
    nl : 'nl' ,
    pl : 'pl' ,
    bg : 'bul' ,
    et : 'est' ,
    da : 'dan' ,
    fi : 'fin' ,
    cs : 'cs' ,
    ro : 'rom' ,
    sl : 'slo' ,
    sv : 'swe' ,
    hu : 'hu' ,
    de : 'de' ,
    it : 'it' ,
    zh : 'zh' ,
    'zh-cn' : 'zh' ,
    'zh-tw' : 'cht' ,
    'zh-hk' : 'yue' ,
    ja : 'jp' ,
    ko : 'kor' ,
    es : 'spa' ,
    fr : 'fra' ,
    ar : 'ara'
  } ,
  custom2standard = {
    en : 'en' ,
    th : 'th' ,
    ru : 'ru' ,
    pt : 'pt' ,
    el : 'el' ,
    nl : 'nl' ,
    pl : 'pl' ,
    bul : 'bg' ,
    est : 'et' ,
    dan : 'da' ,
    fin : 'fi' ,
    cs : 'cs' ,
    rom : 'ro' ,
    slo : 'sl' ,
    swe : 'sv' ,
    hu : 'hu' ,
    de : 'de' ,
    it : 'it' ,
    zh : 'zh-CN' ,
    cht : 'zh-TW' ,
    yue : 'zh-HK' ,
    jp : 'ja' ,
    kor : 'ko' ,
    spa : 'es' ,
    fra : 'fr' ,
    ara : 'ar'
  };

class BaiDu {

  /**
   * 在自定义语种与标准语种之间转换，默认会将标准语种转换为自定义语种
   * @param {String} lang
   * @param {Boolean} [invert] - 但如果 invert 为真值，则会将自定义语种转换为标准语种
   * @return {String}
   */
  static resolve( lang , invert ) {
    return (invert ? custom2standard : standard2custom )[ lang.toLowerCase() ] || null;
  }

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
          from : standard2custom[ queryObj.from ] || 'auto' ,
          to : standard2custom[ queryObj.to ] || 'auto' ,
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
      obj.linkToResult = this.link + `#auto/${rawRes.to}/${queryObj.text}`

      try {
        const result = [];
        rawRes.trans_result.forEach( v => result.push( v.dst ) );
        obj.result = result;
      }
      catch ( e ) {
        obj.error = '没有返回有效的翻译结果，请稍后重试。';
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
        if ( BaiDu.resolve( from ) ) {
          resolve( from );
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
            return reject( err );
          }

          const body = res.body;
          if ( 0 === body.error ) {
            const lang = BaiDu.resolve( body.lan , true );
            if ( lang ) {
              return resolve( lang );
            }
          }

          reject( null );
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
      .then( lang => `http://fanyi.baidu.com/gettts?lan=${BaiDu.resolve( lang ) }&text=${queryObj.text}&spd=2&source=web` );
  }
}

module.exports = BaiDu;
