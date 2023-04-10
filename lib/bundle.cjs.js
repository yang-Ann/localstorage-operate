"use strict";const e=e=>Object.prototype.toString.call(e).slice(8,-1).toLocaleLowerCase(),t=["uni-","uni_","dcloud-","dcloud_"],a=e=>{let a=!0;for(const r of t)if(e.startsWith(r)){a=!1;break}return a};class r{platform;cacheTime;timingClear;#e;#t;#a;#r;#o;cacheKey="__CATCH_KEY";overtimeKey="__OVERTIME_KEY";timer=null;constructor(e,t,a=!1){this.platform=e,this.cacheTime=t,this.timingClear=a,this.init()}static OVERTIME="overtime";static VOID="void";static instanceof=null;static getInstanceof(e,t,a=!1){return r.instanceof||(r.instanceof=new r(e,t,a)),r.instanceof}init(){this.initCommonApi(),this.initOther()}initCommonApi(){try{switch(this.platform){case"web":this.#o=()=>({keys:Object.keys(window.localStorage),currentSize:window.localStorage.length,limitSize:0}),this.#e=e=>window.localStorage.getItem(e),this.#t=(e,t)=>window.localStorage.setItem(e,t),this.#a=e=>window.localStorage.removeItem(e),this.#r=()=>window.localStorage.clear();break;case"wechat":const{getStorageSync:e,setStorageSync:t,removeStorageSync:a,clearStorageSync:r}=wx;this.#o=wx.getStorageInfoSync,this.#e=e,this.#t=t,this.#a=a,this.#r=r;break;case"uniapp":{const{getStorageSync:e,setStorageSync:t,removeStorageSync:a,clearStorageSync:r}=uni;this.#o=uni.getStorageInfoSync,this.#e=e,this.#t=t,this.#a=a,this.#r=r}break;default:throw new Error}}catch(e){throw new Error(`不存在 ${this.platform} 平台的API: #{e}`)}}initOther(){const t=e(this.cacheTime);if("date"===t)this.cacheTime=new Date(this.cacheTime).getTime();else if("number"!==t)throw new Error("日期参数非法, 期望 Date | Number, 实际为 -> "+t);this.timingClear&&"number"==typeof this.cacheTime&&(this.clearInterval(),this.timer=setInterval((()=>{this.clearOvertimeData()}),this.cacheTime))}callFn(e,...t){const a=t.pop();"function"==typeof e?e(...t):"function"==typeof a&&a()}getStorage(t,a){return new Promise(((o,n)=>{"object"===e(t)&&console.warn("getStorage(key) 的key是一个引用数据类型, 可能会获得错误的结果 -> ",t);try{let e=this.#e(t);if(!e){const e={flog:r.VOID,msg:"获取不存在数据: "+t},o=()=>n(e);return void this.callFn(a,e,null,o)}try{e=JSON.parse(e)}catch(e){console.warn("json转换失败了: ",e)}if(e&&Date.now()>e[this.overtimeKey]){this.removeStorage(t),e=null;const o={flog:r.OVERTIME,msg:"缓存超时: "+t};this.callFn(a,o,null,(()=>n(o)))}else e.value&&(e=e.value);this.callFn(a,null,e,(()=>o(e)))}catch(e){this.callFn(a,e,null,(()=>n(e)))}}))}setStorage(t,r,o=this.cacheTime,n){return"object"===e(t)&&console.warn("setStorage(key, value, timer[, callback]) 的key是一个引用数据类型, 可能会获得错误的结果 -> ",t),"date"===e(o)?o=new Date(o).getTime():"number"==typeof o?o=Date.now()+o:"function"!=typeof o&&console.warn("setStorage(key, value, timer[, callback]) 的 timer 期望是一个 Number 或 Date, 实际为 -> ",e(o)),"uniapp"===this.platform&&(a(t)||console.warn('#{uniExcludeKey.join(", ")}, 为前缀的key, 为 uniapp 的系统保留关键前缀, 请避免使用')),new Promise(((e,a)=>{try{const a={value:r,[this.cacheKey]:Date.now(),[this.overtimeKey]:o},i=this.#t(t,JSON.stringify(a));this.callFn(n,null,i,(()=>e(i)))}catch(e){this.callFn(n,e,null,(()=>a(e)))}}))}removeStorage(e,t){return new Promise(((a,r)=>{try{const r=this.#a(e);this.callFn(t,null,r,(()=>a(r)))}catch(e){this.callFn(t,e,null,(()=>r(e)))}}))}clearStorage(e){return new Promise(((t,a)=>{try{const a=this.#r();this.callFn(e,null,a,(()=>t(a)))}catch(t){this.callFn(e,t,null,(()=>a(t)))}}))}clearDateStorage(e){return new Promise((async(t,a)=>{try{const a=await this.getCatchDataKey();for(const e of a)this.removeStorageSync(e);this.callFn(e,null,null,(()=>t({success:!0})))}catch(t){this.callFn(e,t,null,(()=>a(t)))}}))}getStorageInfo(e){return new Promise((async(t,a)=>{try{const a=await this.#o(),r=Object.create(null);r.cache=[],r.origin=[];for(let e=0;e<a.keys.length;e++){const t=a.keys[e];let o=this.#e(t);try{o=JSON.parse(o)}catch(e){console.log("json转换失败了: ",e)}o[this.cacheKey]&&o[this.overtimeKey]?r.cache.push({key:t,value:o}):r.origin.push({key:t,value:o})}this.callFn(e,null,r,(()=>t(r)))}catch(t){this.callFn(e,t,null,(()=>a(t)))}}))}getCatchDataKey(e){return new Promise((async(t,a)=>{try{const a=(await this.getStorageInfo()).cache.map((e=>e.key));this.callFn(e,null,a,(()=>t(a)))}catch(t){this.callFn(e,t,null,(()=>a(t)))}}))}clearOvertimeData(e){return new Promise((async(t,a)=>{try{const a=(await this.getStorageInfo()).cache;for(let e=0;e<a.length;e++){const{key:t,value:r}=a[e];t&&Date.now()>=r[this.overtimeKey]&&(console.log("清理已超时的缓存数据 --\x3e : ",t),await this.#a(t))}this.callFn(e,null,null,(()=>t({success:!0})))}catch(t){this.callFn(e,t,null,(()=>a(t)))}}))}clearInterval(){this.timer&&clearInterval(this.timer),this.timer=null}setCacheTime(e){this.cacheTime=e,this.initOther()}setTimingClear(e){this.timingClear=e,this.initOther()}getStorageSync(e){return this.#e(e)}setStorageSync(e,t){return"uniapp"===this.platform&&(a(e)||console.warn('#{uniExcludeKey.join(", ")}, 为前缀的key, 为 uniapp 的系统保留关键前缀, 请避免使用')),this.#t(e,t)}removeStorageSync(e){return this.#a(e)}clearStorageSync(){return this.#r()}}module.exports=r;