<script lang="ts">
export default { name: 'Text' }
</script>

<script setup lang="ts">
import { ref } from 'vue'

const show = ref(true)

const xiezai = () => {
  show.value = false
}

</script>
<template>
  <div v-if="show">
    <h1 @click="xiezai"> Text </h1>
  </div>
</template>

<style scoped>
.read-the-docs {
  color: #888;
}
</style>
