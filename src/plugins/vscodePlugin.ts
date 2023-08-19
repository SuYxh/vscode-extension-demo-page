import { App } from 'vue';

type Callback = (params?: any) => void;
type CallbackWithReturnValue = (params?: any) => any;

interface CallbacksType {
  [key: string]: Callback | CallbackWithReturnValue;
}

interface VscodePluginOptions {
  rootAppName?: string;
}

interface MessageType {
  from: 'vscode' | 'other' | 'chat-gpt-web'
  msgId: string
  method: string
  data: any
}

class VscodePlugin {
  private static instance: VscodePlugin;
  // 保存的需要监听的事件
  private listeners: Array<{ callback: Function, listener: EventListener }>;
  // 保存的会回调函数
  private callbacks: CallbacksType;
  // window 上 acquireVsCodeApi 方法的返回值
  private vscode: any;

  constructor() {
    this.listeners = [];
    this.callbacks = {}
    this.vscode = window.acquireVsCodeApi ? window.acquireVsCodeApi() : null;

    // 开始监听
    this.startVscodeListener()
  }

  /**
   * @description: 获取实例
   * @return {*}
   */  
  public static getInstance(): VscodePlugin {
    if (!VscodePlugin.instance) {
      VscodePlugin.instance = new VscodePlugin();
    }
    return VscodePlugin.instance;
  }

  /**
   * @description: 添加事件监听
   * @param {function} callback 事件监听处理函数
   * @return {*}
   */  
  addListener(callback: (data: any) => void): void {
    const listener: EventListener = (event: Event): void => {
      // @ts-ignore
      if (event.origin !== window.location.origin) return;
      // 这里需要绑定 this ， 否则在 handleVscodeMsg 中无法使用 this.callbacks 获取到 callbacks
      callback.call(this, event);
    };

    window.addEventListener('message', listener);
    this.listeners.push({ callback, listener });
  }

  /**
   * @description: 移除事件监听
   * @param {function} callback 事件监听处理函数
   * @return {*}
   */  
  removeListener(callback: (data: any) => void): void {
    const listenerObj = this.listeners.find(obj => obj.callback === callback);
    if (!listenerObj) return;

    window.removeEventListener('message', listenerObj.listener);
    this.listeners = this.listeners.filter(obj => obj.callback !== callback);
  }

  /**
   * @description: 根据时间戳生成 msgId
   * @return {*}
   */  
  genMsgId() {
    return  Date.now() + '' + Math.round(Math.random() * 100000);
  }

  /**
   * @description: 将页面的方法添加到 callbacks 中。 使用场景： vscode插件主动调用 webview 页面上的方法
   * @param {string} method
   * @param {Callback} fn
   * @return {*}
   */  
  addVscodeCb(method: string, fn: Callback | CallbackWithReturnValue) {
    this.callbacks[method] = fn
  }

  /**
   * @description: 向 vscode 插件发送消息
   * @param {string} method  需要调用 vscode 插件的方法名
   * @param {any} data 如果不是函数，就是传递给 vscode 插件方法的参数，否则就是回调函数
   * @param {Callback} cb 回调函数
   * @return {*}
   */  
  callVscode(method: string, data?: any, cb?: Callback | CallbackWithReturnValue) {
    // 再次判断一下是否 vscode 插件的webview环境
    if (!this.vscode) {
      console.log('当前不在 vscode 的 webview 中');
      return
    }
  
    let _data = data
    let _cb = cb
  
    // data: 可能是个函数， 如果 data 是个函数，就不会有参数
    if (typeof data === 'function') {
      _cb = data
      _data = ''
    }
    
    // 获取 msgId
    const msgId = this.genMsgId()
    
    // 发送给 vscode 插件的消息
    const sendData: MessageType = {
      from: 'chat-gpt-web',
      msgId,
      method,
      data: _data
    }
    
    // 保存一下 回调函数
    if (_cb) {
       this.callbacks[msgId] = _cb;
    }

    console.log('已经保存的回调函数有: ', this.callbacks);
    console.log('webview发送给vscode的参数', sendData)
  
    if (this.vscode?.postMessage) {
      this.vscode?.postMessage(sendData);
    } else {
      console.log('vscode.postMessage is not a function');
    }
  }

  /**
   * @description: 处理来自 vscode 插件的消息
   * @param {Event} event
   * @return {*}
   */  
  handleVscodeMsg(event: Event) {
    console.log('来自 vscode 插件的消息-->event', event);
    // 监听 vscode 发来的消息， data 是约定好的数据结构
    // @ts-ignore
    const message = event.data as MessageType

    // 只处理 vscode 插件发过来的 message 消息，防止不在vscode插件的 webview 中，window 上还有 acquireVsCodeApi 方法，这种情况一般不会出现
    if (message.from === 'vscode') {
      // 根据 msgId 获取到对应的回调函数，如果存在就执行
      // msgId 和对应的回调函数会在 callVscode 方法进行保存
      // this.callbacks[message.msgId]: webview 页面 主动调用 vscode 插件的方法
      // this.callbacks[message.method]: vscode插件主动调用 webview 页面上的方法
      const cb = this.callbacks[message.msgId] || this.callbacks[message.method] 

      if (typeof cb === 'function') {
        try {
          cb(message.data)
        } catch (error) {
          console.log(`handleVscodeMsg: ${message.method} 调用失败`);
        } finally {
          delete this.callbacks[message.msgId];
        }
      } else {
        console.log(`handleVscodeMsg: ${message.msgId} 对应的回调函数不存在`);
        console.log('callbacks 列表', this.callbacks);
      }
    }
  }

  /**
   * @description: 开启对 vscode 的消息监听
   * @return {*}
   */  
  startVscodeListener() {
    if (!this.vscode) {
      console.log('只在 vscode插件的 webview 环境进行来自插件的 message 消息监听');
      return
    }
    console.log('开始监听 vscode 插件发送的 message 消息');
    this.addListener(this.handleVscodeMsg)
  }

  /**
   * @description: 结束对 vscode 的消息监听
   * @return {*}
   */  
  endVscodeListener() {
    console.log('卸载对 vscode 插件 message 消息的监听');
    this.removeListener(this.handleVscodeMsg)
  }

  /**
   * @description: 在 vue 实例上注册全局方法
   * @param {App} app
   * @return {*}
   */  
  provideGlobalFn(app: App) {
    // 这里需要对 this 进行绑定， 不然在组件中使用 $callVscode 调用 callVscode 方法时， callVscode 方法中拿到的 this 为 undefined
    // 适配 options 写法
    app.config.globalProperties.$callVscode = this.callVscode.bind(this)
    app.config.globalProperties.$endVscodeListener = this.endVscodeListener.bind(this)
    app.config.globalProperties.$addVscodeCb = this.addVscodeCb.bind(this)
    // 适配 Composition API 写法
    app.provide('$callVscode', app.config.globalProperties.$callVscode)
    app.provide('$endVscodeListener', app.config.globalProperties.$endVscodeListener)
    app.provide('$addVscodeCb', app.config.globalProperties.$addVscodeCb)
  }

  /**
   * @description: vue 插件要求的 install 方法
   * @param {App} app app 实例
   * @param {VscodePluginOptions} options 插件的配置
   * @return {*}
   */  
  install(app: App, options: VscodePluginOptions) {
    // rootAppName 默认为 'App'
    const { rootAppName = 'App' } = options

    // 缓存一下 this
    const _this = this

    // 在 beforeUnmount 周期中自动取消监听，前提： 需要设置 App 组件的 name 属性为 App 或者 传入 App 组件的 name 属性
    app.mixin({
      mounted(){
        console.log('mounted', this.$options.name);
        // App组件挂载的时候发送消息 mounted
        if (this.$options.name === rootAppName) {
          _this.callVscode('mounted')
        }
      },
      beforeUnmount() {
        // 只有在 App 组件销毁的时，才取消对vscode插件的消息监听
        if (this.$options.name === rootAppName) {
          _this.endVscodeListener()
        }
      }
    })

    // 设置全局方法
    this.provideGlobalFn(app)
  }
}


export default VscodePlugin.getInstance()

/**
 * 插件功能，封装和 vscode 插件 webview 的通信，只要使用挂载在全局的 $callVscode 方法就可以调用到 vscode 插件的能力
 * 
 * 1、采用单例进行封装，避免 use 多次，多次监听 message 消息
 * 2、自动取消监听
 *    - 配置 App.vue 组件的 name 属性为 'App'， 或者通过在使用插件的时候传入 App.vue 组件的 name 属性
 * 3、手动取消监听
 *    - 在 App.vue 组件中的 onUnmounted周期中调用全局方法 $endVscodeListener 进行取消监听
 *
 */ 
