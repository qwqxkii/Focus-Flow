<template>
  <div class="color-picker-wrapper">
    <div class="color-picker">
      <div
        v-for="color in colors"
        :key="color"
        class="color-item"
        :style="{ 
          backgroundColor: color,
          boxShadow: modelValue === color ? `0 0 0 2px var(--bg-primary), 0 0 0 4px ${color}` : 'none'
        }"
        @click="$emit('update:modelValue', color)"
      >
        <div 
          v-if="modelValue === color" 
          class="check-icon"
        >
          <n-icon><CheckmarkSharp /></n-icon>
        </div>
      </div>
    </div>
    <div class="color-preview" v-if="modelValue && showPreview">
      <n-tag
        :color="{ color: modelValue + '20', textColor: modelValue }"
        round
      >
        {{ previewText }}
      </n-tag>
    </div>
  </div>
</template>

<script setup>
import { CheckmarkSharp } from '@vicons/ionicons5'

const props = defineProps({
  modelValue: String,
  colors: {
    type: Array,
    default: () => [
      '#f43f5e', '#ec4899', '#d946ef', '#a855f7', '#6366f1',
      '#3b82f6', '#0ea5e9', '#06b6d4', '#14b8a6', '#10b981',
      '#84cc16', '#eab308', '#f97316', '#ef4444'
    ]
  },
  showPreview: {
    type: Boolean,
    default: true
  },
  previewText: {
    type: String,
    default: '预览效果'
  }
})

defineEmits(['update:modelValue'])
</script>

<style lang="scss" scoped>
.color-picker-wrapper {
  .color-picker {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 0.5rem;
    margin-bottom: 1rem;
  }
  
  .color-item {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    cursor: pointer;
    transition: all 0.3s ease;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    
    &:hover {
      transform: scale(1.1);
    }
    
    .check-icon {
      color: white;
      font-size: 14px;
      filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.3));
    }
  }
  
  .color-preview {
    margin-top: 1rem;
    display: flex;
    justify-content: center;
  }
}
</style> 