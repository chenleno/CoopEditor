import { isAndroid, isIOS } from '@/utils/baseUtil';

class messageManager {
  constructor() {
    this.instance = null;
    this.clientType = null;
  }
  static getInstance() {
    if (!this.instance) {
      this.instance = new messageManager();
    }
    return this.instance;
  }

  init(props) {
    if (!props) return;
    const { clientType } = props;
    this.clientType = clientType;
  }

  postMessage(type, data) {
    if (this.clientType === 'app') {
      if (isAndroid) {
        return this.postMessageAndroid(type, data);
      } else {
        return this.postMessageIOS(type, data);
      }
    } else {
      return this.postMessageWeb(type, data);
    }
  }

  postMessageAndroid(type, data) {
    if (!window.JSWhitePadInterface) {
      console.error('window.JSWhitePadInterface is not exit!');
      return;
    }
    let sendData = { type };
    if (data) sendData = { ...sendData, data };
    return window.JSWhitePadInterface.coopEditorAction(JSON.stringify(sendData));
  }

  postMessageIOS(type, data) {
    if (!window.webkit || !window.webkit.messageHandlers) {
      console.error('window.webkit | window.webkit.messageHandlers is not exit!')
      return;
    }
    if (window.webkit.messageHandlers.coopEditorAction) {
      let sendData = { type };
      if (data) sendData = { ...sendData, data };
      return window.webkit.messageHandlers.coopEditorAction.postMessage({
        data: JSON.stringify(sendData),
      });
    }
  }

  postMessageWeb(type, data) {
    if (!window || !window.parent) {
      console.error('window is not exit!');
      return;
    }
    let sendData = { type };
    if (data) sendData = { ...sendData, data };
    return window.parent.postMessage(JSON.stringify(sendData), '*');
  }
}

const messageManagerInstance = messageManager.getInstance();
const postMessage = messageManagerInstance.postMessage.bind(messageManagerInstance);

export { messageManagerInstance, postMessage };
