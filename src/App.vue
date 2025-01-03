<template>
  <n-config-provider :theme="isDark ? darkTheme : null">
    <n-message-provider>
      <div class="app-container" :class="{ 'dark': isDark }">
        <nav class="app-header">
          <div class="header-content">
            <div class="logo">
              <h1>Focus Flow</h1>
            </div>
            <div class="header-actions">
              <n-menu
                v-model:value="currentRoute"
                mode="horizontal"
                :options="menuOptions"
              />
              <div class="action-buttons">
                <n-tooltip trigger="hover">
                  <template #trigger>
                    <n-button quaternary circle @click="isDark = !isDark">
                      <template #icon>
                        <n-icon>
                          <component :is="isDark ? SunnyOutline : MoonOutline" />
                        </n-icon>
                      </template>
                    </n-button>
                  </template>
                  {{ isDark ? '切换亮色模式' : '切换暗色模式' }}
                </n-tooltip>
              </div>
            </div>
          </div>
        </nav>
        <main class="app-main">
          <component :is="currentComponent" />
        </main>
      </div>
    </n-message-provider>
  </n-config-provider>
</template>

<script setup>
import { ref, computed, h } from 'vue'
import { darkTheme } from 'naive-ui'
import TodoList from './components/TodoList.vue'
import PomodoroStats from './components/PomodoroStats.vue'
import TagsManager from './components/TagsManager.vue'
import AboutPage from './components/AboutPage.vue'
import { useStorage } from '@vueuse/core'
import { NConfigProvider, NMessageProvider, NButton, NIcon, NMenu, NTooltip } from 'naive-ui'
import { 
  SunnyOutline, 
  MoonOutline,
  ListOutline,
  StatsChartOutline,
  PricetagsOutline,
  InformationCircleOutline
} from '@vicons/ionicons5'

const isDark = useStorage('todo-dark-mode', false)
const currentRoute = ref('todo')

const menuOptions = [
  {
    label: '待办事项',
    key: 'todo',
    icon: renderIcon(ListOutline)
  },
  {
    label: '番茄统计',
    key: 'stats',
    icon: renderIcon(StatsChartOutline)
  },
  {
    label: '标签管理',
    key: 'tags',
    icon: renderIcon(PricetagsOutline)
  },
  {
    label: '关于我们',
    key: 'about',
    icon: renderIcon(InformationCircleOutline)
  }
]

function renderIcon(icon) {
  return () => h(NIcon, null, { default: () => h(icon) })
}

const currentComponent = computed(() => {
  switch (currentRoute.value) {
    case 'stats':
      return PomodoroStats
    case 'tags':
      return TagsManager
    case 'about':
      return AboutPage
    default:
      return TodoList
  }
})
</script>

<style>
@import './styles/main.scss';

:root {
  --border-color: #e5e7eb;
  --bg-primary: #ffffff;
  --bg-secondary: #f9fafb;
  --text-primary: #1f2937;
  --text-secondary: #6b7280;
  --primary-color: #18a058;
  --primary-color-hover: #36ad6a;
  --danger-color: #d03050;
  --shadow-color: rgba(0, 0, 0, 0.05);
  --hover-bg: rgba(0, 0, 0, 0.04);
}

.dark {
  --border-color: #374151;
  --bg-primary: #1a1a1a;
  --bg-secondary: #141414;
  --text-primary: #f3f4f6;
  --text-secondary: #9ca3af;
  --shadow-color: rgba(0, 0, 0, 0.2);
  --hover-bg: rgba(255, 255, 255, 0.04);
  --primary-color: #36ad6a;
  --primary-color-hover: #18a058;
}

.app-container {
  min-height: 100vh;
  background: var(--bg-secondary);
  transition: all 0.3s ease;
  color: var(--text-primary);
}

.app-header {
  background: var(--bg-primary);
  box-shadow: 0 1px 3px var(--shadow-color);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  height: 64px;
  display: flex;
  align-items: center;
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 1.5rem;
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo h1 {
  font-size: 1.5rem;
  font-weight: 700;
  background: linear-gradient(45deg, var(--primary-color), var(--primary-color-hover));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin: 0;
}

.app-main {
  padding-top: 64px;
  min-height: 100vh;
}

:deep(.n-button) {
  --n-text-color: var(--text-primary);
  --n-border: 1px solid var(--border-color);
  --n-border-hover: 1px solid var(--primary-color);
  --n-border-pressed: 1px solid var(--primary-color-hover);
}

:deep(.n-input) {
  --n-border: 1px solid var(--border-color);
  --n-border-hover: 1px solid var(--primary-color);
  --n-border-focus: 1px solid var(--primary-color);
  --n-placeholder-color: var(--text-secondary);
  --n-text-color: var(--text-primary);
  --n-border-radius: 8px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.action-buttons {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-left: 0.5rem;
}

:deep(.n-menu) {
  --n-item-text-color: var(--text-primary);
  --n-item-text-color-hover: var(--primary-color);
  --n-item-text-color-active: var(--primary-color);
  --n-item-color-active: transparent;
  --n-item-color-active-hover: transparent;
  --n-item-icon-color: var(--text-secondary);
  --n-item-icon-color-hover: var(--primary-color);
  --n-item-icon-color-active: var(--primary-color);
  --n-bezier: cubic-bezier(0.4, 0, 0.2, 1);
}

:deep(.n-menu .n-menu-item) {
  margin: 0 0.25rem;
  padding: 0 1rem;
  font-size: 0.95rem;
}

:deep(.n-menu .n-menu-item-content) {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

:deep(.n-menu .n-menu-item-content__icon) {
  margin: 0;
}

@media (max-width: 640px) {
  .app-header {
    height: 56px;
  }

  .app-main {
    padding-top: 56px;
  }

  .header-content {
    padding: 0 1rem;
  }

  :deep(.n-menu .n-menu-item) {
    padding: 0 0.75rem;
    font-size: 0.9rem;
  }
}
</style> 