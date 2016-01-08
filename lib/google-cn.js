'use strict';
const Google = require( './google' );

module.exports = class extends Google {
  constructor( config ) {
    super( config );

    this.name = '谷歌翻译（国内）';
    this.link = 'https://translate.google.cn';
    this.apiRoot = 'https://translate.google.cn';
  }
};
