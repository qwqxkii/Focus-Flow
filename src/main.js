import { createApp } from 'vue'
import App from './App.vue'
import { useMessage } from 'naive-ui'
import {
  create,
  NConfigProvider,
  NButton,
  NInput,
  NIcon,
  NSwitch,
  NProgress,
  NEmpty,
  NRadioGroup,
  NRadioButton,
  NSelect,
  NTag,
  NModal,
  NForm,
  NFormItem,
  NInputNumber,
  NDivider,
  NButtonGroup,
  NUpload,
  NInputGroup,
  NPopconfirm,
  NCollapseTransition
} from 'naive-ui'

// 处理 DevTools 错误
window.addEventListener('error', (event) => {
  if (event.message.includes('runtime.lastError')) {
    event.stopPropagation()
    event.preventDefault()
  }
})

// 全局错误处理
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason)
  event.preventDefault()
})

window.onerror = function(message, source, lineno, colno, error) {
  console.error('Global error:', {
    message,
    source,
    lineno,
    colno,
    error
  })
  return false
}

const naive = create({
  components: [
    NConfigProvider,
    NButton,
    NInput,
    NIcon,
    NSwitch,
    NProgress,
    NEmpty,
    NRadioGroup,
    NRadioButton,
    NSelect,
    NTag,
    NModal,
    NForm,
    NFormItem,
    NInputNumber,
    NDivider,
    NButtonGroup,
    NUpload,
    NInputGroup,
    NPopconfirm,
    NCollapseTransition
  ]
})

const app = createApp(App)

// Vue 错误处理
app.config.errorHandler = (err, instance, info) => {
  console.error('Vue error:', err)
  console.error('Error info:', info)
}

app.config.warnHandler = (msg, instance, trace) => {
  console.warn('Vue warning:', msg)
  console.warn('Warning trace:', trace)
}

app.use(naive)
app.mount('#app') 