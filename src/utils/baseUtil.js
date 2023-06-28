/**
 * @description 提供基础工具方法集
 */
const ua = navigator.userAgent;
// 安卓终端
const isAndroid = ua.indexOf('Android') > -1 || ua.indexOf('Adr') > -1;
// IOS 终端
const isIOS = !!ua.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/);

/**
 * @description 获取url参数集合对象
 * @param {string} url
 */
const getUrlParams = (url) => {
  const locationUrl = url || window.location.href;
  const paramsStr = locationUrl.split('?')[1];
  if (!paramsStr) return {};
  const params = locationUrl.split('?')[1].split('&');
  const obj = {};
  params.map((v) => (obj[v.split('=')[0]] = v.split('=')[1]));
  return obj;
};
/**
 * @description 动态计算rem
 */
const calcRem = () => {
  if (!document) return console.error('document is not exit!');
  const clientWidth = document.body.clientWidth;
  // 360为app编辑器最小宽度
  const baseSize = clientWidth / 3.6;
  // const baseSize = clientWidth / 19.2;
  document.getElementsByTagName('html')[0].style.fontSize = baseSize + 'px';
};

/**
 * isJson
 * @param {object} obj
 */
const _isJson = function (obj) {
  let isjson =
    typeof obj === 'object' &&
    Object.prototype.toString.call(obj).toLowerCase() === '[object object]' &&
    !obj.length;
  return isjson;
};

/**
 * @description 节流方法
 * @param {function} func 
 * @param {number} wait 
 * @param {object} options 
 * @returns 
 */
const throttle = (func, wait, options) => {
  const that = this
  var timeout, context, args, result;
  var previous = 0;
  if (!options) options = {};

  var later = function () {
      previous = options.leading === false ? 0 : new Date().getTime();
      timeout = null;
      func.apply(context, args);
      if (!timeout) context = args = null;
  };

  var throttled = function () {
      var now = new Date().getTime();
      if (!previous && options.leading === false) previous = now;
      var remaining = wait - (now - previous);
      context = that;
      args = arguments;
      if (remaining <= 0 || remaining > wait) {
          if (timeout) {
              clearTimeout(timeout);
              timeout = null;
          }
          previous = now;
          func.apply(context, args);
          if (!timeout) context = args = null;
      } else if (!timeout && options.trailing !== false) {
          timeout = setTimeout(later, remaining);
      }
  };
  throttled.cancel = function () {
      clearTimeout(timeout);
      timeout = null;
  };
  return throttled;
}

/**
 * @description 防抖方法
 * @param {function} func 
 * @param {number} wait 
 * @returns 
 */
const debounce = (func, wait) => {
  let timeout;
  return function () {
      let context = this;
      let args = arguments;
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => {
          func.apply(context, args)
      }, wait);
  }
}

export {
  getUrlParams,
  calcRem,
  throttle,
  debounce,
  isAndroid,
  isIOS,
};
