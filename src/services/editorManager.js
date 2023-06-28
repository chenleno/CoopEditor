import CodeMirror from 'codemirror'

import * as Y from 'yjs'
import { FrameMessageProvider } from './y-frameMessage.js'
import { CodemirrorBinding } from 'y-codemirror'
import { messageManagerInstance, postMessage, eventManager } from './index'
import { getUrlParams, throttle } from '@/utils/baseUtil'

import 'codemirror/addon/scroll/simplescrollbars.js';
import 'codemirror/addon/scroll/simplescrollbars.css';

// 导入语言
import 'codemirror/mode/textile/textile'

import '@/style/codemirror.css'
import '@/style/monokai.css'
import '@/style/index.css'

// 可选语言对应编辑器mode
const LANG_MODE = {
  'Textile': 'textile',
  'C': 'text/x-csrc',
  'C++': 'text/x-c++src',
  'CSS': 'css',
  'Go': 'go',
  'HTML': 'htmlmixed', 
  'Java': 'text/x-java', 
  'Javascript': 'javascript', 
  'Markdown': 'markdown', 
  'Pascal': 'pascal', 
  'Perl': 'perl', 
  'PHP': 'php', 
  'Python': 'python', 
  'R': 'r', 
  'Ruby': 'ruby', 
  'Rust': 'rust', 
  'SQL': 'sql', 
  'Swift': 'swift'
}

// 可选语言对应的资源文件路径，采用动态导入的方式
const LANG_FILE_NAME = {
  'Textile': 'textile',
  'C': 'clike',
  'C++': 'clike',
  'CSS': 'css',
  'Go': 'go',
  'HTML': 'htmlmixed',
  'Java': 'clike',
  'Javascript': 'javascript',
  'Markdown': 'markdown',
  'Pascal': 'pascal',
  'Perl': 'perl',
  'PHP': 'php',
  'Python': 'python',
  'R': 'r',
  'Ruby': 'ruby',
  'Rust': 'rust',
  'SQL': 'sql',
  'Swift': 'swift'
}

const SCROLL_ER_VALUE = 18 // 滚动边界条件误差值
const SCROLL_LIMIT_VALUE = 100 // 滚动极限标识值

class editorManager {
  constructor() {
    this.urlParams = getUrlParams(window.location.href)
    this.editor = null // 编辑器实例
    this.provider = null // y-frameMessage 实例
    this.disableScrollLayer = null // 禁止滚动蒙层dom元素，通过该元素的显隐控制滚动禁用与否
    this.syncScroll = true // 同步滚动
    this.canDraw = false // 可编辑
    this.canScroll = false // 可滚动
    this.cacheData = [] // 缓存的frameMessage消息数组
    this.cacheDataTimer = null // 缓存消息发送标识
    this.setUp()
  }

  get clientWidth() {
    return document.body.clientWidth
  }

  get clientHeight() {
    return document.body.clientHeight
  }

  setUp = () => {
    eventManager.register({ clientType: this.urlParams.clientType });
    messageManagerInstance.init({ clientType: this.urlParams.clientType })
    this.initEditor()
    this.registEditorEventListener()
    this.registMessageListener()
    this.registDisableScrollLayerListener()
    postMessage('CoopEditor_ready')
  }

  // 接管 frameMessage 消息更新
  frameMessagePostMessage = data => {
    this.cacheData.push(data)
    if (this.cacheDataTimer) return
    this.cacheDataTimer = setTimeout(() => {
      postMessage('CoopEditor_update_message', this.cacheData )
      this.cacheDataTimer = null
      this.cacheData = []
      clearTimeout(this.cacheDataTimer)
    }, 500)
  }

  // 编辑器初始化
  initEditor = () => {
    const { userId, userName, serial, cursor, color = '', role } = this.urlParams
    if (Number(role) === 0) { 
      this.canDraw = true
      this.canScroll = true
    }
    const name = decodeURIComponent(userName)
    const ydoc = new Y.Doc()
    // ydoc.clientID = userId
    const provider = new FrameMessageProvider(serial, ydoc, { postMessage: this.frameMessagePostMessage })  
    const ytext = ydoc.getText('codemirror')
    const editorContainer = document.getElementById('codemirror_container')
    const editor = CodeMirror(editorContainer, {
      lineNumbers: true,
      theme: 'monokai',
      mode: 'textile',
      readOnly: this.canDraw ? '' : 'nocursor',
      scrollbarStyle: 'overlay'
    })
    const binding = new CodemirrorBinding(ytext, editor, provider.awareness)
    provider.awareness.setLocalStateField('user', {
      name: name, 
      // color: color || 'rgba(57,151,248,1)'
    })
    if (cursor === 'false') {
      editorContainer.classList.add('noCursor')
    }
    this.editor = editor
    this.provider = provider

    window.example = { editor: this.editor }
  }

  // 注册编辑器事件监听
  registEditorEventListener = () => {
    const scrollElement = this.editor.getScrollerElement();
    scrollElement.addEventListener('scroll', this.handleEditorScroll)
  }

  // 处理编辑器滚动事件
  handleEditorScroll = e => {
    // 未开启同步滚动，或无可画权限，不发滚动同步消息
    if (!this.syncScroll || !this.canDraw) return
    const { left, top, width, height, clientWidth, clientHeight } = this.editor.getScrollInfo()
    const target = e.currentTarget
    // 滚动消息格式为：当前滚动px / 容器宽|高 的比例
    let sendData = { left: (left/width), top: (top/height) }
    const scrollYErValue = target.scrollHeight - target.scrollTop - target.offsetHeight // Y 轴滚动边界值
    const scrollXErValue = target.scrollWidth - target.scrollLeft - target.offsetWidth // X 轴滚动边界值
    // 滚动x,y轴边界条件值处理：误差值在+-18px之间，都认为滚动到底
    if (target.scrollTop && (scrollYErValue >= -18) && (scrollYErValue <= 18)) {
      sendData = { ...sendData, top: 100 }
    }
    if (target.scrollLeft && (scrollXErValue >= -18) && (scrollXErValue <= 18)) {
      sendData = { ...sendData, left: 100 }
    }
    this.sendEditorScrollDataThrottled(sendData)
  }

  // 注销编辑器事件监听
  removeEditorEventListener = () => {
    const scrollElement = this.editor.getScrollerElement();
    scrollElement.removeEventListener('scroll', this.handleEditorScroll)
  }

  // 发送编辑器滚动数据
  sendEditorScrollData = data => postMessage('CoopEditor_update_scroll', data)
  sendEditorScrollDataThrottled = throttle(this.sendEditorScrollData, 500)

  // 注册上层消息监听
  registMessageListener = () => {
    eventManager.on('CoopEditor_message', this.provider.onMessage.bind(this.provider))
    eventManager.on('CoopEditor_scroll', this.handleEditorSyncScroll)
    eventManager.on('CoopEditor_canDraw', this.handleEditorCandraw)
    eventManager.on('CoopEditor_noSyncScroll', this.handleEditorNoSyncScroll)
    eventManager.on('CoopEditor_changeLang', this.handleEditorChangeLang)
    eventManager.on('CoopEditor_save', this.handleEditorSave)
  }
  // 处理同步滚动数据
  handleEditorSyncScroll = data => {
    const { left, top } = data
    const { width, height, clientWidth, clientHeight } = this.editor.getScrollInfo()
    // 实际应用滚动数据：收到的比例 * 内容宽|高
    // X轴滚动增加滚动到底判断，当left==100时,认为该条滚动消息是到底消息，单独计算长度
    const scrollToLeft = left === 100 ? (width - clientWidth) : parseInt(width*left)
    // Y轴滚动增加滚动到底判断，当top==100时，认为该条滚动消息是到底消息, 单独计算长度
    const scrollToTop = top === 100 ? (height - clientHeight) : parseInt(height*top)
    // 为了避免滚动死循环，在执行同步滚动消息前先注销滚动事件监听，执行完滚动后再重新注册
    this.removeEditorEventListener()
    this.editor.scrollTo(scrollToLeft, scrollToTop)
    setTimeout(() => {
      this.registEditorEventListener()
    }, 20)
  }
  // 处理编辑权限
  handleEditorCandraw = isCanDraw => {
    this.canDraw = isCanDraw
    this.editor.setOption('readOnly', isCanDraw ? '' : 'nocursor') 
    this.checkScroll(isCanDraw || this.canScroll)
  }
  // 处理能否同步滚动
  handleEditorNoSyncScroll = noSyncScroll => {
    this.syncScroll = !noSyncScroll
    // 老师点击开启同步滚动时，需要将所有人的滚动状态与老师保持一致
    if (this.syncScroll && Number(this.urlParams.role) === 0) {
      const { left, top, width, height, clientWidth, clientHeight } = this.editor.getScrollInfo()
      const sendData = { left: (left/width), top: (top/height) }
      this.sendEditorScrollData(sendData)
    }
    this.checkScroll(noSyncScroll || this.canDraw)
  }
  // 处理保存消息
  handleEditorSave = () => {
    const editorValue = this.editor.getValue()
    postMessage('CoopEditor_result', editorValue)
  }

  // 注册禁止滚动蒙层事件
  registDisableScrollLayerListener = () => {
    this.disableScrollLayer = document.getElementById('disable_scroll_layer')
    this.disableScrollLayer.addEventListener('wheel', e => e.preventDefault(), false)
    this.disableScrollLayer.addEventListener('touchstart', e => e.preventDefault(), false)
    this.checkScroll(this.canScroll)
  }
  // 检查能否滚动
  checkScroll = canScroll => {
    this.canScroll = canScroll
    if (canScroll) {
      this.disableScrollLayer.classList.remove('show')
    } else {
      this.disableScrollLayer.classList.add('show')
    }
  }
  // 处理语言切换
  handleEditorChangeLang = async data => {
    const fileName = LANG_FILE_NAME[data]
    // webpack 打包注解，勿删
    await import(
        /* webpackInclude: /(textile|clike|css|go|htmlmixed|javascript|markdown|pascal|perl|php|python|r|ruby|rust|sql|swift)\.js$/ */
        /* webpackChunkName: 'lang' */
        /* webpackMode: "lazy" */
        /* webpackPrefetch: true */
        /* webpackPreload: true */
        `codemirror/mode/${fileName}/${fileName}`
    )
    this.editor.setOption('mode', LANG_MODE[data])
  }
}

export default editorManager
