<template>
  <div class="about-container">
    <div class="main-layout">
      <div class="content-section">
        <div class="markdown-content" v-html="markdownContent"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { marked } from 'marked'
import aboutMd from '../assets/about.md?raw'

const markdownContent = ref('')

onMounted(() => {
  markdownContent.value = marked(aboutMd)
})
</script>

<style lang="scss" scoped>
.about-container {
  padding: 2rem 1.5rem;
}

.main-layout {
  max-width: 1400px;
  margin: 0 auto;
}

.content-section {
  background: var(--bg-primary);
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  padding: 2rem;
}

.markdown-content {
  :deep(h1) {
    font-size: 2rem;
    margin-bottom: 1.5rem;
    color: var(--text-primary);
  }

  :deep(h2) {
    font-size: 1.5rem;
    margin: 2rem 0 1rem;
    color: var(--text-primary);
  }

  :deep(p) {
    margin: 1rem 0;
    line-height: 1.6;
    color: var(--text-primary);
  }

  :deep(ul) {
    margin: 1rem 0;
    padding-left: 1.5rem;

    li {
      margin: 0.5rem 0;
      color: var(--text-primary);
    }
  }
}

@media (max-width: 768px) {
  .about-container {
    padding: 1rem;
  }

  .content-section {
    padding: 1.5rem;
  }
}
</style> 