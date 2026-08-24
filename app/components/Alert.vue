<template>
  <div
    class="flex items-center gap-3 p-4 rounded-lg bg-[#191919] border border-[#212327] text-[#dadbdf] text-sm leading-relaxed transition-colors"
    :class="borderClass"
  >
    <slot></slot>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps({
  variant: {
    type: String as () => 'info' | 'warning' | 'error' | 'success',
    default: 'info'
  }
})

const borderClass = computed(() => {
  switch (props.variant) {
    case 'warning':
      return 'border-l-4 border-l-[#ff7a17]'
    case 'error':
      return 'border-l-4 border-l-rose-500'
    case 'success':
      return 'border-l-4 border-l-emerald-500'
    case 'info':
    default:
      return 'border-l-4 border-l-[#a0c3ec]'
  }
})
</script>