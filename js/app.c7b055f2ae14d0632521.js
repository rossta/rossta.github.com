(self.webpackChunkrossta_net=self.webpackChunkrossta_net||[]).push([[143],{340:(e,n,t)=>{"use strict";var s=t(227),o=t.n(s);function r(e,n){e.classList.contains(n)?e.classList.remove(n):e.classList.add(n)}o()("app:top-bar-menu"),window.addEventListener("DOMContentLoaded",(function(){document.querySelectorAll(".top-bar-menu-button").forEach((function(e){e.addEventListener("click",(function(n){n.stopPropagation(),r(document.querySelector(".top-bar-section"),"hidden"),e.querySelectorAll(".icon").forEach((function(e){return r(e,"hidden")}))}))}))}));var a,c=o()("app:utils/observe-added-node"),i=o()("app:formkit");a=function(e){var n=e.querySelector("input[name='email_address']");n.type="email",i("input",n,"parent node",e)},new MutationObserver((function(e,n){e.forEach((function(e){"childList"===e.type&&e.addedNodes.forEach((function(e){e.classList&&e.classList.contains("formkit-slide-in")&&(c("added node detected",e),a(e),n.disconnect())}))}))})).observe(document.querySelector("body"),{childList:!0});var u=o()("app:app");Promise.all([t.e(889),t.e(26)]).then(t.bind(t,186)).then((function(e){return e.default.highlightAll()})),u("Welcome to rossta.net!")},227:(e,n,t)=>{n.formatArgs=function(n){if(n[0]=(this.useColors?"%c":"")+this.namespace+(this.useColors?" %c":" ")+n[0]+(this.useColors?"%c ":" ")+"+"+e.exports.humanize(this.diff),!this.useColors)return;const t="color: "+this.color;n.splice(1,0,t,"color: inherit");let s=0,o=0;n[0].replace(/%[a-zA-Z%]/g,(e=>{"%%"!==e&&(s++,"%c"===e&&(o=s))})),n.splice(o,0,t)},n.save=function(e){try{e?n.storage.setItem("debug",e):n.storage.removeItem("debug")}catch(e){}},n.load=function(){let e;try{e=n.storage.getItem("debug")}catch(e){}return!e&&"undefined"!=typeof process&&"env"in process&&(e=process.env.DEBUG),e},n.useColors=function(){return!("undefined"==typeof window||!window.process||"renderer"!==window.process.type&&!window.process.__nwjs)||("undefined"==typeof navigator||!navigator.userAgent||!navigator.userAgent.toLowerCase().match(/(edge|trident)\/(\d+)/))&&("undefined"!=typeof document&&document.documentElement&&document.documentElement.style&&document.documentElement.style.WebkitAppearance||"undefined"!=typeof window&&window.console&&(window.console.firebug||window.console.exception&&window.console.table)||"undefined"!=typeof navigator&&navigator.userAgent&&navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/)&&parseInt(RegExp.$1,10)>=31||"undefined"!=typeof navigator&&navigator.userAgent&&navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/))},n.storage=function(){try{return localStorage}catch(e){}}(),n.destroy=(()=>{let e=!1;return()=>{e||(e=!0,console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`."))}})(),n.colors=["#0000CC","#0000FF","#0033CC","#0033FF","#0066CC","#0066FF","#0099CC","#0099FF","#00CC00","#00CC33","#00CC66","#00CC99","#00CCCC","#00CCFF","#3300CC","#3300FF","#3333CC","#3333FF","#3366CC","#3366FF","#3399CC","#3399FF","#33CC00","#33CC33","#33CC66","#33CC99","#33CCCC","#33CCFF","#6600CC","#6600FF","#6633CC","#6633FF","#66CC00","#66CC33","#9900CC","#9900FF","#9933CC","#9933FF","#99CC00","#99CC33","#CC0000","#CC0033","#CC0066","#CC0099","#CC00CC","#CC00FF","#CC3300","#CC3333","#CC3366","#CC3399","#CC33CC","#CC33FF","#CC6600","#CC6633","#CC9900","#CC9933","#CCCC00","#CCCC33","#FF0000","#FF0033","#FF0066","#FF0099","#FF00CC","#FF00FF","#FF3300","#FF3333","#FF3366","#FF3399","#FF33CC","#FF33FF","#FF6600","#FF6633","#FF9900","#FF9933","#FFCC00","#FFCC33"],n.log=console.debug||console.log||(()=>{}),e.exports=t(447)(n);const{formatters:s}=e.exports;s.j=function(e){try{return JSON.stringify(e)}catch(e){return"[UnexpectedJSONParseError]: "+e.message}}},447:(e,n,t)=>{e.exports=function(e){function n(e){let t,o,r,a=null;function c(...e){if(!c.enabled)return;const s=c,o=Number(new Date),r=o-(t||o);s.diff=r,s.prev=t,s.curr=o,t=o,e[0]=n.coerce(e[0]),"string"!=typeof e[0]&&e.unshift("%O");let a=0;e[0]=e[0].replace(/%([a-zA-Z%])/g,((t,o)=>{if("%%"===t)return"%";a++;const r=n.formatters[o];if("function"==typeof r){const n=e[a];t=r.call(s,n),e.splice(a,1),a--}return t})),n.formatArgs.call(s,e),(s.log||n.log).apply(s,e)}return c.namespace=e,c.useColors=n.useColors(),c.color=n.selectColor(e),c.extend=s,c.destroy=n.destroy,Object.defineProperty(c,"enabled",{enumerable:!0,configurable:!1,get:()=>null!==a?a:(o!==n.namespaces&&(o=n.namespaces,r=n.enabled(e)),r),set:e=>{a=e}}),"function"==typeof n.init&&n.init(c),c}function s(e,t){const s=n(this.namespace+(void 0===t?":":t)+e);return s.log=this.log,s}function o(e){return e.toString().substring(2,e.toString().length-2).replace(/\.\*\?$/,"*")}return n.debug=n,n.default=n,n.coerce=function(e){return e instanceof Error?e.stack||e.message:e},n.disable=function(){const e=[...n.names.map(o),...n.skips.map(o).map((e=>"-"+e))].join(",");return n.enable(""),e},n.enable=function(e){let t;n.save(e),n.namespaces=e,n.names=[],n.skips=[];const s=("string"==typeof e?e:"").split(/[\s,]+/),o=s.length;for(t=0;t<o;t++)s[t]&&("-"===(e=s[t].replace(/\*/g,".*?"))[0]?n.skips.push(new RegExp("^"+e.slice(1)+"$")):n.names.push(new RegExp("^"+e+"$")))},n.enabled=function(e){if("*"===e[e.length-1])return!0;let t,s;for(t=0,s=n.skips.length;t<s;t++)if(n.skips[t].test(e))return!1;for(t=0,s=n.names.length;t<s;t++)if(n.names[t].test(e))return!0;return!1},n.humanize=t(824),n.destroy=function(){console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.")},Object.keys(e).forEach((t=>{n[t]=e[t]})),n.names=[],n.skips=[],n.formatters={},n.selectColor=function(e){let t=0;for(let n=0;n<e.length;n++)t=(t<<5)-t+e.charCodeAt(n),t|=0;return n.colors[Math.abs(t)%n.colors.length]},n.enable(n.load()),n}},824:e=>{var n=1e3,t=60*n,s=60*t,o=24*s;function r(e,n,t,s){var o=n>=1.5*t;return Math.round(e/t)+" "+s+(o?"s":"")}e.exports=function(e,a){a=a||{};var c,i,u=typeof e;if("string"===u&&e.length>0)return function(e){if(!((e=String(e)).length>100)){var r=/^(-?(?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i.exec(e);if(r){var a=parseFloat(r[1]);switch((r[2]||"ms").toLowerCase()){case"years":case"year":case"yrs":case"yr":case"y":return 315576e5*a;case"weeks":case"week":case"w":return 6048e5*a;case"days":case"day":case"d":return a*o;case"hours":case"hour":case"hrs":case"hr":case"h":return a*s;case"minutes":case"minute":case"mins":case"min":case"m":return a*t;case"seconds":case"second":case"secs":case"sec":case"s":return a*n;case"milliseconds":case"millisecond":case"msecs":case"msec":case"ms":return a;default:return}}}}(e);if("number"===u&&isFinite(e))return a.long?(c=e,(i=Math.abs(c))>=o?r(c,i,o,"day"):i>=s?r(c,i,s,"hour"):i>=t?r(c,i,t,"minute"):i>=n?r(c,i,n,"second"):c+" ms"):function(e){var r=Math.abs(e);return r>=o?Math.round(e/o)+"d":r>=s?Math.round(e/s)+"h":r>=t?Math.round(e/t)+"m":r>=n?Math.round(e/n)+"s":e+"ms"}(e);throw new Error("val is not a non-empty string or a valid number. val="+JSON.stringify(e))}}},e=>{e(e.s=340)}]);
//# sourceMappingURL=app.c7b055f2ae14d0632521.js.map