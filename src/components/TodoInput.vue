<template>
  <div class="todo-input">
    <div class="input-section">
      <n-input
        v-model:value="todoText"
        type="text"
        placeholder="添加新的待办事项..."
        @keyup.enter="handleAdd"
      >
        <template #prefix>
          <n-icon><AddCircleOutline /></n-icon>
        </template>
        <template #suffix>
          <n-button
            quaternary
            circle
            size="small"
            @click="showDatePicker = !showDatePicker"
            :class="{ active: showDatePicker || dueDate }"
          >
            <template #icon>
              <n-icon><CalendarOutline /></n-icon>
            </template>
          </n-button>
          <n-button
            quaternary
            circle
            size="small"
            @click="showTagSelect = !showTagSelect"
            :class="{ active: showTagSelect || selectedTags.length > 0 }"
          >
            <template #icon>
              <n-icon><PricetagOutline /></n-icon>
            </template>
          </n-button>
        </template>
      </n-input>
      
      <div class="input-actions">
        <n-button
          type="primary"
          :disabled="!todoText.trim()"
          @click="handleAdd"
        >
          添加
        </n-button>
      </div>
    </div>
    
    <n-collapse-transition :show="showDatePicker">
      <div class="date-section" v-if="showDatePicker">
        <n-date-picker
          v-model:value="dueDate"
          type="datetime"
          clearable
          :is-date-disabled="disablePastDates"
          :actions="['clear', 'now', 'confirm']"
        />
      </div>
    </n-collapse-transition>
    
    <div class="selected-tags" v-if="selectedTags.length">
      <n-tag
        v-for="tag in selectedTags"
        :key="tag"
        :color="getTagColor(tag)"
        closable
        round
        size="small"
        @close="removeTag(tag)"
      >
        {{ tag }}
      </n-tag>
    </div>
    
    <n-collapse-transition :show="showTagSelect">
      <div class="tags-section" v-if="showTagSelect">
        <div class="tags-wrapper">
          <n-tag
            v-for="tag in availableTags"
            :key="tag.name"
            :color="{ color: tag.color + '20', textColor: tag.color }"
            :bordered="false"
            round
            checkable
            :checked="selectedTags.includes(tag.name)"
            @click="toggleTag(tag.name)"
          >
            {{ tag.name }}
          </n-tag>
          <n-button
            text
            type="primary"
            @click="showCreateTag = true"
          >
            <template #icon>
              <n-icon><AddOutline /></n-icon>
            </template>
            新建标签
          </n-button>
        </div>
      </div>
    </n-collapse-transition>
    
    <n-modal
      v-model:show="showCreateTag"
      preset="card"
      title="新建标签"
      :style="{ width: '90%', maxWidth: '340px' }"
    >
      <n-form>
        <n-form-item label="标签名称">
          <n-input v-model:value="newTagName" placeholder="输入标签名称" />
        </n-form-item>
        <n-form-item label="标签颜色">
          <color-picker
            v-model="newTagColor"
            :preview-text="newTagName || '预览效果'"
          />
        </n-form-item>
      </n-form>
      <template #footer>
        <div class="modal-footer">
          <n-button round @click="showCreateTag = false">取消</n-button>
          <n-button
            round
            type="primary"
            @click="createNewTag"
            :disabled="!newTagName.trim()"
          >
            确定
          </n-button>
        </div>
      </template>
    </n-modal>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useStorage } from '@vueuse/core'
import { useMessage, NDatePicker } from 'naive-ui'
import {
  AddCircleOutline,
  PricetagOutline,
  AddOutline,
  CalendarOutline
} from '@vicons/ionicons5'
import ColorPicker from './ColorPicker.vue'

const message = useMessage()
const todoText = ref('')
const selectedTags = ref([])
const showTagSelect = ref(false)
const showCreateTag = ref(false)
const newTagName = ref('')
const showDatePicker = ref(false)
const dueDate = ref(null)

const tags = useStorage('todo-tags', [])

const emit = defineEmits(['add'])

const availableTags = computed(() => tags.value)

const newTagColor = ref('#f43f5e')

function toggleTag(tagName) {
  const index = selectedTags.value.indexOf(tagName)
  if (index === -1) {
    selectedTags.value.push(tagName)
  } else {
    selectedTags.value.splice(index, 1)
  }
}

function createNewTag() {
  if (!newTagName.value || newTagName.value.length < 2) {
    message.warning('标签至少需要2个字符')
    return
  }
  
  if (tags.value.some(tag => tag.name === newTagName.value)) {
    message.warning('标签已存在')
    return
  }
  
  const color = newTagColor.value
  tags.value.push({
    name: newTagName.value,
    color,
    createdAt: new Date().toISOString()
  })
  
  selectedTags.value.push(newTagName.value)
  newTagName.value = ''
  showCreateTag.value = false
  message.success('标签创建成功')
}

function disablePastDates(ts) {
  return ts < Date.now() - 24 * 60 * 60 * 1000
}

function handleAdd() {
  const text = todoText.value.trim()
  if (text) {
    emit('add', {
      value: text,
      tags: selectedTags.value,
      dueDate: dueDate.value
    })
    todoText.value = ''
    selectedTags.value = []
    dueDate.value = null
    showTagSelect.value = false
    showDatePicker.value = false
  }
}

function getTagColor(tagName) {
  const tag = tags.value.find(t => t.name === tagName)
  return tag ? { color: tag.color + '20', textColor: tag.color } : undefined
}

function removeTag(tagName) {
  selectedTags.value = selectedTags.value.filter(t => t !== tagName)
}

watch(showCreateTag, (newVal) => {
  if (newVal) {
    if (!newTagColor.value) {
      newTagColor.value = '#f43f5e'
    }
  }
})
</script>

<style lang="scss" scoped>
.todo-input {
  margin-bottom: 1.5rem;
  
  .input-section {
    display: flex;
    gap: 0.75rem;
    margin-bottom: 0.5rem;
    
    .n-input {
      flex: 1;
      
      :deep(.n-input-wrapper) {
        padding-right: 0.5rem;
      }
    }
  }
  
  .input-actions {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    
    .n-button {
      &.active {
        color: var(--primary-color);
        background: var(--primary-color-hover);
      }
    }
  }
  
  .tags-section {
    background: var(--bg-secondary);
    border-radius: 8px;
    padding: 1rem;
    margin-top: 0.5rem;
  }
  
  .tags-wrapper {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    align-items: center;
  }
  
  .selected-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin: 0.5rem 0;
    padding: 0.5rem;
    background: var(--bg-secondary);
    border-radius: 8px;
  }
  
  .date-section {
    background: var(--bg-secondary);
    border-radius: 8px;
    padding: 1rem;
    margin-top: 0.5rem;
    
    :deep(.n-date-picker) {
      width: 100%;
    }
  }
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1rem;
}
</style> 