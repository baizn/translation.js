'use strict';

const Baidu = require( '../lib/baidu' ) ,
  baidu = new Baidu( { apiKey : 'Hs18iW3px3gQ6Yfy6Za0QGg4' } ) ,
  nock = require( 'nock' );

describe( '百度翻译' , ()=> {
  it( '必须提供API Key,否则初始化时会报错' , ()=> {
    let pass = false;
    try {
      new Baidu();
    }
    catch ( e ) {
      pass = true;
    }
    if ( !pass ) {
      fail( '没有API Key时应该报错' );
    }
  } );

  describe( '的 translate 方法' , ()=> {
    it( '在正常情况下会返回结果对象' , done => {
      const rawRes = {
        from : 'baidu-from' ,
        to : 'baidu-to' ,
        trans_result : [
          {
            src : 'xxxx' ,
            dst : 'result-1'
          }
        ]
      };

      nock( 'https://openapi.baidu.com' )
        .get( '/public/2.0/bmt/translate' )
        .query( true )
        .reply( 200 , rawRes );

      baidu.translate( { text : 'test' } ).then( result=> {
        expect( result ).toEqual( {
          text : 'test' ,
          from : 'baidu-from' ,
          to : 'baidu-to' ,
          result : 'result-1' ,
          response : rawRes ,
          linkToResult : 'http://fanyi.baidu.com/#auto/baidu-to/test'
        } );
        done();
      } , ()=> {
        fail( '错误的进入了 rejection 分支' );
        done();
      } );
    } );
  } );
} );
