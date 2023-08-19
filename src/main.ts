import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import vscodePlugin from './plugins/vscodePlugin';

const app = createApp(App)
app.use(vscodePlugin, { rootAppName: 'App' })

app.mount('#app')
