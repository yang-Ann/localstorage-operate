export type PlatformType = "web" | "wechat" | "uniapp";
export type CallbackType = (...args: any[]) => void;
export type ValueType = {
    key: string;
    value: any;
};
export type StorageInfoType = {
    cache: ValueType[];
    origin: ValueType[];
};
export type P<T = any> = Promise<T>;
/**
 * 通用缓存数据操作, 支持 web | wechat | uniapp, 带缓存超时, 支持回调 和 Promise 两种使用方式
 */
declare class CatchAdapter {
    #private;
    platform: PlatformType;
    cacheTime: number | Date;
    timingClear: boolean;
    cacheKey: string;
    overtimeKey: string;
    timer: null | number;
    constructor(platform: PlatformType, // 使用平台
    cacheTime: number | Date, // 默认的数据缓存时长(事件戳或日期对象)
    timingClear?: boolean);
    static OVERTIME: string;
    static VOID: string;
    static instanceof: null | CatchAdapter;
    /**
     * 获取实例(单例模式)
     */
    static getInstanceof(platform: PlatformType, catchTime: Date | number, timingClear?: boolean): CatchAdapter | null;
    init(): void;
    /**
     * 初始化api
     */
    initCommonApi(): void;
    /**
     * 初始化其他
     */
    initOther(): void;
    /**
     * 触发回调
     */
    callFn(fn?: CallbackType, ...args: any[]): void;
    /**
     * 获取缓存数据
     */
    getStorage(key: string, callback?: CallbackType): P;
    /**
     * 设置缓存数据(支持自定义存储时长)
     */
    setStorage(key: string, value: any, cacheTime?: number | Date, callback?: CallbackType): Promise<unknown>;
    /**
     * 删除缓存数据
     */
    removeStorage(key: string, callback?: CallbackType): Promise<unknown>;
    /**
     * 清空所有的数据
     */
    clearStorage(callback?: CallbackType): Promise<unknown>;
    /**
     * 清空缓存的数据
     */
    clearDateStorage(callback?: CallbackType): Promise<unknown>;
    /**
     * 获取缓存的信息
     */
    getStorageInfo(callback?: CallbackType): P<StorageInfoType>;
    /**
     * 获取所有缓存数据的key
     */
    getCatchDataKey(callback?: CallbackType): P<string[]>;
    /**
     * 清除超时的缓存
     */
    clearOvertimeData(callback?: CallbackType): Promise<unknown>;
    /**
     * 清除定时器
     */
    clearInterval(): void;
    /**
     * 设置超时时间
     */
    setCacheTime(time: number | Date): void;
    /**
     * 设置定时清理
     */
    setTimingClear(timingClear: boolean): void;
    /**
     * 同步获取值
     */
    getStorageSync(key: string): any;
    /**
     * 同步设置值
     */
    setStorageSync(key: string, value: any): any;
    /**
     * 同步删除值
     */
    removeStorageSync(key: string): any;
    /**
     * 同步清空值
     */
    clearStorageSync(): any;
}
export default CatchAdapter;
