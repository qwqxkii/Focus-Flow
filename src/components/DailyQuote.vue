<template>
  <div class="daily-quote">
    <div class="quote-content" :class="{ loading: isLoading }">
      <p class="text">{{ quote.hitokoto || '正在加载...' }}</p>
      <p class="source" v-if="quote.from">
        —— {{ quote.from }}
        <span v-if="quote.from_who">「{{ quote.from_who }}」</span>
      </p>
    </div>
    <n-button
      quaternary
      circle
      class="refresh-btn"
      :disabled="isLoading"
      @click="fetchQuote"
    >
      <template #icon>
        <n-icon><RefreshOutline /></n-icon>
      </template>
    </n-button>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { NButton, NIcon } from 'naive-ui'
import { RefreshOutline } from '@vicons/ionicons5'

const quotes = [
  {
    hitokoto: '生命的意义不在于活了多少日子，而在于记住了多少日子。',
    from: '阿·克罗宁',
    from_who: '《天幕下的恩仇》'
  },
  {
    hitokoto: '把时间花在美好的事物上。',
    from: '泰戈尔',
    from_who: '《飞鸟集》'
  },
  {
    hitokoto: '真正的朋友是那些知道你的缺点却仍然喜欢你的人。',
    from: '康德',
    from_who: null
  },
  {
    hitokoto: '我们必须拿我们所有的，去换我们所没有的。',
    from: '稻盛和夫',
    from_who: '《活法》'
  },
  {
    hitokoto: '如果你想要造一艘船，先不要雇人收集木材，而要激发他们对海洋的向往。',
    from: '圣埃克苏佩里',
    from_who: '《小王子》'
  }
]

const quote = ref({})
const isLoading = ref(true)

async function fetchQuote() {
  isLoading.value = true
  setTimeout(() => {
    const randomIndex = Math.floor(Math.random() * quotes.length)
    quote.value = quotes[randomIndex]
    isLoading.value = false
  }, 300)
}

onMounted(fetchQuote)
</script>

<style lang="scss" scoped>
.daily-quote {
  background: var(--bg-primary);
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 12px var(--shadow-color);
  position: relative;
  
  .quote-content {
    transition: opacity 0.3s ease;
    
    &.loading {
      opacity: 0.5;
    }
  }
  
  .text {
    font-size: 0.9rem;
    line-height: 1.6;
    margin: 0;
    color: var(--text-primary);
  }
  
  .source {
    margin: 0.75rem 0 0;
    font-size: 0.8rem;
    color: var(--text-secondary);
    text-align: right;
  }
  
  .refresh-btn {
    position: absolute;
    top: 1rem;
    right: 1rem;
    opacity: 0;
    transition: opacity 0.3s ease;
  }
  
  &:hover .refresh-btn {
    opacity: 1;
  }
}
</style> 