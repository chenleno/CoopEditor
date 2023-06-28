/**
 * @description 事件注册订阅派发
 */
 class EventManager {
  constructor() {
    this.listeners = {};
    this.instance = null;
  }

  static getInstance() {
    if (!this.instance) {
      this.instance = new EventManager();
    }
    return this.instance;
  }

  register(props) {
    if (!window) return;
    const { clientType } = props;
    if (!clientType) return;
    if (clientType === 'app') {
      window.nativeToCoopEditorAction = data => {
        const messageData = typeof data === 'string' ? JSON.parse(data) : data;
        this.emit(messageData.type, messageData.data);
      };
    } else {
      window.addEventListener('message', data => {
        const messageData = (typeof data.data === 'string' && data.data !== 'undefined') ? JSON.parse(data.data) : data.data;
        this.emit(messageData.type, messageData.data);
      });
    }
  }

  on(eventType, fn) {
    if (eventType == null || typeof eventType !== 'string') return;
    if (this.listeners[eventType] === undefined) this.listeners[eventType] = {};
    this.listeners[eventType][fn] = fn;
  }

  off(eventType, fn) {
    if (eventType == null || typeof eventType !== 'string') return;
    const fnHash = this.listeners[eventType];
    if (fnHash) delete fnHash[fn];
  }

  emit(eventType, ...params) {
    if (eventType == null || typeof eventType !== 'string') return;
    const fnHash = this.listeners[eventType];
    if (fnHash) Object.values(fnHash).forEach((fn) => fn(...params));
  }
}

export default EventManager.getInstance();
