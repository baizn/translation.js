'use strict';

const Baidu = require( '../lib/baidu' ) ,
  baidu = new Baidu( { apiKey : 'Hs18iW3px3gQ6Yfy6Za0QGg4' } ) ,
  nock = require( 'nock' );

nock.disableNetConnect();

describe( '百度翻译' , ()=> {
  it( '在初始化时若没有提供API Key则应该报错' , ()=> {
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

      baidu
        .translate( { text : 'test' } )
        .then( result => {
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

    it( '在百度接口返回错误结构的情况下会给出提示' , done => {
      const rawRes = {
        from : 'baidu-from' ,
        to : 'baidu-to' ,
        trans_result : 'not an array'
      };

      nock( 'https://openapi.baidu.com' )
        .get( '/public/2.0/bmt/translate' )
        .query( true )
        .reply( 200 , rawRes );

      baidu
        .translate( { text : 'test' } )
        .then( result => {
          expect( result ).toEqual( {
            text : 'test' ,
            from : 'baidu-from' ,
            to : 'baidu-to' ,
            result : '啊哦，百度返回了一个奇怪的东西，等一会儿再试试看吧。' ,
            response : rawRes ,
            linkToResult : 'http://fanyi.baidu.com/#auto/baidu-to/test'
          } );
          done();
        } , ()=> {
          fail( '错误的进入了 rejection 分支' );
          done();
        } );
    } );

    it( '在百度接口返回错误码时会 resolve，但会设置 error 属性' , done => {
      const rawRes = {
        error_code : 52001
      };

      nock( 'https://openapi.baidu.com' )
        .get( '/public/2.0/bmt/translate' )
        .query( true )
        .reply( 200 , rawRes );

      baidu
        .translate( { text : 'test' } )
        .then( result => {
          expect( result ).toEqual( {
            text : 'test' ,
            response : rawRes ,
            error : '百度翻译正忙，请稍后再试'
          } );
          done();
        } , ()=> {
          fail( '错误的进入了 rejection 分支' );
          done();
        } );
    } );

    it( '在网络错误时应该被 reject' , done => {
      nock( 'https://openapi.baidu.com' )
        .get( '/public/2.0/bmt/translate' )
        .query( true )
        .replyWithError( 'some network error message' );

      baidu
        .translate( { text : 'test' } )
        .then( ()=> {
          fail( '错误的进入了 resolve 分支' );
          done();
        } , ()=> {
          done();
        } );
    } );
  } );

  describe( '的 detect 方法' , ()=> {
    it( '在网络错误时应该被 reject' , done => {
      nock( 'http://fanyi.baidu.com' )
        .post( '/langdetect' )
        .replyWithError( 'some network error message' );

      baidu
        .detect( { text : 'test' } )
        .then( ()=> {
          fail( '错误的进入了 resolve 分支' );
          done();
        } , ()=> {
          done();
        } );
    } );

    it( '在网络正常时应该返回 lan 字段的值' , done => {
      nock( 'http://fanyi.baidu.com' )
        .post( '/langdetect' , ()=> true )
        .reply( 200 , { error : 0 , lan : 'good boy' } );

      baidu
        .detect( { text : 'oh' } )
        .then( lan => {
          expect( lan ).toBe( 'good boy' );
          done();
        } , ()=> {
          fail( '错误的进入了 resolve 分支' );
          done();
        } );
    } );

    it( '若百度返回的 error 不为 0，则 reject null' , done => {
      nock( 'http://fanyi.baidu.com' )
        .post( '/langdetect' , ()=> true )
        .reply( 200 , { error : 1 } );

      baidu
        .detect( { text : 'oh' } )
        .then( ()=> {
          fail( '错误的进入了 resolve 分支' );
          done();
        } , err => {
          expect( err ).toBeNull();
          done();
        } );
    } );

    it( '若查询对象里有支持的 from，则直接 resolve' , done => {
      baidu
        .detect( { text : 'xx' , from : 'ja' } )
        .then( lan => {
          expect( lan ).toBe( 'jp' );
          done();
        } , ()=> {
          fail( '错误的进入了 reject 分支' );
          done();
        } );
    } );

    it( '若查询对象里有 from 但不被支持，则 reject null' , done => {
      baidu
        .detect( { text : 'x' , from : 'i' } )
        .then( () => {
          fail( '错误的进入了 resolve 分支' );
          done();
        } , err => {
          expect( err ).toBeNull();
          done();
        } );
    } );
  } );

  it( '的 audio 方法总是会调用 detect 获取自己的语种' , done => {
    spyOn( baidu , 'detect' ).and.returnValue( Promise.resolve( 'wtf' ) );

    const q = { text : 'test' };
    baidu.audio( q ).then( url => {
      expect( baidu.detect ).toHaveBeenCalledWith( q );
      expect( url ).toBe( 'http://fanyi.baidu.com/gettts?lan=wtf&text=test&spd=2&source=web' );
      done();
    } );
  } );
} );
