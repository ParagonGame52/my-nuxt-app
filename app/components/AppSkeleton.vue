<template>
  <div
    :class="[
      'relative overflow-hidden bg-slate-200/80 dark:bg-[#1a1c20] border border-slate-300/40 dark:border-[#212327]',
      roundedClass,
      animationClass,
      customClass
    ]"
    :style="computedStyle"
    aria-hidden="true"
  >
    <!-- Shimmer highlight wave -->
    <div
      class="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 dark:via-white/[0.04] to-transparent animate-shimmer"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    width?: string
    height?: string
    variant?: 'text' | 'rect' | 'circle' | 'card' | 'button' | 'badge' | 'avatar'
    rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full'
    animate?: boolean
    class?: string
  }>(),
  {
    width: undefined,
    height: undefined,
    variant: 'text',
    rounded: 'lg',
    animate: true,
    class: ''
  }
)

const customClass = computed(() => props.class || '')

const roundedClass = computed(() => {
  if (props.variant === 'circle' || props.variant === 'avatar') return 'rounded-full'
  if (props.variant === 'badge' || props.variant === 'button') return 'rounded-full'
  switch (props.rounded) {
    case 'none': return 'rounded-none'
    case 'sm': return 'rounded-sm'
    case 'md': return 'rounded-md'
    case 'lg': return 'rounded-lg'
    case 'xl': return 'rounded-xl'
    case '2xl': return 'rounded-2xl'
    case '3xl': return 'rounded-3xl'
    case 'full': return 'rounded-full'
    default: return 'rounded-lg'
  }
})

const animationClass = computed(() => {
  return props.animate ? 'animate-pulse' : ''
})

const computedStyle = computed(() => {
  const style: Record<string, string> = {}

  if (props.width) style.width = props.width
  if (props.height) style.height = props.height

  if (!props.height) {
    if (props.variant === 'text') style.height = '1rem'
    else if (props.variant === 'badge') style.height = '1.5rem'
    else if (props.variant === 'button') style.height = '2.5rem'
    else if (props.variant === 'circle' || props.variant === 'avatar') {
      style.height = props.width || '2.5rem'
      style.width = props.width || '2.5rem'
    }
  }

  return style
})
</script>

<style scoped>
@keyframes shimmer {
  100% {
    transform: translateX(100%);
  }
}
.animate-shimmer {
  animation: shimmer 1.8s infinite;
}
</style>
