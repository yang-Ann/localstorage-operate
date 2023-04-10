
export type PlatformType = "web" | "wechat" | "uniapp";
export type CallbackType = (...args: any[]) => void;
export type ValueType = { key: string; value: any };
export type StorageInfoType = {
	cache: ValueType[];
	origin: ValueType[];
};
export type P<T = any> = Promise<T>;

// 判断数据类型
const getDateType = (val: any) => {
	return Object.prototype.toString.call(val).slice(8, -1).toLocaleLowerCase();
}

// uniapp 保留key
const uniExcludeKey = ["uni-", "uni_", "dcloud-", "dcloud_"];
const checkUniKey = (key: string) => {
	let ret = true;
	for (const item of uniExcludeKey) {
		if (key.startsWith(item)) {
			ret = false;
			break;
		}
	}
	return ret;
}

/**
 * 通用缓存数据操作, 支持 web | wechat | uniapp, 带缓存超时, 支持回调 和 Promise 两种使用方式
 */
class CatchAdapter {
	#getStorage!: (k: string) => any;
	#setStorage!: (k: string, v: any) => any;
	#removeStorage!: (k: string) => any;
	#clearStorage!: () => any;
	#getStorageInfo!: () => ({
		keys: string[];
		currentSize: number;
		limitSize: number;
	});

	cacheKey = "__CATCH_KEY"; // 缓存数据的时间key
	overtimeKey = "__OVERTIME_KEY"; // 数据超时的key
	timer: null | number = null; // 定时器

	constructor(
		public platform: PlatformType, // 使用平台
		public cacheTime: number | Date, // 默认的数据缓存时长(事件戳或日期对象)
		public timingClear = false, // 是否定时清理缓存数据
	) {
		this.init();
	}

	static OVERTIME = "overtime" // 获取的数据超时
	static VOID = "void" // 获取的数据不存在
	static instanceof: null | CatchAdapter = null; // 保存单例实例

	/**
	 * 获取实例(单例模式)
	 */
	static getInstanceof(platform: PlatformType, catchTime: Date | number, timingClear = false) {
		const operate = CatchAdapter.instanceof;
		if (!operate) {
			CatchAdapter.instanceof = new CatchAdapter(platform, catchTime, timingClear);
		}
		return CatchAdapter.instanceof;
	}

	public init() {
		this.initCommonApi();
		this.initOther();
	}

	/**
	 * 初始化api
	 */
	public initCommonApi() {
		try {
			switch (this.platform) {
				case "web":
					// localStorage 的方法不能使用解构, 也不能直接赋值函数的引用
					// const { getItem, setItem, removeItem, clear } = window.localStorage;
					this.#getStorageInfo = () => {
						return {
							keys: Object.keys(window.localStorage),
							currentSize: window.localStorage.length,
							limitSize: 0, // web无法获取大小
						};
					};
					this.#getStorage = (key: string) => window.localStorage.getItem(key);
					this.#setStorage = (key: string, value: any) => window.localStorage.setItem(key, value);
					this.#removeStorage = (key: string) => window.localStorage.removeItem(key);
					this.#clearStorage = () => window.localStorage.clear();
					break;

				case "wechat":
					// TODO wx的全局变量类型声明, 可见 src/typings/global.d.ts
					// eslint-disable-next-line no-case-declarations
					const { getStorageSync, setStorageSync, removeStorageSync, clearStorageSync } = wx;
					this.#getStorageInfo = wx.getStorageInfoSync;
					this.#getStorage = getStorageSync;
					this.#setStorage = setStorageSync;
					this.#removeStorage = removeStorageSync;
					this.#clearStorage = clearStorageSync;
					break;

				case "uniapp":
					{
						const { getStorageSync, setStorageSync, removeStorageSync, clearStorageSync } = uni;
						this.#getStorageInfo = uni.getStorageInfoSync;
						this.#getStorage = getStorageSync;
						this.#setStorage = setStorageSync;
						this.#removeStorage = removeStorageSync;
						this.#clearStorage = clearStorageSync;
					}
					break;
				default:
					throw new Error();
			}
		} catch (e) {
			throw new Error(`不存在 ${this.platform} 平台的API: #{e}`);
		}
	}

	/**
	 * 初始化其他
	 */
	public initOther() {
		const type = getDateType(this.cacheTime)
		if (type === "date") {
			this.cacheTime = new Date(this.cacheTime).getTime();
		} else if (type !== "number") {
			throw new Error("日期参数非法, 期望 Date | Number, 实际为 -> " + type);
		}

		// 定时清理缓存的数据
		if (this.timingClear && typeof this.cacheTime === "number") {
			this.clearInterval();
			this.timer = setInterval(() => {
				this.clearOvertimeData();
			}, this.cacheTime);
		}
	}

	/**
	 * 触发回调
	 */
	public callFn(fn?: CallbackType, ...args: any[]) {
		const next = args.pop();
		if (typeof fn === "function") {
			fn(...args)
		} else if (typeof next === "function") {
			// 触发 promise
			next();
		}
	}

	/**
	 * 获取缓存数据
	 */
	public getStorage(key: string, callback?: CallbackType): P {
		return new Promise((resolve, reject) => {
			if (getDateType(key) === "object") {
				console.warn("getStorage(key) 的key是一个引用数据类型, 可能会获得错误的结果 -> ", key);
			}

			try {
				let res = this.#getStorage(key);
				if (!res) {
					const error = {
						flog: CatchAdapter.VOID,
						msg: "获取不存在数据: " + key
					};
					// 带回调触发回调(不然就触发 promise)
					const next = () => reject(error);
					this.callFn(callback, error, null, next);
					return;
				}
				
				// 进行 JSON 转换, 不需要处理错误
				try {
					res = JSON.parse(res);
				} catch (error) {
					console.warn("json转换失败了: ", error);
				}

				// 缓存超时
				if (res && (Date.now() > res[this.overtimeKey])) {
					this.removeStorage(key);
					res = null;
					const error = {
						flog: CatchAdapter.OVERTIME,
						msg: "缓存超时: " + key
					}
					this.callFn(callback, error, null, () => reject(error));
				} else {
					if (res.value) res = res.value;
				}
				this.callFn(callback, null, res, () => resolve(res));
			} catch (err) {
				this.callFn(callback, err, null, () => reject(err));
			}
		});
	}

	/**
	 * 设置缓存数据(支持自定义存储时长)
	 */
	public setStorage(
		key: string,
		value: any,
		cacheTime = this.cacheTime,
		callback?: CallbackType
	) {

		if (getDateType(key) === "object") {
			console.warn("setStorage(key, value, timer[, callback]) 的key是一个引用数据类型, 可能会获得错误的结果 -> ", key);
		}

		if (getDateType(cacheTime) === "date") {
			cacheTime = new Date(cacheTime).getTime();
		} else if (typeof cacheTime === "number") {
			cacheTime = Date.now() + cacheTime;
		} else if (typeof cacheTime !== "function") {
			console.warn("setStorage(key, value, timer[, callback]) 的 timer 期望是一个 Number 或 Date, 实际为 -> ", getDateType(cacheTime));
		}
		
		if (this.platform === "uniapp") {
			if (!checkUniKey(key)) {
				console.warn(`#{uniExcludeKey.join(", ")}, 为前缀的key, 为 uniapp 的系统保留关键前缀, 请避免使用`);
			}
		}
		
		return new Promise((resolve, reject) => {
			try {
				// 存储的数据
				const obj = {
					value,
					[this.cacheKey]: Date.now(),
					[this.overtimeKey]: cacheTime,
				};
				const res = this.#setStorage(key, JSON.stringify(obj));
				this.callFn(callback, null, res, () => resolve(res));
			} catch (err) {
				this.callFn(callback, err, null, () => reject(err));
			}
		});
	}

	/**
	 * 删除缓存数据
	 */
	public removeStorage(key: string, callback?: CallbackType) {
		return new Promise((resolve, reject) => {
			try {
				const res = this.#removeStorage(key);
				this.callFn(callback, null, res, () => resolve(res));
			} catch (err) {
				this.callFn(callback, err, null, () => reject(err));
			}
		});
	}
	
	/**
	 * 清空所有的数据
	 */
	public clearStorage(callback?: CallbackType) {
		return new Promise((resolve, reject) => {
			try {
				const res = this.#clearStorage();
				this.callFn(callback, null, res, () => resolve(res));
			} catch (err) {
				this.callFn(callback, err, null, () => reject(err));
			}
		});
	}
	
	/**
	 * 清空缓存的数据
	 */
	public clearDateStorage(callback?: CallbackType) {
		return new Promise(async (resolve, reject) => {
			try {
				const catchKeys = await this.getCatchDataKey();
				for (const key of catchKeys) {
					this.removeStorageSync(key);
				}
				this.callFn(callback, null, null, () => resolve({success: true}));
			} catch (err) {
				this.callFn(callback, err, null, () => reject(err));
			}
		});
	}
	
	/**
	 * 获取缓存的信息
	 */
	public getStorageInfo(callback?: CallbackType): P<StorageInfoType> {
		return new Promise(async (resolve, reject) => {
			try {
				const storage = await this.#getStorageInfo();

				const result = Object.create(null);
				result.cache = [], // 缓存数据
				result.origin = [] // 不是缓存的数据

				for (let i = 0; i < storage.keys.length; i++) {
					const key = storage.keys[i];
					let value = this.#getStorage(key);
					// JSON 化一下
					try {
						value = JSON.parse(value);
					} catch (error) {
						console.log("json转换失败了: ", error);
					}

					if (value[this.cacheKey] && value[this.overtimeKey]) {
						// 使用缓存的数据
						result.cache.push({ key, value });
					} else {
						result.origin.push({ key, value });
					}
				}
				this.callFn(callback, null, result, () => resolve(result));
			} catch (err) {
				this.callFn(callback, err, null, () => reject(err));
			}
		});
	}
	/**
	 * 获取所有缓存数据的key
	 */
	public getCatchDataKey(callback?: CallbackType): P<string[]> {
		return new Promise(async (resolve, reject) => {
			try {
				const catchData = await this.getStorageInfo();
				const result = catchData.cache.map(e => e.key);
				this.callFn(callback, null, result, () => resolve(result));
			} catch (err) {
				this.callFn(callback, err, null, () => reject(err));
			}
		});
	}

	/**
	 * 清除超时的缓存
	 */
	clearOvertimeData(callback?: CallbackType) {
		return new Promise(async (resolve, reject) => {
			try {
				const storage = await this.getStorageInfo();
				const catchData = storage.cache;
				for (let i = 0; i < catchData.length; i++) {
					const { key, value } = catchData[i];
					if (key && Date.now() >= value[this.overtimeKey]) {
						console.log("清理已超时的缓存数据 --> : ", key);
						await this.#removeStorage(key);
					}
				}
				this.callFn(callback, null, null, () => resolve({success: true}));
			} catch (err) {
				this.callFn(callback, err, null, () => reject(err));
			}
		});
	}

	/**
	 * 清除定时器
	 */
	public clearInterval() {
		if (this.timer) clearInterval(this.timer);
		this.timer = null;
	}

	/**
	 * 设置超时时间
	 */
	public setCacheTime(time: number | Date) {
		this.cacheTime = time;
		// 校验参数
		this.initOther();
	}

	/**
	 * 设置定时清理
	 */
	public setTimingClear(timingClear: boolean) {
		this.timingClear = timingClear;
		this.initOther();
	}
	
	//////////////// 提供同步方法

	/**
	 * 同步获取值
	 */
	public getStorageSync(key: string) {
		return this.#getStorage(key);
	}

	/**
	 * 同步设置值
	 */
	public setStorageSync(key: string, value: any) {
		if (this.platform === "uniapp") {
			if (!checkUniKey(key)) {
				console.warn(`#{uniExcludeKey.join(", ")}, 为前缀的key, 为 uniapp 的系统保留关键前缀, 请避免使用`);
			}
		}
		return this.#setStorage(key, value);
	}
	/**
	 * 同步删除值
	 */
	public removeStorageSync(key: string) {
		return this.#removeStorage(key);
	}

	/**
	 * 同步清空值
	 */
	public clearStorageSync() {
		return this.#clearStorage();
	}
}

export default CatchAdapter;