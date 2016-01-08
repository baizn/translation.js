'use strict';
const request = require( 'superagent' );

module.exports = class {

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
        .query( {
          client : 'gtx' ,
          sl : 'auto' , // 源语言
          tl : queryObj.to || 'auto' , // 目标语言
          hl : 'zh-CN' ,
          dt : [ 't' , 'bd' ] , // todo 注意这个，要测试一下 SuperAgent 会不会正确的转换成 &dt=t&dt=tl
          dj : 1 ,
          source : 'icon' ,
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
      if ( Array.isArray( rawRes.sentences ) ) {

        // 翻译结果，每一段是一个数组项
        obj.result = [];
        rawRes.sentences.forEach( function ( v ) {
          obj.result.push( v.trans );
        } );
      } else {
        obj.result = '啊哦，谷歌翻译返回了一个奇怪的东西，稍后再试试看吧。';
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

