<template>
  <div class="tag-manager">
    <n-select
      v-model:value="selectedTags"
      multiple
      filterable
      tag
      :options="tagOptions"
      placeholder="添加标签..."
      :consistent-menu-width="false"
      :show-checkmark="false"
      :clearable="true"
      :render-label="renderLabel"
      :render-tag="renderTag"
      :on-create="handleCreateTag"
    >
    </n-select>
  </div>
</template>

<script setup>
import { computed, ref, onBeforeUnmount } from 'vue'
import { useStorage } from '@vueuse/core'
import { NSelect, NTag, useMessage } from 'naive-ui'
import { h } from 'vue'

const message = useMessage()

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:modelValue'])

// 存储所有标签
const tags = useStorage('todo-tags', [])

// 当前选中的标签
const selectedTags = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// 标签选项
const tagOptions = computed(() => 
  tags.value.map(tag => ({
    label: tag.name,
    value: tag.name,
    color: tag.color
  }))
)

// 默认颜色列表
const defaultColors = [
  '#f43f5e', '#ec4899', '#d946ef', '#a855f7', '#6366f1',
  '#3b82f6', '#0ea5e9', '#06b6d4', '#14b8a6', '#10b981',
  '#84cc16', '#eab308', '#f97316', '#ef4444'
]

function handleCreateTag(name) {
  if (!name || name.length < 2) {
    message.warning('标签至少需要2个字符')
    return false
  }
  
  if (tags.value.some(tag => tag.name === name)) {
    message.warning('标签已存在')
    return false
  }
  
  const now = new Date().toISOString()
  const color = defaultColors[Math.floor(Math.random() * defaultColors.length)]
  tags.value.push({ 
    name, 
    color,
    createdAt: now
  })
  
  // 自动选中新创建的标签
  const newValue = [...selectedTags.value, name]
  emit('update:modelValue', newValue)
  return true
}

function renderLabel(option) {
  return h(NTag, {
    color: { color: option.color + '20', textColor: option.color },
    bordered: false,
    round: true
  }, { default: () => option.label })
}

function renderTag(tag) {
  const option = tagOptions.value.find(o => o.value === tag)
  if (!option) return tag
  return h(NTag, {
    color: { color: option.color + '20', textColor: option.color },
    bordered: false,
    round: true
  }, { default: () => option.label })
}
</script>

<style lang="scss" scoped>
.tag-manager {
  width: 100%;
}
</style> 