import { MessageType } from '../type/';

const vscode = window.acquireVsCodeApi ? window.acquireVsCodeApi() : {};
// console.log('plugins-vscode-window', window);
// console.log('plugins-vscode-window-vscode', vscode);
const callbacks: any = {};

export function callVscode(method: string, data?: any, cb?: Function) {

  if (!vscode) {
    console.log('当前不在 vscode 的 webview 中');
    return
  }

  let _data = data
  let _cb = cb

  // data: 可能是个函数
  if (typeof data === 'function') {
    _cb = data
    _data = ''
  }

  const msgId = Date.now() + '' + Math.round(Math.random() * 100000);

  const sendData: MessageType = {
    from: 'chat-gpt-web',
    msgId,
    method,
    data: _data
  }

  if (_cb) {
      callbacks[msgId] = _cb;
  }
  console.log('webview 发送给 vscode 的参数', sendData)

  if (vscode?.postMessage) {
    vscode?.postMessage(sendData);
  } else {
    console.log('vscode.postMessage is not a function');
  }
}

export function handleVscodeMsg(msg: MessageType) {
  console.log('handleVscodeMsg-->msg', msg);
  // console.log('handleVscodeMsg-->callbacks', callbacks);
  const cb = callbacks[msg.msgId]
  // console.log('handleVscodeMsg-->cb', cb, typeof cb);

  if (typeof cb === 'function') {
    try {
      cb(msg.data)
    } catch (error) {
      console.log(`handleVscodeMsg: ${msg.method} 调用失败`);
    } finally {
      delete callbacks[msg.msgId];
    }
  }
}