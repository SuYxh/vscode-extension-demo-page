<script setup lang="ts">
import { ref, inject, getCurrentInstance } from 'vue'
// import { callVscode } from '../plugins/vscode';

defineProps<{ msg: string }>()

const instance = getCurrentInstance() as any

const count = ref(0)
const projectName = ref('hello')
const text = ref('')

const $callVscode = inject('$callVscode') as Function
const $addVscodeCb = inject('$addVscodeCb') as Function

const sendMsgToVscode = () => {
  console.log('sendMsgToVscode');
  $callVscode('getProjectName', (res: any) => {
    console.log('sendMsgToVscode--res', res);
    projectName.value = res.data ?? '获取getProjectName失败'
  })
}

const showVscodeInfo = () => {
  console.log('showVscodeInfo');
  $callVscode('showInfo', 'hello from webview')
}

const xiezai = () => {
  // 手动卸载 Vue 应用
  instance.appContext.app.unmount();
}

const handleVscodeTest = (res: any) => {
  console.log('处理来自 vscode 的 test 事件', res);
  text.value = res
}

$addVscodeCb('test', handleVscodeTest)

</script>

<template>
  <h1>{{ msg }}</h1>
  <h1>{{ projectName }}</h1>

  <div class="card">
    <button type="button" @click="count++">count is {{ count }}</button>
    <br>
    <br>
    <button type="button" @click="sendMsgToVscode">getProjectName</button>
    <br>
    <br>
    <button type="button" @click="showVscodeInfo">showVscodeInfo</button>
    <button type="button" @click="xiezai">xiezai</button>

    <div v-if="text">
      当前选中的代码是：{{ text }}
    </div>
  </div>
</template>

<style scoped>
.read-the-docs {
  color: #888;
}
</style>
