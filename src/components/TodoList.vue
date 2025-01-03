<template>
  <div class="todo-container">
    <div class="main-layout">
      <div class="content-section">
        <div class="tasks-section">
          <div class="section-header">
            <h2>待办事项</h2>
            <div class="header-actions">
              <n-button
                text
                type="primary"
                @click="exportTodos"
              >
                <template #icon>
                  <n-icon><CloudDownloadOutline /></n-icon>
                </template>
                导出
              </n-button>
              <n-upload
                :show-file-list="false"
                accept=".json"
                @change="handleImport"
              >
                <n-button text type="primary">
                  <template #icon>
                    <n-icon><CloudUploadOutline /></n-icon>
                  </template>
                  导入
                </n-button>
              </n-upload>
              <todo-filter
                :todos="todos"
                :current-filter="currentFilter"
                @filter="updateFilter"
              />
            </div>
          </div>

          <todo-input @add="addTodo" />

          <div class="progress-bar" v-if="todos.length > 0">
            <div class="progress-info">
              <div class="progress-stats">
                <span class="stat-item">
                  <span class="value">{{ completedTodos.length }}/{{ todos.length }}</span>
                  <span class="label">已完成</span>
                </span>
                <span class="stat-item">
                  <span class="label">完成率</span>
                  <span class="value highlight">{{ completionRate }}%</span>
                </span>
              </div>
            </div>
            <n-progress
              type="line"
              :percentage="completionRate"
              :color="getProgressColor"
              :height="6"
              :border-radius="4"
              rail-style="background-color: var(--bg-primary);"
            />
          </div>

          <div class="tasks-list">
            <draggable
              :list="displayTodos"
              :item-key="todo => todo.id"
              handle=".drag-handle"
              @change="handleDragEnd"
              :animation="200"
            >
              <template #item="{ element: todo }">
                <todo-item
                  :todo="todo"
                  @update="updateTodo"
                  @delete="deleteTodo"
                  @edit="editTodo"
                />
              </template>
            </draggable>

            <div v-if="todos.length === 0" class="empty-state">
              <n-empty description="开始添加你的第一个待办事项吧！" />
            </div>
          </div>
        </div>

        <div class="side-section">
          <pomodoro-timer />
          <daily-quote />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useStorage } from '@vueuse/core'
import { NButton, NIcon, NProgress, NEmpty, NUpload, useMessage } from 'naive-ui'
import { 
  CloudDownloadOutline,
  CloudUploadOutline
} from '@vicons/ionicons5'
import PomodoroTimer from './PomodoroTimer.vue'
import TodoItem from './TodoItem.vue'
import TodoInput from './TodoInput.vue'
import TodoFilter from './TodoFilter.vue'
import draggable from 'vuedraggable'
import DailyQuote from './DailyQuote.vue'

// 分别存储不同状态的待办事项
const activeTodos = useStorage('active-todos', [])
const completedTodos = useStorage('completed-todos', [])
const pomodoroRecords = useStorage('pomodoro-records', [])

// 合并所有待办事项
const todos = computed(() => [...activeTodos.value, ...completedTodos.value])

const currentFilter = ref('all')
const message = useMessage()

// 存储排序索引
const todoOrder = useStorage('todo-order', [])

// 生成唯一ID
const generateUniqueId = () => {
  const timestamp = Date.now()
  const random = Math.floor(Math.random() * 10000)
  return `${timestamp}-${random}`
}

// 确保 todoOrder 与 todos 同步
watch([activeTodos, completedTodos], () => {
  const currentIds = new Set(todoOrder.value)
  const allIds = todos.value.map(todo => todo.id)
  
  // 添加新的 ID
  allIds.forEach(id => {
    if (!currentIds.has(id)) {
      todoOrder.value.push(id)
    }
  })
  
  // 移除不存在的 ID
  todoOrder.value = todoOrder.value.filter(id => 
    todos.value.some(todo => todo.id === id)
  )
}, { immediate: true })

// 用于显示的列表
const displayTodos = computed(() => {
  let filtered = []
  
  // 根据过滤条件选择显示的列表
  switch (currentFilter.value) {
    case 'active':
      filtered = [...activeTodos.value]
      break
    case 'completed':
      filtered = [...completedTodos.value]
      break
    default:
      filtered = [...todos.value]
  }
  
  // 只在非拖拽状态下进行自动排序
  if (currentFilter.value === 'all') {
    // 按完成状态和其他条件排序
    filtered.sort((a, b) => {
      // 首先按完成状态排序（未完成的在前）
      if (a.isCompleted !== b.isCompleted) {
        return a.isCompleted ? 1 : -1
      }
      
      // 如果都有截止时间，按时间排序
      if (a.dueDate && b.dueDate) {
        return new Date(a.dueDate) - new Date(b.dueDate)
      }
      // 有截止时间的排在前面
      if (a.dueDate) return -1
      if (b.dueDate) return 1
      // 都没有截止时间，按照原有顺序
      const indexA = todoOrder.value.indexOf(a.id)
      const indexB = todoOrder.value.indexOf(b.id)
      return indexA - indexB
    })
  } else {
    // 在筛选视图下，按照用户拖拽顺序排序
    filtered.sort((a, b) => {
      const indexA = todoOrder.value.indexOf(a.id)
      const indexB = todoOrder.value.indexOf(b.id)
      return indexA - indexB
    })
  }
  
  return filtered
})

// 计算完成率
const completionRate = computed(() => {
  const total = activeTodos.value.length + completedTodos.value.length
  if (total === 0) return 0
  return Math.round((completedTodos.value.length / total) * 100)
})

const getProgressColor = computed(() => {
  const rate = completionRate.value
  if (rate >= 100) return '#10b981' // 完成
  if (rate >= 80) return '#3b82f6'  // 接近完成
  if (rate >= 50) return '#f59e0b'  // 过半
  if (rate >= 20) return '#f97316'  // 开始
  return '#ef4444'                   // 刚起步
})

const addTodo = ({ value, tags = [], dueDate = null }) => {
  const newTodo = {
    id: generateUniqueId(),
    value,
    tags,
    dueDate,
    isCompleted: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
  
  activeTodos.value.push(newTodo)
  todoOrder.value.push(newTodo.id)
}

const updateTodo = (id) => {
  // 在活动列表中查找
  let activeIndex = activeTodos.value.findIndex(todo => todo.id === id)
  if (activeIndex !== -1) {
    const todo = activeTodos.value[activeIndex]
    activeTodos.value.splice(activeIndex, 1)
    completedTodos.value.push({
      ...todo,
      isCompleted: true,
      updatedAt: new Date().toISOString()
    })
    return
  }
  
  // 在已完成列表中查找
  let completedIndex = completedTodos.value.findIndex(todo => todo.id === id)
  if (completedIndex !== -1) {
    const todo = completedTodos.value[completedIndex]
    completedTodos.value.splice(completedIndex, 1)
    activeTodos.value.push({
      ...todo,
      isCompleted: false,
      updatedAt: new Date().toISOString()
    })
  }
}

const deleteTodo = (id) => {
  activeTodos.value = activeTodos.value.filter(todo => todo.id !== id)
  completedTodos.value = completedTodos.value.filter(todo => todo.id !== id)
  todoOrder.value = todoOrder.value.filter(todoId => todoId !== id)
}

const handleDragEnd = () => {
  // 更新排序顺序
  todoOrder.value = displayTodos.value.map(todo => todo.id)
}

const exportTodos = () => {
  const data = JSON.stringify({
    todos: todos.value,
    pomodoroRecords: pomodoroRecords.value,
    tags: tags.value
  }, null, 2)
  const blob = new Blob([data], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `todo-backup-${new Date().toISOString().split('T')[0]}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

const handleImport = ({ file }) => {
  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const importedData = JSON.parse(e.target.result)
      if (importedData && importedData.todos) {
        // 先导入标签
        if (Array.isArray(importedData.tags)) {
          // 合并标签，避免重复
          const existingTagNames = new Set(tags.value.map(t => t.name))
          const newTags = importedData.tags.filter(tag => !existingTagNames.has(tag.name))
          tags.value.push(...newTags)
        }
        
        // 为导入的待办事项生成新的唯一ID
        const processedTodos = importedData.todos.map(todo => ({
          ...todo,
          id: generateUniqueId(),
          // 验证标签是否存在
          tags: todo.tags.filter(tagName => 
            tags.value.some(t => t.name === tagName)
          ),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }))
        
        // 根据完成状态分别添加到对应列表
        processedTodos.forEach(todo => {
          if (todo.isCompleted) {
            completedTodos.value.push(todo)
          } else {
            activeTodos.value.push(todo)
          }
        })
        
        // 导入番茄记录
        if (Array.isArray(importedData.pomodoroRecords)) {
          pomodoroRecords.value = importedData.pomodoroRecords
        }
        
        message.success('导入成功')
      } else {
        throw new Error('Invalid format')
      }
    } catch (error) {
      console.error('Import error:', error)
      message.error('导入失败：无效的文件格式')
    }
  }
  reader.readAsText(file.file)
}

const updateFilter = (filter) => {
  currentFilter.value = filter
}

const editTodo = ({ id, value, tags, dueDate }) => {
  // 在活动列表中查找
  let todo = activeTodos.value.find(t => t.id === id)
  if (todo) {
    if (value !== undefined) todo.value = value
    if (tags !== undefined) todo.tags = tags
    if (dueDate !== undefined) todo.dueDate = dueDate
    todo.updatedAt = new Date().toISOString()
    return
  }
  
  // 在已完成列表中查找
  todo = completedTodos.value.find(t => t.id === id)
  if (todo) {
    if (value !== undefined) todo.value = value
    if (tags !== undefined) todo.tags = tags
    if (dueDate !== undefined) todo.dueDate = dueDate
    todo.updatedAt = new Date().toISOString()
  }
}

// 添加 tags 存储
const tags = useStorage('todo-tags', [])
</script>

<style lang="scss" scoped>
.todo-container {
  padding: 2rem 1.5rem;
}

.main-layout {
  max-width: 1400px;
  margin: 0 auto;
}

.content-section {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 350px;
  gap: 2rem;
}

.tasks-section {
  background: var(--bg-primary);
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  padding: 1.5rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.25rem;

  h2 {
    font-size: 1.25rem;
    font-weight: 600;
    margin: 0;
    color: var(--text-primary);
  }

  .header-actions {
    display: flex;
    gap: 1rem;
    align-items: center;
  }
}

.progress-bar {
  margin: 1rem 0;
  padding: 1rem;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 12px;

  .progress-info {
    margin-bottom: 0.5rem;
    
    .progress-stats {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      
      .stat-item {
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 0.5rem;
        
        .label {
          font-size: 0.8rem;
          color: var(--text-secondary);
        }
        
        .value {
          font-size: 1rem;
          font-weight: 600;
          color: var(--text-primary);
          
          &.highlight {
            color: var(--primary-color);
          }
        }
      }
    }
  }

  :deep(.n-progress) {
    &.n-progress--line {
      background-color: var(--bg-secondary);
    }
  }
}

.tasks-list {
  margin-top: 1.25rem;

  :deep(.sortable-drag) {
    opacity: 0.5;
    background: var(--bg-secondary);
  }
}

.side-section {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  position: sticky;
  top: calc(64px + 2rem);
  height: fit-content;
}

/* 响应式布局 */
@media (min-width: 1440px) {
  .content-section {
    grid-template-columns: minmax(0, 1fr) 380px;
    gap: 2.5rem;
  }

  .tasks-section {
    padding: 1.5rem;
  }
}

@media (max-width: 1439px) and (min-width: 1024px) {
  .content-section {
    grid-template-columns: minmax(0, 1fr) 350px;
  }
}

@media (max-width: 1023px) and (min-width: 769px) {
  .todo-container {
    padding: 1.5rem;
  }

  .content-section {
    grid-template-columns: minmax(0, 1fr) 320px;
    gap: 1.5rem;
  }

  .tasks-section {
    padding: 1.5rem;
  }
}

@media (max-width: 768px) {
  .todo-container {
    padding: 1rem;
  }

  .content-section {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .tasks-section {
    padding: 1.25rem;
  }

  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .side-section {
    position: static;
    margin-top: 1rem;
  }
}

@media (max-width: 640px) {
  .todo-container {
    padding: 0.75rem;
  }

  .tasks-section {
    padding: 1.25rem;
    border-radius: 12px;
  }

  .section-header h2 {
    font-size: 1.15rem;
  }
}

// 动画
.fade-enter-active,
.fade-leave-active {
  transition: all 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style> 