(self.webpackChunkcoop_editor=self.webpackChunkcoop_editor||[]).push([[755],{293:(t,e,a)=>{!function(t){"use strict";function e(t){var e=t.match(/^\s*\S/);return t.skipToEnd(),e?"error":null}t.defineMode("asciiarmor",(function(){return{token:function(t,a){var r;if("top"==a.state)return t.sol()&&(r=t.match(/^-----BEGIN (.*)?-----\s*$/))?(a.state="headers",a.type=r[1],"tag"):e(t);if("headers"==a.state){if(t.sol()&&t.match(/^\w+:/))return a.state="header","atom";var n=e(t);return n&&(a.state="body"),n}return"header"==a.state?(t.skipToEnd(),a.state="headers","string"):"body"==a.state?t.sol()&&(r=t.match(/^-----END (.*)?-----\s*$/))?r[1]!=a.type?"error":(a.state="end","tag"):t.eatWhile(/[A-Za-z0-9+\/=]/)?null:(t.next(),"error"):"end"==a.state?e(t):void 0},blankLine:function(t){"headers"==t.state&&(t.state="body")},startState:function(){return{state:"top",type:null}}}})),t.defineMIME("application/pgp","asciiarmor"),t.defineMIME("application/pgp-encrypted","asciiarmor"),t.defineMIME("application/pgp-keys","asciiarmor"),t.defineMIME("application/pgp-signature","asciiarmor")}(a(492))}}]);