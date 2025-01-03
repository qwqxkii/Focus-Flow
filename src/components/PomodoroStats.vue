<template>
  <div class="todo-container">
    <div class="main-layout">
      <div class="stats-header">
        <h2>番茄时钟统计</h2>
        <div class="header-actions">
          <n-button-group>
            <n-button
              v-for="period in periods"
              :key="period.value"
              :type="currentPeriod === period.value ? 'primary' : 'default'"
              @click="currentPeriod = period.value"
            >
              {{ period.label }}
            </n-button>
          </n-button-group>
        </div>
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <h3>完成番茄数</h3>
          <div class="stat-value">{{ stats.completedCount }}</div>
          <div class="stat-label">个</div>
        </div>
        <div class="stat-card">
          <h3>专注时长</h3>
          <div class="stat-value">{{ stats.totalMinutes }}</div>
          <div class="stat-label">分钟</div>
        </div>
        <div class="stat-card">
          <h3>平均专注</h3>
          <div class="stat-value">{{ stats.averagePerDay.toFixed(1) }}</div>
          <div class="stat-label">个/天</div>
        </div>
      </div>

      <div class="chart-container">
        <h3>趋势图</h3>
        <div ref="chartRef" class="chart"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useStorage } from '@vueuse/core'
import { NButton, NButtonGroup } from 'naive-ui'
import * as echarts from 'echarts'

const isDark = useStorage('todo-dark-mode', false)
const completedTodos = useStorage('completed-todos', [])

const periods = [
  { label: '今日', value: 'day' },
  { label: '本周', value: 'week' },
  { label: '本月', value: 'month' },
  { label: '今年', value: 'year' }
]

const currentPeriod = ref('day')
const chartRef = ref(null)
let chart = null

// 从 localStorage 获取番茄记录
const pomodoroRecords = useStorage('pomodoro-records', [])

// 根据时间段计算统计数据
const stats = computed(() => {
  const now = new Date()
  const records = pomodoroRecords.value.filter(record => {
    const recordDate = new Date(record.timestamp)
    switch (currentPeriod.value) {
      case 'day':
        return isSameDay(now, recordDate)
      case 'week':
        return isSameWeek(now, recordDate)
      case 'month':
        return isSameMonth(now, recordDate)
      case 'year':
        return isSameYear(now, recordDate)
    }
  })

  const completedCount = records.length
  const totalMinutes = records.reduce((sum, record) => sum + record.duration, 0)
  const daysInPeriod = getDaysInPeriod(currentPeriod.value)
  const averagePerDay = completedCount / daysInPeriod

  return {
    completedCount,
    totalMinutes,
    averagePerDay
  }
})

// 初始化图表
function initChart() {
  if (chart) {
    chart.dispose()
  }
  chart = echarts.init(chartRef.value)
  updateChart()
}

// 更新图表数据
function updateChart() {
  const { dates, pomoCounts, todoCounts } = getChartData()
  
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross'
      }
    },
    backgroundColor: 'transparent',
    textStyle: {
      color: isDark.value ? '#f3f4f6' : '#1f2937'
    },
    legend: {
      data: ['番茄数', '完成事项'],
      textStyle: {
        color: isDark.value ? '#f3f4f6' : '#1f2937'
      }
    },
    xAxis: {
      type: 'category',
      data: dates,
      axisLine: {
        lineStyle: {
          color: isDark.value ? '#374151' : '#e5e7eb'
        }
      },
      axisLabel: {
        color: isDark.value ? '#9ca3af' : '#6b7280'
      }
    },
    yAxis: {
      type: 'value',
      axisLine: {
        lineStyle: {
          color: isDark.value ? '#374151' : '#e5e7eb'
        }
      },
      splitLine: {
        lineStyle: {
          color: isDark.value ? '#374151' : '#e5e7eb',
          opacity: 0.3
        }
      },
      axisLabel: {
        color: isDark.value ? '#9ca3af' : '#6b7280'
      }
    },
    series: [
      {
        data: pomoCounts,
        type: 'bar',
        name: '番茄数',
        itemStyle: {
          color: isDark.value ? '#36ad6a' : '#18a058'
        }
      },
      {
        data: todoCounts,
        type: 'line',
        name: '完成事项',
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        itemStyle: {
          color: isDark.value ? '#60a5fa' : '#3b82f6'
        },
        lineStyle: {
          width: 3
        }
      }
    ]
  }
  
  chart.setOption(option)
}

// 获取图表数据
function getChartData() {
  const dates = []
  const pomoCounts = []
  const todoCounts = []
  const now = new Date()
  
  switch (currentPeriod.value) {
    case 'day':
      // 24小时数据
      for (let i = 0; i < 24; i++) {
        dates.push(`${i}时`)
        const pomoCount = pomodoroRecords.value.filter(record => {
          const date = new Date(record.timestamp)
          return isSameDay(date, now) && date.getHours() === i
        }).length
        pomoCounts.push(pomoCount)
        
        const todoCount = completedTodos.value.filter(todo => {
          const date = new Date(todo.updatedAt)
          return isSameDay(date, now) && date.getHours() === i
        }).length
        todoCounts.push(todoCount)
      }
      break
      
    case 'week':
      // 本周每天数据
      const startOfWeek = new Date(now)
      startOfWeek.setDate(now.getDate() - now.getDay())
      for (let i = 0; i < 7; i++) {
        const date = new Date(startOfWeek)
        date.setDate(startOfWeek.getDate() + i)
        dates.push(`${date.getMonth() + 1}月${date.getDate()}日`)
        const pomoCount = pomodoroRecords.value.filter(record => {
          const recordDate = new Date(record.timestamp)
          return isSameDay(recordDate, date)
        }).length
        pomoCounts.push(pomoCount)
        
        const todoCount = completedTodos.value.filter(todo => {
          const todoDate = new Date(todo.updatedAt)
          return isSameDay(todoDate, date)
        }).length
        todoCounts.push(todoCount)
      }
      break
      
    case 'month':
      // 当月每天数据
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
      for (let i = 1; i <= daysInMonth; i++) {
        dates.push(`${i}日`)
        const pomoCount = pomodoroRecords.value.filter(record => {
          const date = new Date(record.timestamp)
          return isSameMonth(date, now) && date.getDate() === i
        }).length
        pomoCounts.push(pomoCount)
        
        const todoCount = completedTodos.value.filter(todo => {
          const date = new Date(todo.updatedAt)
          return isSameMonth(date, now) && date.getDate() === i
        }).length
        todoCounts.push(todoCount)
      }
      break
      
    case 'year':
      // 12个月数据
      for (let i = 0; i < 12; i++) {
        dates.push(`${i + 1}月`)
        const pomoCount = pomodoroRecords.value.filter(record => {
          const date = new Date(record.timestamp)
          return isSameYear(date, now) && date.getMonth() === i
        }).length
        pomoCounts.push(pomoCount)
        
        const todoCount = completedTodos.value.filter(todo => {
          const date = new Date(todo.updatedAt)
          return isSameYear(date, now) && date.getMonth() === i
        }).length
        todoCounts.push(todoCount)
      }
      break
  }
  
  return { dates, pomoCounts, todoCounts }
}

// 日期辅助函数
function isSameDay(d1, d2) {
  return d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
}

function isSameWeek(d1, d2) {
  const startOfWeek1 = new Date(d1)
  startOfWeek1.setDate(d1.getDate() - d1.getDay())
  const startOfWeek2 = new Date(d2)
  startOfWeek2.setDate(d2.getDate() - d2.getDay())
  return isSameDay(startOfWeek1, startOfWeek2)
}

function isSameMonth(d1, d2) {
  return d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth()
}

function isSameYear(d1, d2) {
  return d1.getFullYear() === d2.getFullYear()
}

function getDaysInPeriod(period) {
  const now = new Date()
  switch (period) {
    case 'day':
      return 1
    case 'week':
      return 7
    case 'month':
      return new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
    case 'year':
      return 365
  }
}

// 监听窗口大小变化
window.addEventListener('resize', () => {
  chart?.resize()
})

// 监听时间段变化
watch(currentPeriod, updateChart)

// 监听主题变化
watch(isDark, updateChart)

onMounted(() => {
  initChart()
})
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

.stats-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.25rem;

  h2 {
    font-size: 1.25rem;
    margin: 0;
    color: var(--text-primary);
  }
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.stat-card {
  background: var(--bg-secondary);
  border-radius: 12px;
  padding: 1.5rem;
  text-align: center;

  h3 {
    font-size: 1rem;
    color: var(--text-secondary);
    margin: 0 0 1rem;
  }

  .stat-value {
    font-size: 2rem;
    font-weight: 600;
    color: var(--primary-color);
  }

  .stat-label {
    font-size: 0.875rem;
    color: var(--text-secondary);
    margin-top: 0.5rem;
  }
}

.chart-container {
  background: var(--bg-secondary);
  border-radius: 12px;
  padding: 1.5rem;

  h3 {
    font-size: 1rem;
    color: var(--text-secondary);
    margin: 0 0 1rem;
  }

  .chart {
    height: 400px;
  }
}

@media (max-width: 768px) {
  .todo-container {
    padding: 1rem;
  }

  .main-layout {
    padding: 1.25rem;
  }

  .stats-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .chart-container .chart {
    height: 300px;
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

  .stats-header h2 {
    font-size: 1.15rem;
  }
}
</style> 