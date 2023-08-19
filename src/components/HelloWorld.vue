<script setup lang="ts">
import { ref, inject } from 'vue'

defineProps<{ msg: string }>()

const projectName = ref('getProjectName')
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

const handleVscodeTest = (res: any) => {
  console.log('处理来自 vscode 的 test 事件', res);
  text.value = res
}

$addVscodeCb('test', handleVscodeTest)

</script>

<template>
  <h1>{{ msg }}</h1>

  <div class="card">
    <button type="button" @click="sendMsgToVscode">{{ projectName || '获取失败' }}</button>
    <br>
    <br>
    <button type="button" @click="showVscodeInfo">showVscodeInfo</button>
    <br>
    <div v-if="text">
      <div>
        当前选中的代码是：
      </div>
      <div>
        <pre>
          {{ text }}
        </pre>
      </div>
    </div>
  </div>
</template>

<style scoped>
.read-the-docs {
  color: #888;
}
</style>
