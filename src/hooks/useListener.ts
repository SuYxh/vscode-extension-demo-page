import { onUnmounted } from 'vue';
import { MessageType } from '../type';
import { handleVscodeMsg } from '../plugins/vscode';

function useListener() {

  // 处理监听消息
  function handleMessage(event: any) {
    console.log('vue-useListener 收到消息-1', event);
    const message = event.data as MessageType

    // 监听 vscode 发来的消息
    if (window.acquireVsCodeApi && message.from === 'vscode') {
      handleVscodeMsg(message)
    }
    // 监听其他平台发来的消息
  }

  // 开始监听
  window.addEventListener('message', handleMessage);

  // 卸载监听
  onUnmounted(() => {
    window.removeEventListener('message', handleMessage)
  })
}

export default useListener