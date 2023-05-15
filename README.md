# localstorage-operate

封装了本地缓存, 支持`web`(*localstorage*), `uniapp`和`微信小程序`, 支持控制数据的缓存时长, 自动清理超时缓存数据, 支持使用`async`和`callback`两种方式使用

## 使用
```ts
import LocalstorageOperate from "@anlib/localstorage-operate";
const overtime = 5000;
const key1 = "name";
const value1 = "张三";
const key2 = "age";
const value2 = 18;

// web 平台, 数据默认超时 5000ms
const instance = new LocalstorageOperate("web", overtime);

//// 存储数据 //// 

// 可以不指定时长, 这样就是默认时长, 存储的值可以是对象
instance.setStorage(key1, value1, overtime).then(() => {
  console.log("async success");
}).catch(err => {
  console.log("async err: ", err);
});

// 第三个参数设置超时时间
instance.setStorage(key2, value2, overtime, (err) => {
  if (err) {
    console.log("callback error: ", err);
    return;
  }
  console.log("callback success");
});

//// 获取数据 ////
instance.getStorage(key1)
  .then(res => {
    console.log("async res: ", res);
  }).catch(err => {
    if (err.flog === LocalstorageOperate.OVERTIME) {
      // 数据已超时
      console.log(err);
    } else if (err.flog === LocalstorageOperate.VOID) {
      // 不存在对应的数据
      console.log(err);
    } else {
      console.log("其他错误: ", err);
    }
  });

instance.getStorage(key2, (err, res) => {
  if (err) {
    if (err.flog === LocalstorageOperate.OVERTIME) {
      // 数据已超时
      console.log(err);
    } else if (err.flog === LocalstorageOperate.VOID) {
      // 不存在对应的数据
      console.log(err);
    } else {
      console.log("其他错误: ", err);
    }
    return;
  }
  console.log("callback res: ", res);
});

//// 获取缓存数据信息 ////
// 缓存数据的key
const cacheKeys = await instance.getCatchDataKey();
console.log("缓存数据的key: ", cacheKeys);

// 缓存缓存信息, 类型是: { key: string, value: string }[]
const { cache, origin } = await instance.getStorageInfo();
console.log("带缓存的数据: ", cache);
console.log("其他的数据: ", origin);


//// 删除数据 ////
// 删除数据
// await instance.removeStorage()

// 清除缓存超时的缓存
// await instance.clearOvertimeData()

// 清空缓存的数据
await instance.clearDateStorage()
console.log("async success");

// 清空所有的数据
// await instance.clearStorage()


//// 原先方法 ////
instance.setStorageSync(this.key, this.value);
// -> localStorage.setItem();

let value = instance.getStorageSync(this.key);
// -> localStorage.getItem();
console.log(`key: ${this.key}, value: ${value}`);

instance.removeStorageSync(this.key);
// -> localStorage.removeItem();

value = instance.getStorageSync(this.key);
console.log(`key: ${this.key}, value: ${value}`);

// instance.clearStorageSync();
// -> localStorage.clear();
```
> 更多使用参考[test.html](https://github.com/yang-Ann/localstorage-operate/blob/master/test.html)