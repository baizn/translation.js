/**
 * 谷歌翻译支持几乎所有语种，并且它的语种格式就是标准的。
 */

'use strict';
const request = require( 'superagent' );

module.exports = class {

  /**
   * 谷歌翻译的语种本身就是标准语种
   * @param lang
   * @returns {*}
   */
  static resolve( lang ) {
    return lang;
  }

  /**
   * 谷歌翻译
   * @param [config]
   * @param [config.timeout]
   */
  constructor( config ) {
    this.timeout = (config || {}).timeout || 0;

    this.name = '谷歌翻译';
    this.link = 'https://translate.google.com';
    this.apiRoot = 'https://translate.googleapis.com';
  }

  /**
   * 翻译的方法
   * @param queryObj
   * @returns {Promise}
   */
  translate( queryObj ) {
    return new Promise( ( resolve , reject )=> {
      request
        .get( this.apiRoot + '/translate_a/single' )
        .query( `client=gtx&sl=${queryObj.from || 'auto'}&tl=${queryObj.to || 'auto'}&hl=zh-CN&dt=t&dt=bd&dj=1&source=icon&q=${queryObj.text}` )
        //  , {
        //  client : 'gtx' ,
        //  sl : 'auto' , // 源语言
        //  tl : queryObj.to || 'auto' , // 目标语言
        //  hl : 'zh-CN' ,
        //  dt : [ 't' , 'bd' ] , // 这个地方必须写成 &dt=t&dt=tl，所以没有用对象的方式声明
        //  dj : 1 ,
        //  source : 'icon' ,
        //  q : queryObj.text
        //} )
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
   * 将必应翻译的数据转换为统一格式
   * @param rawRes
   * @param queryObj
   * @returns {{}}
   */
  transform( rawRes , queryObj ) {
    const obj = {
      text : queryObj.text ,
      to : queryObj.to || 'auto' ,
      from : rawRes.src ,
      response : rawRes
    };

    obj.linkToResult = this.link + `/#auto/${obj.to}/${queryObj.text}`;

    if ( typeof rawRes === 'string' ) {
      obj.error = '谷歌翻译发生了一个错误，可能是因为查询文本过长造成的。';
    } else {

      // 尝试获取详细释义
      try {
        const d = [];
        rawRes.dict.forEach( ( v )=> {
          d.push( v.pos + '：' + ( v.terms.slice( 0 , 3 ) || []).join( ',' ) );
        } );
        obj.detailed = d;
      }
      catch ( e ) {}

      // 尝试取得翻译结果
      try {
        const result = [];
        rawRes.sentences.forEach( function ( v ) {
          result.push( v.trans );
        } );
        obj.result = result;
      }
      catch ( e ) {}

      if ( !obj.detailed && !obj.result ) {
        obj.error = `${this.name}没有返回翻译结果，请稍后重试。`;
      }
    }
    return obj;
  }

  /**
   * 使用谷歌翻译检测文本语种。
   * @param queryObj
   * @returns {Promise}
   */
  detect( queryObj ) {
    return new Promise( ( resolve , reject )=> {
      const from = queryObj.from;

      if ( from ) {
        return resolve( from );
      }

      this
        .translate( queryObj )
        .then( result => resolve( result.from ) , reject );
    } );
  }

  /**
   * 返回语音播放的 url
   * @param queryObj
   * @returns {Promise}
   */
  audio( queryObj ) {
    return this.detect( queryObj )
      .then( ( lang )=> {
        return encodeURI( this.apiRoot + `/translate_tts?ie=UTF-8&q=${queryObj.text}&tl=${lang}&client=gtx` );
      } );
  }
};

