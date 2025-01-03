<template>
  <div class="todo-container">
    <div class="main-layout">
      <div class="section-header">
        <h2>标签管理</h2>
        <n-button type="primary" @click="showAddTag = true">
          <template #icon>
            <n-icon><AddCircleOutline /></n-icon>
          </template>
          新建标签
        </n-button>
      </div>

      <div class="tags-grid">
        <div v-for="tag in tags" :key="tag.name" class="tag-card">
          <div class="tag-header">
            <n-tag :color="{ color: tag.color + '20', textColor: tag.color }" round>
              {{ tag.name }}
            </n-tag>
            <div class="tag-actions">
              <n-button quaternary circle size="small" @click="editTag(tag)">
                <template #icon>
                  <n-icon><CreateOutline /></n-icon>
                </template>
              </n-button>
              <n-popconfirm
                @positive-click="deleteTag(tag)"
                :show-icon="false"
              >
                <template #trigger>
                  <n-button quaternary circle size="small">
                    <template #icon>
                      <n-icon><TrashOutline /></n-icon>
                    </template>
                  </n-button>
                </template>
                <template #default>
                  删除标签将同时移除所有关联的待办事项中的该标签，确定继续吗？
                </template>
              </n-popconfirm>
            </div>
          </div>
          <div class="tag-info">
            <div class="info-item">
              <span class="label">关联事项</span>
              <span class="value">{{ getTaggedTodosCount(tag.name) }}</span>
            </div>
            <div class="info-item">
              <span class="label">创建时间</span>
              <span class="value">{{ formatDate(tag.createdAt) }}</span>
            </div>
          </div>
        </div>
      </div>

      <n-modal
        v-model:show="showAddTag"
        preset="card"
        :title="editingTag ? '编辑标签' : '新建标签'"
        :style="{ width: '90%', maxWidth: '340px' }"
      >
        <n-form>
          <n-form-item label="标签名称">
            <n-input v-model:value="tagForm.name" placeholder="输入标签名称" />
          </n-form-item>
          <n-form-item label="标签颜色">
            <div class="color-picker">
              <div
                v-for="color in defaultColors"
                :key="color"
                class="color-item"
                :style="{ backgroundColor: color }"
                :class="{ active: tagForm.color === color }"
                @click="tagForm.color = color"
              />
            </div>
          </n-form-item>
        </n-form>
        <template #footer>
          <div class="modal-footer">
            <n-button round @click="cancelEdit">取消</n-button>
            <n-button
              round
              type="primary"
              @click="saveTag"
              :disabled="!tagForm.name.trim()"
            >
              确定
            </n-button>
          </div>
        </template>
      </n-modal>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useStorage } from '@vueuse/core'
import { useMessage } from 'naive-ui'
import {
  AddCircleOutline,
  CreateOutline,
  TrashOutline
} from '@vicons/ionicons5'

const message = useMessage()
const tags = useStorage('todo-tags', [])
const activeTodos = useStorage('active-todos', [])
const completedTodos = useStorage('completed-todos', [])

const showAddTag = ref(false)
const editingTag = ref(null)
const tagForm = ref({
  name: '',
  color: '#f43f5e'
})

const defaultColors = [
  '#f43f5e', '#ec4899', '#d946ef', '#a855f7', '#6366f1',
  '#3b82f6', '#0ea5e9', '#06b6d4', '#14b8a6', '#10b981',
  '#84cc16', '#eab308', '#f97316', '#ef4444'
]

function getTaggedTodosCount(tagName) {
  return [
    ...activeTodos.value,
    ...completedTodos.value
  ].filter(todo => todo.tags.includes(tagName)).length
}

function editTag(tag) {
  editingTag.value = tag
  tagForm.value = {
    name: tag.name,
    color: tag.color
  }
  showAddTag.value = true
}

function deleteTag(tag) {
  // 处理待办事项
  const processTagInTodos = (todos) => {
    return todos.filter(todo => {
      if (todo.tags.includes(tag.name)) {
        // 如果只有这一个标签，删除整个待办事项
        if (todo.tags.length === 1) {
          return false
        }
        // 如果有多个标签，只移除当前标签
        todo.tags = todo.tags.filter(t => t !== tag.name)
      }
      return true
    })
  }

  // 更新活动和已完成的待办事项列表
  activeTodos.value = processTagInTodos(activeTodos.value)
  completedTodos.value = processTagInTodos(completedTodos.value)

  // 删除标签
  tags.value = tags.value.filter(t => t.name !== tag.name)
  message.success('标签已删除')
}

function saveTag() {
  const name = tagForm.value.name.trim()
  if (!name) return

  if (editingTag.value) {
    // 更新标签
    const oldName = editingTag.value.name
    const updateTagInTodos = (todos) => {
      todos.forEach(todo => {
        const index = todo.tags.indexOf(oldName)
        if (index !== -1) {
          todo.tags[index] = name
        }
      })
    }

    updateTagInTodos(activeTodos.value)
    updateTagInTodos(completedTodos.value)

    const index = tags.value.findIndex(t => t.name === oldName)
    if (index !== -1) {
      tags.value[index] = {
        ...tags.value[index],
        name,
        color: tagForm.value.color,
        updatedAt: new Date().toISOString()
      }
    }
    message.success('标签已更新')
  } else {
    // 创建新标签
    if (tags.value.some(t => t.name === name)) {
      message.error('标签名称已存在')
      return
    }

    tags.value.push({
      name,
      color: tagForm.value.color,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })
    message.success('标签已创建')
  }

  cancelEdit()
}

function cancelEdit() {
  showAddTag.value = false
  editingTag.value = null
  tagForm.value = {
    name: '',
    color: defaultColors[0]
  }
}

function formatDate(dateStr) {
  const date = new Date(dateStr)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}
</script>

<style lang="scss" scoped>
.todo-container {
  padding: 2rem 1.5rem;
}

.main-layout {
  max-width: 1400px;
  margin: 0 auto;
  background: var(--bg-primary);
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  padding: 1.5rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;

  h2 {
    font-size: 1.25rem;
    margin: 0;
    color: var(--text-primary);
  }
}

.tags-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
}

.tag-card {
  background: var(--bg-secondary);
  border-radius: 12px;
  padding: 1rem;
}

.tag-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.tag-actions {
  display: flex;
  gap: 0.5rem;
}

.tag-info {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.875rem;

  .label {
    color: var(--text-secondary);
  }

  .value {
    color: var(--text-primary);
    font-weight: 500;
  }
}

.color-picker {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0.5rem;
}

.color-item {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;

  &:hover {
    transform: scale(1.1);
  }

  &.active {
    border-color: var(--primary-color);
    transform: scale(1.1);
  }
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1rem;
}

@media (max-width: 768px) {
  .todo-container {
    padding: 1rem;
  }

  .main-layout {
    padding: 1.25rem;
  }

  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
}

@media (max-width: 640px) {
  .todo-container {
    padding: 0.75rem;
  }

  .main-layout {
    padding: 1.25rem;
    border-radius: 12px;
  }

  .tags-grid {
    grid-template-columns: 1fr;
  }
}
</style> 