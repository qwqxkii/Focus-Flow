<template>
  <div class="todo-filter">
    <n-radio-group v-model:value="selectedFilter" @update:value="updateFilter">
      <n-radio-button
        v-for="filter in filters"
        :key="filter.value"
        :value="filter.value"
      >
        {{ filter.label }}
        <span class="count" v-if="filter.count !== undefined">
          ({{ filter.count }})
        </span>
      </n-radio-button>
    </n-radio-group>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { NRadioGroup, NRadioButton } from 'naive-ui'

const props = defineProps({
  todos: {
    type: Array,
    required: true
  },
  currentFilter: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['filter'])

const selectedFilter = computed({
  get: () => props.currentFilter,
  set: (value) => emit('filter', value)
})

const filters = computed(() => [
  {
    label: '全部',
    value: 'all',
    count: props.todos.length
  },
  {
    label: '未完成',
    value: 'active',
    count: props.todos.filter(todo => !todo.isCompleted).length
  },
  {
    label: '已完成',
    value: 'completed',
    count: props.todos.filter(todo => todo.isCompleted).length
  }
])

const updateFilter = (value) => {
  emit('filter', value)
}
</script>

<style lang="scss" scoped>
.todo-filter {
  margin: 2rem 0;
  display: flex;
  justify-content: center;

  :deep(.n-radio-group) {
    background: var(--bg-secondary);
    padding: 0.5rem;
    border-radius: 12px;
  }

  .count {
    margin-left: 4px;
    opacity: 0.7;
  }
}
</style> 