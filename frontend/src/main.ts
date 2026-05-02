import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'

self.MonacoEnvironment = {
  getWorker() {
    return new editorWorker()
  },
}

import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'

createApp(App)
  .use(router)
  .mount('#app')