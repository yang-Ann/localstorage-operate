// TODO 微信全局变量类型
declare namespace wx {
	function getStorageSync(k: string): any;
	function setStorageSync(k: string, v: string): any;
	function removeStorageSync(key: string): any;
	function clearStorageSync(): any;
	function getStorageInfoSync(): any;
}
