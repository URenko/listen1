// ==UserScript==
// @name        listen1
// @namespace   Violentmonkey Scripts
// @match       https://urenko.github.io/listen1/listen1.html
// @match       http://localhost/listen1.html
// @run-at      document-start
// @grant       unsafeWindow
// @grant       GM_xmlhttpRequest
// @grant       GM.xmlHttpRequest
// @version     1.0
// @author      URenko
// ==/UserScript==
unsafeWindow.chrome = {};
class Cookies{
  constructor(){
    this.cookie = {};
  }
  get(cookie, callback){
    console.log('cookies.get', cookie);
    cookie.url = new URL(cookie.url).origin;
    if(undefined===this.cookie[cookie.url]) this.cookie[cookie.url]={};
    callback(this.cookie[cookie.url][cookie.name], undefined);
  }
  set(cookie, callback){
    console.log('cookies.set', cookie);
    cookie.url = new URL(cookie.url).origin;
    if(undefined===this.cookie[cookie.url]) this.cookie[cookie.url]={};
    this.cookie[cookie.url][cookie.name] = cookie.value;
    callback(null, undefined);
  }
}
unsafeWindow.chrome.cookies = new Cookies;

// 来自background.js
function hack_referer_header(details) {
  const replace_referer = true;
  let replace_origin = true;
  const add_referer = true;
  let add_origin = true;

  let referer_value = '';
  let origin_value = "";

  if (details.url.indexOf('://music.163.com/') !== -1) {
    referer_value = 'http://music.163.com/';
  }
  if (details.url.indexOf('://gist.githubusercontent.com/') !== -1) {
    referer_value = 'https://gist.githubusercontent.com/';
  }

  if (details.url.indexOf(".xiami.com/") !== -1) {
    add_origin = false;
    referer_value = "https://www.xiami.com";
  }

  if (details.url.indexOf('www.xiami.com/api/search/searchSongs') !== -1) {
    const key = /key%22:%22(.*?)%22/.exec(details.url)[1];
    add_origin = false;
    referer_value = `https://www.xiami.com/search?key=${key}`;
  }

  if (details.url.indexOf('c.y.qq.com/') !== -1) {
    referer_value = 'https://y.qq.com/';
    origin_value = "https://y.qq.com";
  }
  if ((details.url.indexOf('i.y.qq.com/') !== -1)
    || (details.url.indexOf('qqmusic.qq.com/') !== -1)
    || (details.url.indexOf('music.qq.com/') !== -1)
    || (details.url.indexOf('imgcache.qq.com/') !== -1)) {
    referer_value = 'https://y.qq.com/';
  }

  if (details.url.indexOf('.kugou.com/') !== -1) {
    referer_value = 'http://www.kugou.com/';
  }

  if (details.url.indexOf('.kuwo.cn/') !== -1) {
    referer_value = 'http://www.kuwo.cn/';
  }

  if (details.url.indexOf('.bilibili.com/') !== -1 || details.url.indexOf(".bilivideo.com/") !== -1) {
    referer_value = 'https://www.bilibili.com/';
    replace_origin = false;
    add_origin = false;
  }
  if (details.url.indexOf('.migu.cn') !== -1) {
    referer_value = 'http://music.migu.cn/v3/music/player/audio?from=migu';
  }
  if (origin_value == "") {
    origin_value = referer_value;
  }

  let isRefererSet = false;
  let isOriginSet = false;
  const headers = details.headers;
  const blockingResponse = {};

  for (let i = 0, l = headers.length; i < l; i += 1) {
    if (replace_referer && (headers[i].name === 'Referer') && (referer_value !== '')) {
      headers[i].value = referer_value;
      isRefererSet = true;
    }
    if (replace_origin && (headers[i].name === 'Origin') && (origin_value !== '')) {
      headers[i].value = origin_value;
      isOriginSet = true;
    }
  }

  if (add_referer && (!isRefererSet) && (referer_value !== '')) {
    headers.push({
      name: 'Referer',
      value: referer_value,
    });
  }

  if (add_origin && (!isOriginSet) && (origin_value !== '')) {
    headers.push({
      name: 'Origin',
      value: origin_value,
    });
  }

}

GM_xmlhttpRequest = GM_xmlhttpRequest || GM.xmlHttpRequest;
unsafeWindow.$http = (details) => {
  console.log('$http', details);
  let origin = new URL(details.url).origin;
  let cookieStr = [];
  for(let name in chrome.cookies.cookie[origin]) cookieStr.push(name+'='+chrome.cookies.cookie[origin][name]);
  cookieStr = cookieStr.join('; ');
  if(undefined===details.headers) details.headers={};
  details.headers.Cookie = cookieStr;
  
  details.headers.push = header => details.headers[header.name] = header.value;
  hack_referer_header(details);
  delete details.headers.push;
  
  return new Promise(res => {
			GM_xmlhttpRequest(
				Object.assign({}, details, {
					onload: xhr => {
            xhr.data = xhr.response;
            if(!details.hasOwnProperty('transformResponse'))
              try{
                xhr.data = JSON.parse(xhr.response);
              }catch(e){;}
            res(xhr);
						setTimeout(()=>$rootScope.$apply(), 100); //待改进
					},
					onerror: xhr => {
						res(xhr);
					}
				})
			)
		})
};
unsafeWindow.$http.get = (url) => unsafeWindow.$http({url:url, method:'GET'});
