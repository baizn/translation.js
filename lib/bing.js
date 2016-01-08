'use strict';
const request = require( 'superagent' );

module.exports = class {

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
   * 翻译的方法
   * @param queryObj
   * @returns {Promise}
   */
  translate( queryObj ) {
    return new Promise( ( resolve , reject )=> {
      request
        .post( 'http://dict.bing.com.cn/io.aspx' )
        .send( {
          t : 'dict' ,
          ut : 'default' ,
          q : queryObj.text ,
          ulang : (queryObj.from || 'auto').toUpperCase() ,
          tlang : (queryObj.to || 'auto').toUpperCase()
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
      to : queryObj.to || 'auto' ,
      response : rawRes ,
      from : rawRes.ROOT.$LANG ,
      linkToResult : this.link + `search?q=${queryObj.text}` ,
      detailed : []
    };

    try {
      rawRes.ROOT.DEF[ 0 ].SENS.forEach( function ( v ) {
        let s = v.$POS + '. ';
        if ( Array.isArray( v.SEN ) ) {
          v.SEN.forEach( ( j )=> {
            s += j.D.$ + '; ';
          } );
        } else {
          s += v.SEN.D.$;
        }
        obj.detailed.push( s );
      } );
    }
    catch ( e ) {}

    try {
      obj.result = rawRes.ROOT.SMT.R.$.replace( /\{\d+#|\$\d+\}/g , '' );
    }
    catch ( e ) {
      obj.result = '';
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

      if ( from ) {
        return resolve( from );
      }

      this
        .translate( queryObj )
        .then( result => resolve( result.from ) , reject );
    } );
  }

  /**
   * @todo 返回语音播放的 url
   * @param queryObj
   * @returns {Promise}
   */
  audio( queryObj ) {
    return Promise.reject( '必应暂不支持语音播放' );
  }
};
