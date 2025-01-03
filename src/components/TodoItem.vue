<template>
  <div
    class="todo-item"
    :class="{ 
      'is-completed': todo.isCompleted
    }"
  >
    <div class="drag-handle">
      <n-icon><MenuOutline /></n-icon>
    </div>
    <div 
      class="todo-content"
    >
      <div 
        class="checkbox" 
        :class="{ checked: todo.isCompleted }"
        @click="handleToggleComplete"
      >
        <n-icon v-if="todo.isCompleted" class="check-icon">
          <CheckmarkSharp />
        </n-icon>
      </div>
      <div class="todo-info">
        <div class="todo-text" @click="startEdit">
          <template v-if="!isEditing">
            {{ todo.value }}
          </template>
          <n-input
            v-else
            v-model:value="editText"
            @keyup.enter="handleSave"
            @blur="handleSave"
            ref="inputRef"
          />
        </div>
        <div class="todo-meta">
          <div class="tags-section" v-if="todo.tags.length || showTagButton">
            <n-tag 
              v-for="tag in todo.tags" 
              :key="tag"
              size="small"
              :color="getTagColor(tag)"
              :bordered="false"
              round
              closable
              @close.stop="removeTag(tag)"
              class="todo-tag"
            >
              {{ tag }}
            </n-tag>
            <n-button
              text
              type="primary"
              size="tiny"
              class="add-tag-btn"
              @click.stop="openTagEditor"
            >
              <template #icon>
                <n-icon><AddOutline /></n-icon>
              </template>
            </n-button>
          </div>
          <div v-if="todo.dueDate || !todo.isCompleted" class="due-date">
            <n-button
              text
              size="tiny"
              @click.stop="openDateEditor"
            >
              <template #icon>
                <n-icon>
                  <component :is="todo.dueDate ? CalendarOutline : TimeOutline" />
                </n-icon>
              </template>
              {{ dueDateText }}
            </n-button>
          </div>
          <n-button
            quaternary
            circle
            class="delete-btn"
            @click.stop="$emit('delete', todo.id)"
          >
            <template #icon>
              <n-icon><TrashOutline /></n-icon>
            </template>
          </n-button>
        </div>
      </div>
    </div>
    <n-modal
      v-model:show="showTagEditor"
      preset="card"
      title="编辑标签"
      :style="{ width: '90%', maxWidth: '340px' }"
    >
      <div class="tags-wrapper">
        <n-tag
          v-for="tag in availableTags"
          :key="tag.name"
          :color="{ color: tag.color + '20', textColor: tag.color }"
          :bordered="false"
          round
          checkable
          :checked="editTags.includes(tag.name)"
          @click="toggleTag(tag.name)"
        >
          {{ tag.name }}
        </n-tag>
      </div>
      <template #footer>
        <div class="modal-footer">
          <n-button round @click="showTagEditor = false">
            取消
          </n-button>
          <n-button
            round
            type="primary"
            @click="handleSaveTags"
          >
            确定
          </n-button>
        </div>
      </template>
    </n-modal>
    <n-modal
      v-model:show="showDateEditor"
      preset="card"
      title="设置截止时间"
      :style="{ width: '90%', maxWidth: '340px' }"
    >
      <n-date-picker
        v-model:value="editDate"
        type="datetime"
        clearable
        :is-date-disabled="disablePastDates"
        :actions="['clear', 'now', 'confirm']"
      />
      <template #footer>
        <div class="modal-footer">
          <n-button round @click="showDateEditor = false">取消</n-button>
          <n-button round type="primary" @click="handleSaveDate">确定</n-button>
        </div>
      </template>
    </n-modal>
  </div>
</template>

<script setup>
import { ref, nextTick, computed } from 'vue'
import { useStorage } from '@vueuse/core'
import { NButton, NIcon, NTag, NInput, NModal, NDatePicker } from 'naive-ui'
import {
  CheckmarkSharp,
  TrashOutline,
  MenuOutline,
  PricetagOutline,
  AddOutline,
  CalendarOutline,
  TimeOutline
} from '@vicons/ionicons5'
import TagManager from './TagManager.vue'

const props = defineProps({
  todo: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['update', 'delete', 'edit'])

// 编辑相关
const isEditing = ref(false)
const editText = ref('')
const inputRef = ref(null)

// 标签相关
const showTagEditor = ref(false)
const editTags = ref([])
const tags = useStorage('todo-tags', [])

// 可用标签列表
const availableTags = computed(() => tags.value)

// 控制是否显示添加标签按钮
const showTagButton = computed(() => {
  return !props.todo.isCompleted
})

const showDateEditor = ref(false)
const editDate = ref(null)

const dueDateText = computed(() => {
  if (!props.todo.dueDate) return '添加时间'
  const date = new Date(props.todo.dueDate)
  const now = new Date()
  const isToday = date.toDateString() === now.toDateString()
  const isTomorrow = new Date(now.setDate(now.getDate() + 1)).toDateString() === date.toDateString()
  
  if (isToday) {
    return `今天 ${date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`
  } else if (isTomorrow) {
    return `明天 ${date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`
  } else {
    return date.toLocaleString('zh-CN', { 
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }
})

function startEdit() {
  editText.value = props.todo.value
  isEditing.value = true
  nextTick(() => {
    inputRef.value?.focus()
  })
}

function handleSave() {
  if (isEditing.value) {
    const text = editText.value.trim()
    if (text && text !== props.todo.value) {
      emit('edit', { id: props.todo.id, value: text })
    }
    isEditing.value = false
  }
}

function handleToggleComplete() {
  emit('update', props.todo.id)
}

function openTagEditor() {
  editTags.value = [...props.todo.tags]
  showTagEditor.value = true
}

function handleSaveTags() {
  emit('edit', {
    id: props.todo.id,
    tags: editTags.value
  })
  showTagEditor.value = false
}

function getTagColor(tagName) {
  const tag = tags.value.find(t => t.name === tagName)
  return tag ? { color: tag.color + '20', textColor: tag.color } : undefined
}

function removeTag(tagName) {
  const newTags = props.todo.tags.filter(t => t !== tagName)
  emit('edit', { id: props.todo.id, tags: newTags })
}

function toggleTag(tagName) {
  const index = editTags.value.indexOf(tagName)
  if (index === -1) {
    editTags.value.push(tagName)
  } else {
    editTags.value.splice(index, 1)
  }
}

function openDateEditor() {
  editDate.value = props.todo.dueDate
  showDateEditor.value = true
}

function handleSaveDate() {
  emit('edit', {
    id: props.todo.id,
    dueDate: editDate.value
  })
  showDateEditor.value = false
}

function disablePastDates(ts) {
  return ts < Date.now() - 24 * 60 * 60 * 1000
}
</script>

<style lang="scss" scoped>
.todo-item {
  display: flex;
  align-items: center;
  padding: 0.5rem 0.75rem;
  margin: 0.5rem 0;
  background: var(--bg-primary);
  border-radius: 8px;
  transition: all 0.3s ease;
  border: 1px solid var(--border-color);
  border-left: 3px solid var(--primary-color);
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px var(--shadow-color);
    
    .delete-btn {
      opacity: 1;
    }
    
    .drag-handle {
      opacity: 0.5;
    }
  }
  
  &.is-completed {
    background: var(--bg-secondary);
    border-color: var(--border-color);
    border-left-color: var(--text-secondary);
    
    .todo-text {
      text-decoration: line-through;
      color: var(--text-secondary);
    }
    
    .checkbox {
      border-color: var(--text-secondary);
      
      &.checked {
        background-color: var(--text-secondary);
      }
    }
    
    .todo-meta {
      opacity: 0.6;
    }
  }
}

.todo-content {
  display: flex;
  align-items: center;
  flex: 1;
  cursor: pointer;
}

.todo-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex: 1;
  min-width: 0;
}

.todo-text {
  flex: 1;
  min-width: 0;
  font-size: 0.95rem;
  transition: all 0.3s ease;
  color: var(--text-primary);
  cursor: text;
  padding: 0.15rem 0;
  margin-right: 1rem;
  text-align: left;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  
  :deep(.n-input) {
    margin: -0.25rem 0;
  }
}

.todo-meta {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-left: auto;
  flex-shrink: 0;
}

.tags-section {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.todo-tag {
  transition: all 0.2s ease;
  font-size: 0.8rem;
  padding: 0 0.5rem;
  height: 20px;
  line-height: 20px;
  white-space: nowrap;
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  }
}

.drag-handle {
  display: flex;
  align-items: center;
  padding: 0.25rem;
  margin-right: 0.5rem;
  cursor: move;
  opacity: 0;
  transition: opacity 0.3s ease;
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.checkbox {
  width: 20px;
  height: 20px;
  border: 2px solid var(--primary-color);
  border-radius: 50%;
  margin-right: 0.6rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;

  &.checked {
    background-color: var(--primary-color);
    
    .check-icon {
      color: white;
      font-size: 0.9rem;
    }
  }
}

.delete-btn,
.edit-btn {
  opacity: 0;
  transition: all 0.3s ease;
  font-size: 0.9rem;
  
  &:hover {
    background-color: var(--hover-bg);
  }
}

.edit-btn {
  margin-right: 0.5rem;
}

.delete-btn {
  color: var(--danger-color);
}

.todo-tag {
  transition: all 0.2s ease;
  font-size: 0.8rem;
  padding: 0 0.5rem;
  height: 20px;
  line-height: 20px;
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  }
  
  :deep(.n-tag__close) {
    margin-left: 2px;
    font-size: 12px;
  }
}

.add-tag-btn {
  font-size: 0.85rem;
  padding: 0 0.25rem;
  height: 20px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  opacity: 0.7;
  transition: all 0.2s ease;
  
  &:hover {
    opacity: 1;
    background: var(--primary-color-hover);
  }
  
  .n-icon {
    font-size: 0.9rem;
  }
}

.due-date {
  .n-button {
    font-size: 0.85rem;
    padding: 0 0.5rem;
    height: 20px;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    color: var(--primary-color);
    opacity: 0.8;
    transition: all 0.2s ease;
    
    &:hover {
      opacity: 1;
      background: var(--primary-color-hover);
    }
    
    .n-icon {
      font-size: 0.9rem;
    }
  }
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1rem;
}

.tags-wrapper {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding: 1rem;
  background: var(--bg-secondary);
  border-radius: 8px;
  margin-bottom: 1rem;
}
</style> 