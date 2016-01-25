/*
* react-dom v0.1.0
* https://github.com/EtienneLem/react-dom
*
* Copyright 2014, Etienne Lemay http://heliom.ca
* Released under the MIT license
*/
!function(e,n){"function"==typeof define&&define.amd?define(["React"],n):"undefined"!=typeof exports?module.exports=n(require("react")):e.DOM=n(e.React)}(this,function(e){var n,t,a,o;n={},o=e.DOM,proxy=function(e,t){"function"==typeof t&&(n[e]=function(n,t){var a;return void 0===t&&(t=n,n=null),n&&n.data&&(a=function(e,t){var o,f;null==t&&(t="");for(o in e)if(f=e[o],f instanceof Array){var r,i;for(r=0;r<f.length;r++)i=f[r],n["data"+(t+"-"+o+"-"+i)]=!0}else f instanceof Object?a(f,t+o+"-"):n["data-"+(t+o)]=f},a(n.data),delete n.data),n&&n["class"]&&(n.className=n["class"],delete n["class"]),o[e](n,t)})};for(t in o)a=o[t],proxy(t,a);return n});