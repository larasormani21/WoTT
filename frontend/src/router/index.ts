import { createRouter, createWebHistory } from 'vue-router'
import EditorView from '../views/EditorView.vue'
import TestSuiteView from '../views/TestSuiteView.vue'

const routes = [
  {
    path: '/',
    redirect: '/td-editor'
  },
  {
    path: '/td-editor',
    component: EditorView
  },
  {
    path: '/test-suite',
    component: TestSuiteView
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router