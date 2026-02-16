# 自动精灵API参考

## 目录

1. [提示弹窗](#提示弹窗)
2. [点击滑动](#点击滑动)
3. [设备信息](#设备信息)
4. [设备控制](#设备控制)
5. [文件操作](#文件操作)
6. [颜色操作](#颜色操作)
7. [变量存储](#变量存储)
8. [网络请求](#网络请求)
9. [OCR识别](#ocr识别)
10. [动作控制](#动作控制)
11. [节点查找](#节点查找)
12. [坐标查找](#坐标查找)
13. [屏幕识别](#屏幕识别)

---

## 提示弹窗

### zdjl.toast()

显示一个短暂的提示消息。

```javascript
zdjl.toast(message: string, duration?: number): void
```

**参数：**
- `message` - 要显示的消息内容
- `duration` - 显示时长（毫秒），可选

**示例：**
```javascript
zdjl.toast("操作完成", 2000);
```

### zdjl.alert()

显示一个弹窗提示。

```javascript
zdjl.alert(message: string, options?: { duration?: number; title?: string }): void
zdjl.alertAsync(message: string, options?: { duration?: number; title?: string }): Promise<void>
```

**示例：**
```javascript
zdjl.alert("操作成功", { title: "提示", duration: 3000 });
await zdjl.alertAsync("异步弹窗");
```

### zdjl.confirm()

显示一个确认弹窗。

```javascript
zdjl.confirm(message: string, options?: { duration?: number; title?: string }): any
zdjl.confirmAsync(message: string, options?: { duration?: number; title?: string }): Promise<any>
```

**示例：**
```javascript
const result = zdjl.confirm("确定要继续吗？");
if (result) {
    // 用户点击确认
}
```

### zdjl.prompt()

显示一个输入提示弹窗。

```javascript
zdjl.prompt(message: string, defaultValue?: string, options?: { duration?: number }): any
zdjl.promptAsync(message: string, defaultValue?: string, options?: { duration?: number }): Promise<any>
```

**示例：**
```javascript
const name = zdjl.prompt("请输入名称", "默认值");
```

### zdjl.select()

显示一个选择弹窗。

```javascript
zdjl.select(config: {
    title?: string;
    items: string[];
    selectItems?: string[];
    multi?: false;
    duration?: number
}): { result: number; items: string }
```

**示例：**
```javascript
const result = zdjl.select({
    title: "请选择",
    items: ["选项1", "选项2", "选项3"]
});
zdjl.toast(`选择了: ${result.items}`);
```

---

## 点击滑动

### zdjl.click()

点击指定坐标。

```javascript
zdjl.click(x: number | string, y: number | string, duration?: number): void
zdjl.clickAsync(x: number | string, y: number | string, duration?: number): Promise<void>
```

**参数：**
- `x` - X坐标（支持px、%、dp）
- `y` - Y坐标（支持px、%、dp）
- `duration` - 点击持续时间（毫秒），可选

**示例：**
```javascript
zdjl.click(500, 800);                    // 点击坐标(500, 800)
zdjl.click("50%", "30%");                // 点击屏幕中央偏上
await zdjl.clickAsync(500, 800, 100);    // 长按100ms
```

### zdjl.longClick()

长按指定坐标。

```javascript
zdjl.longClick(x: number | string, y: number | string): void
zdjl.longClickAsync(x: number | string, y: number | string): Promise<void>
```

**示例：**
```javascript
zdjl.longClick(500, 800);
```

### zdjl.swipe()

从坐标(x1,y1)滑动到坐标(x2,y2)。

```javascript
zdjl.swipe(x1: number | string, y1: number | string, x2: number | string, y2: number | string, duration?: number): void
zdjl.swipeAsync(x1: number | string, y1: number | string, x2: number | string, y2: number | string, duration?: number): Promise<void>
```

**示例：**
```javascript
zdjl.swipe(500, 1500, 500, 500, 500);    // 向上滑动
zdjl.swipe("50%", "80%", "50%", "20%", 300);  // 使用百分比
```

### zdjl.gesture()

执行一段手势操作。

```javascript
zdjl.gesture(duration: number, ...xyArray: Array<[number | string, number | string]>): void
zdjl.gestureAsync(duration: number, ...xyArray: Array<[number | string, number | string]>): Promise<void>
```

**示例：**
```javascript
// 三点手势
zdjl.gesture(1000, [500, 1000], [600, 800], [500, 600]);
```

### zdjl.gestures()

执行多指手势操作。

```javascript
zdjl.gestures(...gestureConfigs: Array<[number, ...Array<[number | string, number | string]>]>): void
```

**示例：**
```javascript
// 双指上滑
zdjl.gestures(
    [1000, [100, 500], [100, 200]],
    [1000, [400, 500], [400, 200]]
);
```

---

## 设备信息

### zdjl.getDeviceInfo()

获取当前设备信息。

```javascript
zdjl.getDeviceInfo(): {
    appVersion: string;
    appVersionCode: number;
    deviceId: string;
    userAgent: string;
    screenRotation: number;
    screenWidth: number;
    screenHeight: number;
    width: number;
    height: number;
    density: number;
    densityDpi: number;
    clientType: "android" | "pc"
}
```

**示例：**
```javascript
const device = zdjl.getDeviceInfo();
zdjl.toast(`屏幕: ${device.screenWidth}x${device.screenHeight}`);
```

### zdjl.getUser()

获取当前用户信息。

```javascript
zdjl.getUser(): { userId: string; userName: string; isVip: boolean }
```

**示例：**
```javascript
const user = zdjl.getUser();
zdjl.toast(`用户: ${user.userName}, VIP: ${user.isVip}`);
```

### zdjl.getAppVersion()

获取自动精灵应用版本。

```javascript
zdjl.getAppVersion(): string
```

### zdjl.getInstalledAppInfo()

获取安装的所有应用信息。

```javascript
zdjl.getInstalledAppInfo(): Array<{
    isSystemApp: boolean;
    packageName: string;
    versionCode: number;
    versionName: string;
    label: string
}>
```

**示例：**
```javascript
const apps = zdjl.getInstalledAppInfo();
apps.forEach(app => console.log(app.label));
```

### zdjl.getLocation()

获取当前手机定位经纬度。

```javascript
zdjl.getLocation(param: { timeout?: number }): object
zdjl.getLocationAsync(param: { timeout?: number }): Promise<object>
```

---

## 设备控制

### zdjl.setScreenBrightness()

设置屏幕亮度。

```javascript
zdjl.setScreenBrightness(value: number): string
```

**参数：**
- `value` - 亮度值（-1 ~ 255），-1表示自动亮度

**示例：**
```javascript
zdjl.setScreenBrightness(150);
zdjl.setScreenBrightness(-1);  // 自动亮度
```

### zdjl.setWifiEnable()

设置WIFI开关。

```javascript
zdjl.setWifiEnable(enable: boolean): void
zdjl.setWifiEnableAsync(enable: boolean): Promise<void>
```

### zdjl.setBluetoothEnable()

设置蓝牙开关。

```javascript
zdjl.setBluetoothEnable(enable: boolean): void
```

### zdjl.setCameraFlashEnable()

设置闪光灯开关。

```javascript
zdjl.setCameraFlashEnable(enable: boolean): void
```

### zdjl.vibrator()

震动。

```javascript
zdjl.vibrator(duration?: number, amplitude?: number): any
```

**参数：**
- `duration` - 震动时长（毫秒）
- `amplitude` - 震动强度（1-255）

**示例：**
```javascript
zdjl.vibrator(500, 128);
```

### zdjl.wakeupScreen()

唤醒屏幕。

```javascript
zdjl.wakeupScreen(): void
```

### zdjl.playMedia()

播放指定路径的音频。

```javascript
zdjl.playMedia(url: string): any
zdjl.playMediaAsync(url: string): Promise<any>
```

---

## 文件操作

### zdjl.readFile()

读取目标路径的文件内容。

```javascript
zdjl.readFile(filePath: string, options?: {
    encode?: "UTF-8" | "GBK" | "BASE64";
    returnBuffer?: boolean
}): string | ArrayBuffer
zdjl.readFileAsync(filePath: string, options?: {...}): Promise<string | ArrayBuffer>
```

**示例：**
```javascript
const content = zdjl.readFile("/sdcard/test.txt");
const base64 = zdjl.readFile("/sdcard/image.png", { encode: "BASE64" });
```

### zdjl.writeFile()

写入文件内容到目标路径。

```javascript
zdjl.writeFile(filePath: string, fileContent: string | ArrayBuffer | Uint8Array): void
zdjl.writeFileAsync(filePath: string, fileContent: string | ArrayBuffer | Uint8Array): Promise<void>
```

**示例：**
```javascript
zdjl.writeFile("/sdcard/test.txt", "Hello World");
```

### zdjl.appendFile()

添加文件内容到目标路径的文件末尾。

```javascript
zdjl.appendFile(filePath: string, fileContent: string | ArrayBuffer | Uint8Array): void
```

**示例：**
```javascript
zdjl.appendFile("/sdcard/log.txt", "\n新的一行");
```

---

## 颜色操作

### zdjl.getScreenColor()

获取屏幕指定位置的颜色。

```javascript
zdjl.getScreenColor(x: number | string, y: number | string, ignoreCache?: boolean): number
zdjl.getScreenColorAsync(x: number | string, y: number | string, ignoreCache?: boolean): Promise<number>
```

**返回值：** 颜色值（十进制）

**示例：**
```javascript
const color = zdjl.getScreenColor(500, 800);
const hexColor = color.toString(16);  // 转换为十六进制
```

### zdjl.getScreenAreaColors()

获取屏幕指定区域的所有颜色。

```javascript
zdjl.getScreenAreaColors(param: {
    x: number | string;
    y: number | string;
    width: number | string;
    height: number | string;
    ignoreCache?: boolean;
    sampleSize?: number
}): { data: number[]; x: number; y: number; width: number; height: number }
```

**示例：**
```javascript
const colors = zdjl.getScreenAreaColors({
    x: 0, y: 0, width: 100, height: 100
});
```

---

## 变量存储

### zdjl.getVar() / zdjl.setVar()

获取/设置变量值。

```javascript
zdjl.getVar(varName: string, scope?: "global" | string): any
zdjl.setVar(varName: string, varValue: any, scope?: "global" | string): void
```

**示例：**
```javascript
zdjl.setVar("myVar", 123);
const value = zdjl.getVar("myVar");  // 123
```

### zdjl.getStorage() / zdjl.setStorage()

获取/设置本地储存值。

```javascript
zdjl.getStorage(storageKey: string, scope?: string): any
zdjl.setStorage(storageKey: string, content: any, scope?: string): void
```

### zdjl.getClipboard() / zdjl.setClipboard()

获取/设置剪贴板内容。

```javascript
zdjl.getClipboard(): string
zdjl.setClipboard(text: string): void
```

**示例：**
```javascript
zdjl.setClipboard("复制的内容");
const text = zdjl.getClipboard();
```

### zdjl.clearVars()

清空变量。

```javascript
zdjl.clearVars(scopeId?: string): void
```

---

## 网络请求

### zdjl.requestUrl()

请求链接内容。

```javascript
zdjl.requestUrl(config: {
    url: string;
    method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
    headers?: { [key: string]: string; }[];
    requestBody?: string;
    requestType?: string;
    responseType?: string;
    timeout?: number
}): { code: number; body: string; headers: Record<string, string | string[]> }
```

**示例：**
```javascript
// GET请求
const response = zdjl.requestUrl({
    url: "https://api.example.com/data",
    method: "GET"
});

// POST请求
const response = zdjl.requestUrl({
    url: "https://api.example.com/submit",
    method: "POST",
    requestBody: JSON.stringify({ name: "test" }),
    headers: [{ "Content-Type": "application/json" }]
});

zdjl.toast(`状态码: ${response.code}`);
```

---

## OCR识别

### zdjl.ocr()

对传入的base64图片内容执行OCR识别。

```javascript
zdjl.ocr(param: {
    mode?: "local" | "online";
    base64: string;
    resultType?: "text" | "raw"
}): string | Array<{ text: string; left: number; top: number; right: number; bottom: number }>
```

**示例：**
```javascript
const imageData = zdjl.readFile("/sdcard/screenshot.png", { encode: "BASE64" });
const text = zdjl.ocr({ base64: imageData, mode: "local" });
```

---

## 动作控制

### zdjl.runAction()

运行一个动作。

```javascript
zdjl.runAction(actionJSON: object): void
zdjl.runActionAsync(actionJSON: object): Promise<void>
```

**示例：**
```javascript
zdjl.runAction({
    type: "点击",
    x: 500,
    y: 800
});
```

### zdjl.check()

检查运行条件，返回条件是否成立。

```javascript
zdjl.check(conditionJSON: object): boolean
zdjl.checkAsync(conditionJSON: object): Promise<boolean>
```

**示例：**
```javascript
const result = zdjl.check({
    type: "colorFound",
    colorData: { type: "color", color: "#FF0000" }
});
```

---

## 节点查找

### zdjl.findNode()

查找节点。

```javascript
zdjl.findNode<FindAll extends boolean>(posData: any, config: {
    findAll?: FindAll;
    withChildren?: boolean
}): FindNodeResult | FindNodeResult[]
```

**返回值：**
```typescript
interface FindNodeResult {
    text: string;
    className: string;
    idResName: string;
    packageName: string;
    boundLeft: number;
    boundTop: number;
    boundRight: number;
    boundBottom: number;
    children?: FindNodeResult[];
}
```

**示例：**
```javascript
// 查找单个节点
const node = zdjl.findNode({ text: "按钮" });
if (node) {
    zdjl.click((node.boundLeft + node.boundRight) / 2, 
               (node.boundTop + node.boundBottom) / 2);
}

// 查找所有匹配节点
const nodes = zdjl.findNode({ text: "按钮" }, { findAll: true });
```

---

## 坐标查找

### zdjl.findLocation()

查找坐标（支持图片、文字、颜色）。

```javascript
zdjl.findLocation(posData: PositionFind, findAll: boolean): LocationResult | LocationResult[]
```

**查找图片：**
```javascript
const loc = zdjl.findLocation({
    type: "image",
    imageData: {
        data: "base64图片数据",
        imageWidth: 100,
        imageHeight: 50,
        imageLeft: 0,
        imageTop: 0,
        screenWidth: 1080,
        screenHeight: 2340
    }
}, false);

if (loc) {
    zdjl.click(loc.x, loc.y);
}
```

**查找文字：**
```javascript
const loc = zdjl.findLocation({
    type: "text",
    text: "登录",
    ocrMode: "local"
}, false);
```

**查找颜色：**
```javascript
const loc = zdjl.findLocation({
    type: "color",
    color: { type: "color", color: "#FF0000" },
    similarPercent: 90
}, false);
```

---

## 屏幕识别

### zdjl.recognitionScreen()

识别屏幕内容。

```javascript
zdjl.recognitionScreen(config: {
    recognitionArea: string | area;
    ocrResultType?: "text" | "raw";
    recognitionMode?: "ocr_local" | "ocr_local_comp" | "ocr_online";
    imageFilter?: filter
}): string | Array<{ text: string; left: number; top: number; right: number; bottom: number }>
```

**示例：**
```javascript
// 识别全屏文字
const text = zdjl.recognitionScreen({
    recognitionArea: "0 0 100% 100%",
    recognitionMode: "ocr_local"
});

// 识别指定区域
const results = zdjl.recognitionScreen({
    recognitionArea: { left: 0, top: 0, right: 500, bottom: 200 },
    ocrResultType: "raw"
});
```

---

## 滤镜

识别时可以应用滤镜提高识别效果：

```javascript
// 黑白滤镜
const filter = { type: "bw", threshold: 128 };

// 灰度滤镜
const filter = { type: "grey" };

// 轮廓滤镜
const filter = { type: "outline", threshold: 128 };

// 反色滤镜
const filter = { type: "reverse" };

// 亮度调整
const filter = { type: "lightness", change: 50 };

// 对比度调整
const filter = { type: "contrast", change: 30 };

// RGB调整
const filter = { 
    type: "rgb", 
    changeRed: 10, 
    changeGreen: 20, 
    changeBlue: -10 
};

// 多滤镜组合
const filter = {
    filters: [
        { type: "grey" },
        { type: "lightness", change: 30 }
    ]
};
```
