type px = `${number}%` | `${number}dp` | number;

type indexNum = number | `${number}` | `${number},${number}` | `${number},${number},${number}`;

type asDate = `${number}=${number}=${number} ${number}:${number}:${number}` | `${number}:${number}:${number}` | `+${number}:${number}:${number}`;

type asTime = `${number}ms` | `${number}s` | `${number}h`;

type aimPosition = `${number}` | `+${number}` | `-${number}` | `:${string}`;

interface area {
  left: px;
  top: px;
  right: px;
  bottom: px;
}

interface color {
  type: 'color';
  color: `#${string}`;
}

interface image {
  data: string;
  imageWidth: number;
  imageHeight: number;
  imageLeft: number;
  imageTop: number;
  screenWidth: number;
  screenHeight: number;
}

interface imageForRecognition {
  data: string;
  width: number;
  height: number;
  scale: number;
}

interface LocationResult {
  x: number;
  y: number;
  x_100: number;
  y_100: number;
  x_dp: number;
  y_dp: number;
}

interface textRawItem {
  text: string;
  left: number;
  top: number;
  right: number;
  bottom: number;
}

interface rawItem {
  text: string;
  left: number;
  top: number;
  right: number;
  bottom: number;
}

type filter = blackWhite | grey | outline | reverse | lightness | contrast | rgb | changeColor | multi;

interface blackWhite {
  type: 'bw';
  threshold?: number;
  greyAlgorithm?: 'average' | 'max';
}

interface grey {
  type: 'grey';
  threshold?: number;
  greyAlgorithm?: 'average' | 'max';
}

interface outline {
  type: 'outline';
  threshold: number;
}

interface reverse {
  type: 'reverse';
}

interface lightness {
  type: 'lightness';
  change: number;
}

interface contrast {
  type: 'contrast';
  change: number;
}

interface rgb {
  type: 'rgb';
  changeRed: number;
  changeGreen: number;
  changeBlue: number;
}

interface changeColor {
  type: 'changeColor';
  changeColorRules: Array<{
    similarPercent: number;
    srcColor: number;
    destColor: number;
  }>;
  otherColorChangeTo: number;
}

interface multi {
  filters: Array<filter>;
}

type PositionFind = findImage | findText | findColor;

interface findImage {
  type: 'image';
  imageData: image;
  limitArea?: `${px} ${px} ${px} ${px}` | area;
  minSimilarPercent?: number;
  indexNum?: indexNum;
  quickSearch?: boolean;
  searchMode?: 'color_2.21' | 'outline_2.21' | 'COLOR' | 'HOG';
  imageFilter?: filter;
  imageScaleType?: 'dpi' | 'baseScreenWidth' | 'baseScreenHeight' | 'baseScreenWidthAndHeight' | 'tryAll';
  xOffset?: number;
  yOffset?: number;
}

interface findText {
  type: 'text';
  text: string;
  ocrMode?: 'local' | 'local_v2' | 'online';
  limitArea?: `${px} ${px} ${px} ${px}` | area;
  filter?: filter;
  indexNum?: indexNum;
  xOffset?: number;
  yOffset?: number;
}

interface findColor {
  type: 'color';
  color: color;
  limitPosX?: px;
  limitPosY?: px;
  limitArea?: `${px} ${px} ${px} ${px}` | area;
  similarPercent?: number;
  x?: px;
  y?: px;
  xOffset?: number;
  yOffset?: number;
}

interface findNode {
  type: 'node';
  text: string;
  textIsRegExp?: boolean;
  idResName?: string;
  className?: string;
  depth?: string;
  packageName?: string;
  limitArea?: `${px} ${px} ${px} ${px}` | area;
  indexNum?: indexNum;
  useNodeDataCache?: boolean;
  findInAllWindow?: boolean;
}

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

interface Condition {
  runWhenFalse?: boolean;
  checkBeforeDelay?: boolean;
  repeatWhenFalse?: boolean;
  repeatWhenFalseLimitTimes?: number;
  repeatWhenFalseRepeatDelay?: number;
  desc?: string;
}

interface colorFound extends Condition {
  type: 'colorFound';
  colorData: findColor;
}

interface imageFound extends Condition {
  type: 'image';
  image: findImage;
}

interface nodeFound extends Condition {
  type: 'nodeFound';
  node: findNode;
}

interface limitRunTimes extends Condition {
  type: 'limitRunTimes';
  limitTimes: number;
  resetTime?: 'afterFinish' | 'afterRepeat';
  syncNowRunTimesToVarName?: string;
}

interface limitRunTime extends Condition {
  type: 'limitRunTime';
  limitTime: number;
  runTime: number;
}

interface scriptRunState extends Condition {
  type: 'scriptRunState';
  aimPosition: aimPosition;
  aimScriptRunState?: 'suc' | 'fail' | 'notRun';
}

interface random extends Condition {
  type: 'random';
  percent: number;
}

interface timeAfter extends Condition {
  type: 'timeAfter';
  time: asDate;
}

interface timeInterval extends Condition {
  type: 'timeInterval';
  time: asTime;
  ignoreInitPass?: boolean;
}

interface jsExpression extends Condition {
  type: 'jsExpression';
  expression: string;
}

interface conditionSet extends Condition {
  type: 'conditionSet';
  conditions: Array<condition>;
  checkInMultiThreads?: boolean;
  matchMode?: 'and' | 'or' | 'count';
  matchCount?: number;
}

type condition = jsExpression | conditionFound | conditionSet;

type conditionFound = colorFound | imageFound | nodeFound | limitRunTimes | limitRunTime | scriptRunState | random | timeAfter | timeInterval;

interface RequestUrlConfig {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: {
    [key: string]: string;
  }[];
  requestBody?: string;
  requestType?: string;
  responseType?: string;
  timeout?: number;
}

interface recognitionScreenTextConfig {
  recognitionArea: `${px} ${px} ${px} ${px}` | area;
  ocrResultType?: 'text' | 'raw';
  recognitionMode?: 'ocr_local' | 'ocr_local_comp' | 'ocr_online';
  imageFilter?: filter;
}

interface recognitionScreenCaptchaConfig {
  recognitionArea: `${px} ${px} ${px} ${px}` | area;
  ocrResultType: 'raw';
  recognitionMode: 'image_captcha';
  imageFilter?: filter;
}

interface recognitionScreenImageDataConfig {
  recognitionArea: `${px} ${px} ${px} ${px}` | area;
  ocrResultType: 'raw';
  recognitionMode: 'get_image_data';
  imageFilter?: filter;
}

interface recognitionScreenHumanConfig {
  recognitionArea: `${px} ${px} ${px} ${px}` | area;
  ocrResultType: 'raw';
  recognitionMode: 'position_by_human';
  imageFilter?: filter;
  humanRecMaxPositionCount?: number;
  humanRecHelp?: string;
}

declare interface zdjl {
  toast(message: string, duration?: number): void;

  alert(message: string, options?: {
    duration?: number;
    title?: string;
  }): void;

  alertAsync(message: string, options?: {
    duration?: number;
    title?: string;
  }): Promise<void>;

  confirm(message: string, options?: {
    duration?: number;
    title?: string;
  }): any;

  confirmAsync(message: string, options?: {
    duration?: number;
    title?: string;
  }): Promise<any>;

  prompt(message: string, defaultValue?: string, options?: {
    duration?: number;
  }): any;

  promptAsync(message: string, defaultValue?: string, options?: {
    duration?: number;
  }): Promise<any>;

  select<Multi extends boolean>(config: {
    title?: string;
    items: string[];
    selectItems?: string[];
    multi?: Multi;
    duration?: number;
  }): Multi extends true ? {
    result: number[];
    items: string[];
  } : {
    result: number;
    items: string;
  };

  selectAsync<Multi extends boolean>(config: {
    title?: string;
    items: string[];
    selectItems?: string[];
    multi?: Multi;
    duration?: number;
  }): Promise<Multi extends true ? {
    result: number[];
    items: string[];
  } : {
    result: number;
    items: string;
  }>;

  getAppVersion(): string;

  getUser(): {
    userId: string;
    userName: string;
    isVip: boolean;
  };

  getDeviceInfo(): {
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
    clientType: 'android' | 'pc';
  };

  getLocation(param: { timeout?: number }): object;

  getLocationAsync(param: { timeout?: number }): Promise<object>;

  setScreenBrightness(value: number): string;

  setWifiEnable(enable: boolean): void;

  setWifiEnableAsync(enable: boolean): Promise<void>;

  setBluetoothEnable(enable: boolean): void;

  setBluetoothEnableAsync(enable: boolean): Promise<void>;

  setCameraFlashEnable(enable: boolean): void;

  setCameraFlashEnableAsync(enable: boolean): Promise<void>;

  getInstalledAppInfo(): Array<{
    isSystemApp: boolean;
    packageName: string;
    versionCode: number;
    versionName: string;
    label: string;
  }>;

  getMousePosition(): {
    x: number;
    y: number;
    xInScreen: number;
    yInScreen: number;
  };

  playMedia(url: string): any;

  playMediaAsync(url: string): Promise<any>;

  vibrator(duration?: number, amplitude?: number): any;

  vibratorAsync(duration?: number, amplitude?: number): Promise<any>;

  wakeupScreen(): void;

  writeFile(filePath: string, fileContent: string | ArrayBuffer | Uint8Array): void;

  writeFileAsync(filePath: string, fileContent: string | ArrayBuffer | Uint8Array): Promise<void>;

  appendFile(filePath: string, fileContent: string | ArrayBuffer | Uint8Array): void;

  appendFileAsync(filePath: string, fileContent: string | ArrayBuffer | Uint8Array): Promise<void>;

  readFile(filePath: string, options?: {
    encode?: 'UTF-8' | 'GBK' | 'BASE64';
    returnBuffer?: boolean;
  }): string | ArrayBuffer;

  readFileAsync(filePath: string, options?: {
    encode?: 'UTF-8' | 'GBK' | 'BASE64';
    returnBuffer?: boolean;
  }): Promise<string | ArrayBuffer>;

  getScreenColor(x: number | string, y: number | string, ignoreCache?: boolean): number;

  getScreenColorAsync(x: number | string, y: number | string, ignoreCache?: boolean): Promise<number>;

  getScreenAreaColors(param: {
    x: number | string;
    y: number | string;
    width: number | string;
    height: number | string;
    ignoreCache?: boolean;
    sampleSize?: number;
  }): {
    data: number[];
    x: number;
    y: number;
    width: number;
    height: number;
  };

  getScreenAreaColorsAsync(param: {
    x: number | string;
    y: number | string;
    width: number | string;
    height: number | string;
    ignoreCache?: boolean;
    sampleSize?: number;
  }): Promise<{
    data: number[];
    x: number;
    y: number;
    width: number;
    height: number;
  }>;

  click(x: number | string, y: number | string, duration?: number): void;

  clickAsync(x: number | string, y: number | string, duration?: number): Promise<void>;

  longClick(x: number | string, y: number | string): void;

  longClickAsync(x: number | string, y: number | string): Promise<void>;

  press(x: number | string, y: number | string, duration?: number): void;

  pressAsync(x: number | string, y: number | string, duration?: number): Promise<void>;

  swipe(x1: number | string, y1: number | string, x2: number | string, y2: number | string, duration?: number): void;

  swipeAsync(x1: number | string, y1: number | string, x2: number | string, y2: number | string, duration?: number): Promise<void>;

  gesture(duration: number, ...xyArray: Array<[number | string, number | string]>): void;

  gestureAsync(duration: number, ...xyArray: Array<[number | string, number | string]>): Promise<void>;

  gestures(...gestureConfigs: Array<[number, ...Array<[number | string, number | string]>] | [number, number, ...Array<[number | string, number | string]>]>): void;

  gesturesAsync(...gestureConfigs: Array<[number, ...Array<[number | string, number | string]>] | [number, number, ...Array<[number | string, number | string]>]>): Promise<void>;

  getClipboard(): string;

  setClipboard(text: string): void;

  getVar(varName: string, scope?: 'global' | string): any;

  setVar(varName: string, varValue: any, scope?: 'global' | string): void;

  deleteVar(varName: string, scope?: 'global' | string): void;

  deleteVarWithConfirm(varName: string, scope?: 'global' | string): void;

  getVars(scope?: 'global' | string): any;

  printVars(): Promise<void>;

  clearVars(scopeId?: string): void;

  clearVarsWithConfirm(scope: string): void;

  getStorage(storageKey: string, scope?: string): any;

  setStorage(storageKey: string, content: any, scope?: string): void;

  removeStorage(storageKey: string, scope?: string): void;

  requestUrl(config: RequestUrlConfig): {
    code: number;
    body: string;
    headers: Record<string, string | string[]>;
  };

  requestUrlAsync(config: RequestUrlConfig): Promise<{
    code: number;
    body: string;
    headers: Record<string, string | string[]>;
  }>;

  ocr(param: {
    mode?: 'local' | 'online';
    base64: string;
    resultType?: 'text' | 'raw';
  }): string | Array<rawItem>;

  ocrAsync(param: {
    mode?: 'local' | 'online';
    base64: string;
    resultType?: 'text' | 'raw';
  }): Promise<string | Array<rawItem>>;

  runAction(actionJSON: object): void;

  runActionAsync(actionJSON: object): Promise<void>;

  check(conditionJSON: object): boolean;

  checkAsync(conditionJSON: object): Promise<boolean>;

  findNode<FindAll extends boolean>(posData: findNode, config: {
    findAll?: FindAll;
    withChildren?: boolean;
  }): FindAll extends true ? FindNodeResult[] : FindNodeResult;

  findNodeAsync<FindAll extends boolean>(posData: findNode, config: {
    findAll?: FindAll;
    withChildren?: boolean;
  }): Promise<FindAll extends true ? FindNodeResult[] : FindNodeResult>;

  findLocation<FindAll extends boolean>(posData: PositionFind, findAll?: FindAll): FindAll extends true ? LocationResult[] : LocationResult;

  findLocationAsync<FindAll extends boolean>(posData: PositionFind, findAll?: FindAll): Promise<FindAll extends true ? LocationResult[] : LocationResult>;

  recognitionScreen(config: recognitionScreenTextConfig): string | Array<textRawItem>;

  recognitionScreen(config: recognitionScreenCaptchaConfig): string;

  recognitionScreen(config: recognitionScreenImageDataConfig): imageForRecognition;

  recognitionScreen(config: recognitionScreenHumanConfig): imageForRecognition;

  recognitionScreenAsync(config: recognitionScreenTextConfig): Promise<string | Array<textRawItem>>;

  recognitionScreenAsync(config: recognitionScreenCaptchaConfig): Promise<string>;

  recognitionScreenAsync(config: recognitionScreenImageDataConfig): Promise<imageForRecognition>;

  recognitionScreenAsync(config: recognitionScreenHumanConfig): Promise<imageForRecognition>;
}

declare const zdjl: zdjl;
