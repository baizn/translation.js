/**
 * 必应词典的这个接口仅支持中文和英文；
 * 中文会翻译成英文，反之英文会翻译成中文，
 * 但其它语种全都不支持；
 * 若翻译了一个不支持的语种（如日语），
 * 那么语种会被判断为 EN，
 * 但不会有任何翻译结果。
 */

'use strict';
const request = require( 'superagent' ) ,
  custom2standard = {
    cn : 'zh-CN' ,
    en : 'en'
  } ,
  standard2custom = {
    'zh-cn' : 'cn' ,
    en : 'en'
  };

module.exports = class Bing {

  /**
   * 必应翻译
   * @param [config]
   * @param [config.timeout]
   */
  constructor( config ) {
    this.timeout = (config || {}).timeout || 0;

    this.name = '必应翻译';
    this.link = 'http://cn.bing.com/dict/';
  }

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
   * 翻译的方法
   * @param queryObj
   * @returns {Promise}
   */
  translate( queryObj ) {
    return new Promise( ( resolve , reject )=> {
      request
        .post( 'http://dict.bing.com.cn/io.aspx' )
        .type( 'form' )
        .send( {
          t : 'dict' ,
          ut : 'default' ,
          q : queryObj.text ,
          ulang : 'AUTO' ,
          tlang : 'AUTO'
        } )
        .timeout( this.timeout )
        .end( ( err , res )=> {
          if ( err ) {
            reject( err );
          } else {
            resolve( this.transform( res.text , queryObj ) );
          }
        } );
    } );
  }

  /**
   * 将必应翻译的数据转换为统一格式
   * @param responseText
   * @param queryObj
   * @returns {{}}
   */
  transform( responseText , queryObj ) {
    const rawRes = JSON.parse( responseText ) ,
      ROOT = rawRes.ROOT ,
      obj = {
        text : queryObj.text ,
        to : queryObj.to || 'auto' ,
        response : rawRes ,
        from : Bing.resolve( ROOT.$LANG , true ) ,
        linkToResult : this.link + `search?q=${queryObj.text}`
      };

    // 尝试获取错误消息
    try {
      const error = rawRes.ERR.$;
      if ( error ) {
        obj.error = error;
        return obj;
      }
    }
    catch ( e ) {}

    // 尝试获取详细释义
    try {
      const d = [];
      ROOT.DEF[ 0 ].SENS.forEach( function ( v ) {
        let s = v.$POS + '. ';
        if ( Array.isArray( v.SEN ) ) {
          v.SEN.forEach( ( j )=> {
            s += j.D.$ + '; ';
          } );
        } else {
          s += v.SEN.D.$;
        }
        d.push( s );
      } );
      obj.detailed = d;
    }
    catch ( e ) {}

    // 尝试获取翻译结果
    try {
      obj.result = [ ROOT.SMT.R.$.replace( /\{\d+#|\$\d+\}/g , '' ) ];
    }
    catch ( e ) {}

    if ( !obj.detailed && !obj.result ) {
      obj.error = '必应翻译不支持此语种。';
      obj.from = ''; // 不支持的语种始终会被解析为 en，这是不正确的
    }
    return obj;
  }

  /**
   * 使用必应翻译检测文本语种。
   * @param queryObj
   * @returns {Promise}
   */
  detect( queryObj ) {
    return new Promise( ( resolve , reject )=> {
      const from = queryObj.from;

      if ( standard2custom.hasOwnProperty( from ) ) {
        resolve( from );
      } else {
        reject( null );
      }
    } );
  }

  /**
   * 暂时找不到必应的语音播放的接口。它网页上的语音播放没有规律可循。
   * @returns {Promise}
   */
  audio() {
    return Promise.reject( null );
  }
};
