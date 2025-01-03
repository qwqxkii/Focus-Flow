<template>
  <div class="pomodoro-timer">
    <div class="timer-header">
      <h3>番茄时钟</h3>
      <n-button
        quaternary
        circle
        size="small"
        @click="showSettings = true"
      >
        <template #icon>
          <n-icon><SettingsOutline /></n-icon>
        </template>
      </n-button>
    </div>
    <div class="timer-display" :class="{ 'is-break': isBreak }">
      <h2>
        {{ waitingForBreak ? '专注完成' : (isBreak ? '休息时间' : '专注时间') }}
      </h2>
      <div class="time">{{ formatTime }}</div>
      <div class="controls">
        <template v-if="waitingForBreak">
          <n-button
            round
            type="primary"
            @click="startBreak"
          >
            <template #icon>
              <n-icon><CafeOutline /></n-icon>
            </template>
            开始休息
          </n-button>
          <n-button
            round
            @click="skipBreak"
          >
            <template #icon>
              <n-icon><PlaySkipForwardOutline /></n-icon>
            </template>
            跳过休息
          </n-button>
        </template>
        <template v-else>
          <n-button
            round
            :type="isRunning ? 'warning' : 'primary'"
            @click="toggleTimer"
          >
            <template #icon>
              <n-icon>
                <component :is="isRunning ? PauseCircleOutline : PlayCircleOutline" />
              </n-icon>
            </template>
            {{ isRunning ? '暂停' : '开始' }}
          </n-button>
          <n-button
            round
            type="error"
            @click="resetTimer"
            :disabled="!canReset"
          >
            <template #icon>
              <n-icon><RefreshCircleOutline /></n-icon>
            </template>
            重置
          </n-button>
        </template>
      </div>
    </div>
    <div class="timer-stats">
      <div class="stat">
        <div class="stat-value">{{ completedPomodoros }}</div>
        <div class="stat-label">完成番茄数</div>
      </div>
      <n-divider vertical />
      <div class="stat">
        <div class="stat-value">{{ totalMinutes }}</div>
        <div class="stat-label">专注分钟</div>
      </div>
    </div>
    <n-modal
      v-model:show="showSettings"
      preset="card"
      title="时钟设置"
      :style="{ width: '90%', maxWidth: '340px' }"
    >
      <n-form>
        <n-form-item label="工作时长 (分钟)">
          <n-input-number
            v-model:value="settings.workDuration"
            :min="1"
            :max="60"
            :disabled="isRunning"
          />
        </n-form-item>
        <n-form-item label="休息时长 (分钟)">
          <n-input-number
            v-model:value="settings.breakDuration"
            :min="1"
            :max="30"
            :disabled="isRunning"
          />
        </n-form-item>
      </n-form>
      <template #footer>
        <div class="modal-footer">
          <n-button
            round
            type="primary"
            @click="showSettings = false"
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
import {
  NButton,
  NIcon,
  NDivider,
  NModal,
  NForm,
  NFormItem,
  NInputNumber
} from 'naive-ui'
import {
  PlayCircleOutline,
  PauseCircleOutline,
  RefreshCircleOutline,
  SettingsOutline,
  CafeOutline,
  PlaySkipForwardOutline
} from '@vicons/ionicons5'

const settings = useStorage('pomodoro-settings', {
  workDuration: 25,
  breakDuration: 5
})

const waitingForBreak = ref(false)
const timeLeft = ref(settings.value.workDuration * 60)
const isRunning = ref(false)
const isBreak = ref(false)
const pomodoroRecords = useStorage('pomodoro-records', [])
const completedPomodoros = computed(() => {
  const today = new Date()
  return pomodoroRecords.value.filter(record => 
    isSameDay(new Date(record.timestamp), today)
  ).length
})
const totalMinutes = ref(0)
let timer = null

const showSettings = ref(false)

const formatTime = computed(() => {
  const minutes = Math.floor(timeLeft.value / 60)
  const seconds = timeLeft.value % 60
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
})

const canReset = computed(() => {
  return isRunning.value || timeLeft.value !== (isBreak.value ? settings.value.breakDuration : settings.value.workDuration) * 60
})

const toggleTimer = () => {
  if (isRunning.value) {
    pauseTimer()
  } else {
    startTimer()
  }
}

const startTimer = () => {
  isRunning.value = true
  timer = setInterval(() => {
    if (timeLeft.value > 0) {
      timeLeft.value--
      if (!isBreak.value) {
        totalMinutes.value = Math.floor((settings.value.workDuration * 60 - timeLeft.value) / 60)
      }
    } else {
      handleTimerComplete()
    }
  }, 1000)
}

const pauseTimer = () => {
  isRunning.value = false
  clearInterval(timer)
}

const resetTimer = () => {
  pauseTimer()
  timeLeft.value = (isBreak.value ? settings.value.breakDuration : settings.value.workDuration) * 60
  isBreak.value = false
}

const handleTimerComplete = () => {
  const notification = new Audio('/notification.mp3')
  notification.play()
  pauseTimer()
  
  if (!isBreak.value) {
    pomodoroRecords.value.push({
      timestamp: new Date().toISOString(),
      duration: settings.value.workDuration
    })
    waitingForBreak.value = true
  } else {
    waitingForBreak.value = false
    isBreak.value = false
    timeLeft.value = settings.value.workDuration * 60
  }
}

function isSameDay(d1, d2) {
  return d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
}

function startBreak() {
  waitingForBreak.value = false
  isBreak.value = true
  timeLeft.value = settings.value.breakDuration * 60
  startTimer()
}

function skipBreak() {
  waitingForBreak.value = false
  isBreak.value = false
  timeLeft.value = settings.value.workDuration * 60
}

watch(
  () => settings.value,
  () => {
    if (!isRunning.value) {
      timeLeft.value = (isBreak.value ? settings.value.breakDuration : settings.value.workDuration) * 60
    }
  },
  { deep: true }
)
</script>

<style lang="scss" scoped>
.pomodoro-timer {
  margin: 0;
  padding: 1.5rem;
  background: var(--bg-secondary);
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
}

.timer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.25rem;

  h3 {
    font-size: 1.25rem;
    font-weight: 600;
    margin: 0;
    color: var(--text-primary);
  }
}

.timer-display {
  text-align: center;
  padding: 1.5rem;
  border-radius: 12px;
  background: var(--bg-primary);
  margin-bottom: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  
  &.is-break {
    background: linear-gradient(135deg, #34C759, #30B954);
    color: white;
    box-shadow: 0 4px 15px rgba(52, 199, 89, 0.3);
  }

  h2 {
    margin: 0 0 1rem;
    font-size: 1.5rem;
    opacity: 0.8;
  }

  .time {
    font-size: 2.5rem;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 1rem;
  }
}

.controls {
  display: flex;
  gap: 1rem;
  justify-content: center;

  .n-button {
    min-width: 100px;
    &:hover {
      transform: translateY(-1px);
      transition: transform 0.2s ease;
    }
  }
}

.timer-stats {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 1rem;
  padding: 1rem;
  background: var(--bg-primary);
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.stat {
  flex: 1;
  text-align: center;
  
  .stat-value {
    font-size: 2rem;
    font-weight: 700;
    color: var(--primary-color);
  }
  
  .stat-label {
    font-size: 0.875rem;
    color: var(--text-secondary);
  }
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 1rem;
}

:deep(.n-modal) {
  .n-card-header {
    padding: 1.25rem 1.25rem 0;
  }
  
  .n-card__content {
    padding: 1.25rem;
  }
  
  .n-card__footer {
    padding: 0 1.25rem 1.25rem;
  }
}
</style> 