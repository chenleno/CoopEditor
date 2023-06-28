# 同步协作编辑器说明文档
## 1. 实现说明
基于`yjs`的`y-codemirroe`和自定义的`y-frameMessage`实现文档协作和消息通讯。
多终端可以通过 `webview/iframe` 等方式嵌套加载实现通讯。

## 2. 访问参数
各端访问编辑器时，需要在链接上拼接相关参数
- clientType: web | app (必传)
- role: 身份（必传）（0: 主编辑, 2：副编辑 ）
- userName: 用户名（必传）（需要urlEncode） 
- userId: 用户id（必传）
- serial: 编辑器代号（必传）
- cursor: true/false, 光标处显示用户名（必传）
- color: '#123456', 光标用户名背景色

## 3. 通讯
编辑器本身仅提供编辑功能，各端需要将收到的编辑器消息转发到信令，或将收到的信令消息转发至编辑器。
### 通讯方法
- web to editor
  + iframe postmessage
- native to editor
  + window.nativeToCoopEditorAction
- editor to native
  + android: window.JSWhitePadInterface.coopEditorAction
  + ios: window.webkit.messageHandlers.coopEditorAction.postMessage
### 消息格式
数据格式均为JSON String,不同type下data数据不同
```js
  var message = {
    type: 'CoopEditor_message',
    data
  }
  var JSONData = JSON.stringify(message)
  postmessage(JSONData)
```

### 消息类型
1. webview / frame 消息 
- 编辑器向上层通讯
  + CoopEditor_ready (编辑器初始化完成)
  + CoopEditor_update_message （编辑器内容更新消息）
  ```js
    data = [...]
  ```
  + CoopEditor_update_scroll (编辑器滚动消息)
  ```js
    data = { left, top }
  ```
  + CoopEditor_result (收到 `CoopEditor_save`时发送，返回当前编辑器内容string，用以保存成文件)
  ```js
    data = '...' // string
  ```
- 上层向编辑器通讯
  + CoopEditor_message（编辑器内容更新消息）
  ```js
    data = [...]
  ```
  + CoopEditor_scroll (编辑器滚动消息)
  ```js
    data = { left, top }
  ```
  + CoopEditor_save (保存成文件时发送)
  + CoopEditor_changeLang (切换编程语言)
  ```js
    data = 'javascript'
  ```
  + CoopEditor_noSyncScroll (禁用/启用 同步滚动)
  ```js
    data = true || false
  ```
  + CoopEditor_canDraw (启用/禁用 编辑)
  ```js
    data = true || false
  ```

## 4. 其他内容
### 可选语言
```js
const LANG_LIST = ['Textile', 'C', 'C++', 'CSS', 'Go', 'HTML', 'Java', 'Javascript', 'Markdown', 'Pascal', 'Perl', 'PHP', 'Python', 'R', 'Ruby', 'Rust', 'SQL', 'Swift']
```

## 5. 依赖项
- `yjs`
- `codemirror`
- `y-codemirror`
- `y-frameMessage`

## 6. 命令
> 启动
```js
  npm run start
```
> 打包
```js
  npm run build
```
### 参考资料
- [yjs](https://docs.yjs.dev/) 英文文档
- [yjs](http://www.febeacon.com/yjs-docs-zh-cn/routes/) 中文文档
- [y-codemirror](https://github.com/yjs/y-codemirror/)
- [y-websocket](https://docs.yjs.dev/ecosystem/connection-provider/y-websocket)