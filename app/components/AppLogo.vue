<script setup lang="ts">
import { computed, useId } from 'vue'

const props = withDefaults(
  defineProps<{
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
    showText?: boolean
    showTagline?: boolean
    iconOnly?: boolean
    animate?: boolean
    linkTo?: string | null
  }>(),
  {
    size: 'sm',
    showText: true,
    showTagline: false,
    iconOnly: false,
    animate: true,
    linkTo: '/'
  }
)

const rawId = useId()
const uniqueId = `wheel-logo-${rawId.replace(/[^a-zA-Z0-9_-]/g, '')}`

const sizeClasses = computed(() => {
  switch (props.size) {
    case 'xs':
      return {
        icon: 'w-7 h-7',
        text: 'text-sm font-black',
        tagline: 'text-[7px]',
        gap: 'gap-1.5'
      }
    case 'sm':
      return {
        icon: 'w-9 h-9',
        text: 'text-base md:text-lg font-black',
        tagline: 'text-[8px]',
        gap: 'gap-2'
      }
    case 'md':
      return {
        icon: 'w-11 h-11',
        text: 'text-lg md:text-xl font-black',
        tagline: 'text-[9px]',
        gap: 'gap-2.5'
      }
    case 'lg':
      return {
        icon: 'w-14 h-14',
        text: 'text-2xl md:text-3xl font-black',
        tagline: 'text-[10px]',
        gap: 'gap-3'
      }
    case 'xl':
      return {
        icon: 'w-20 h-20',
        text: 'text-3xl md:text-4xl font-black',
        tagline: 'text-xs',
        gap: 'gap-3.5'
      }
    default:
      return {
        icon: 'w-9 h-9',
        text: 'text-base font-black',
        tagline: 'text-[8px]',
        gap: 'gap-2'
      }
  }
})
</script>

<template>
  <NuxtLink
    v-if="linkTo"
    :to="linkTo"
    class="inline-flex items-center select-none group transition-all duration-300 outline-none focus:outline-none hover:opacity-95 cursor-pointer"
    :class="sizeClasses.gap"
  >
    <!-- Logo Icon: Lucky Wheel 'D' -->
    <div
      class="relative flex-shrink-0 flex items-center justify-center transition-transform duration-300 group-hover:scale-105"
      :class="sizeClasses.icon"
    >
      <svg
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        class="w-full h-full drop-shadow-md transition-all duration-300 group-hover:drop-shadow-[0_4px_12px_rgba(245,158,11,0.4)]"
      >
        <defs>
          <!-- Outer Rim Gold Gradient -->
          <linearGradient :id="`${uniqueId}-gold`" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#FDE047" />
            <stop offset="50%" stop-color="#F59E0B" />
            <stop offset="100%" stop-color="#D97706" />
          </linearGradient>

          <!-- Center Hub Dark Gradient -->
          <linearGradient :id="`${uniqueId}-hub`" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#1E293B" />
            <stop offset="100%" stop-color="#0B0F19" />
          </linearGradient>

          <!-- Letter D Gradient -->
          <linearGradient :id="`${uniqueId}-d`" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#FFFFFF" />
            <stop offset="100%" stop-color="#E2E8F0" />
          </linearGradient>
        </defs>

        <!-- ── 1. Outer Wheel Rim Background ── -->
        <circle cx="32" cy="34" r="26" fill="#0B0F19" />
        <circle cx="32" cy="34" r="25" :stroke="`url(#${uniqueId}-gold)`" stroke-width="2.5" fill="none" />

        <!-- ── 2. Spinning Lucky Wheel Slices (8 Segments) ── -->
        <g class="wheel-spinner transition-transform duration-700 ease-out origin-[32px_34px] group-hover:rotate-180">
          <!-- Slice 1 (Top-Right 1): Electric Blue -->
          <path d="M 32 34 L 32 11 A 23 23 0 0 1 48.26 17.74 Z" fill="#2563EB" />
          <!-- Slice 2 (Top-Right 2): Cyber Purple -->
          <path d="M 32 34 L 48.26 17.74 A 23 23 0 0 1 55 34 Z" fill="#7C3AED" />
          <!-- Slice 3 (Bottom-Right 1): Hot Magenta -->
          <path d="M 32 34 L 55 34 A 23 23 0 0 1 48.26 50.26 Z" fill="#EC4899" />
          <!-- Slice 4 (Bottom-Right 2): Sunset Orange -->
          <path d="M 32 34 L 48.26 50.26 A 23 23 0 0 1 32 57 Z" fill="#F97316" />
          <!-- Slice 5 (Bottom-Left 1): Emerald Green -->
          <path d="M 32 34 L 32 57 A 23 23 0 0 1 15.74 50.26 Z" fill="#10B981" />
          <!-- Slice 6 (Bottom-Left 2): Aqua Cyan -->
          <path d="M 32 34 L 15.74 50.26 A 23 23 0 0 1 9 34 Z" fill="#06B6D4" />
          <!-- Slice 7 (Top-Left 1): Royal Indigo -->
          <path d="M 32 34 L 9 34 A 23 23 0 0 1 15.74 17.74 Z" fill="#4F46E5" />
          <!-- Slice 8 (Top-Left 2): Sky Blue -->
          <path d="M 32 34 L 15.74 17.74 A 23 23 0 0 1 32 11 Z" fill="#0EA5E9" />

          <!-- White Divider Spokes -->
          <line x1="32" y1="34" x2="32" y2="11" stroke="#FFFFFF" stroke-width="1.2" opacity="0.65" />
          <line x1="32" y1="34" x2="48.26" y2="17.74" stroke="#FFFFFF" stroke-width="1.2" opacity="0.65" />
          <line x1="32" y1="34" x2="55" y2="34" stroke="#FFFFFF" stroke-width="1.2" opacity="0.65" />
          <line x1="32" y1="34" x2="48.26" y2="50.26" stroke="#FFFFFF" stroke-width="1.2" opacity="0.65" />
          <line x1="32" y1="34" x2="32" y2="57" stroke="#FFFFFF" stroke-width="1.2" opacity="0.65" />
          <line x1="32" y1="34" x2="15.74" y2="50.26" stroke="#FFFFFF" stroke-width="1.2" opacity="0.65" />
          <line x1="32" y1="34" x2="9" y2="34" stroke="#FFFFFF" stroke-width="1.2" opacity="0.65" />
          <line x1="32" y1="34" x2="15.74" y2="17.74" stroke="#FFFFFF" stroke-width="1.2" opacity="0.65" />

          <!-- Perimeter Pegs -->
          <circle cx="32" cy="12" r="1.3" fill="#FFFFFF" />
          <circle cx="47.6" cy="18.4" r="1.3" fill="#FFFFFF" />
          <circle cx="54" cy="34" r="1.3" fill="#FFFFFF" />
          <circle cx="47.6" cy="49.6" r="1.3" fill="#FFFFFF" />
          <circle cx="32" cy="56" r="1.3" fill="#FFFFFF" />
          <circle cx="16.4" cy="49.6" r="1.3" fill="#FFFFFF" />
          <circle cx="10" cy="34" r="1.3" fill="#FFFFFF" />
          <circle cx="16.4" cy="18.4" r="1.3" fill="#FFFFFF" />
        </g>

        <!-- ── 3. Center Hub with Letter 'D' ── -->
        <circle
          cx="32"
          cy="34"
          r="12.5"
          :fill="`url(#${uniqueId}-hub)`"
          :stroke="`url(#${uniqueId}-gold)`"
          stroke-width="2"
        />
        <!-- Bold Letter 'D' in the Center -->
        <text
          x="32"
          y="39.5"
          font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
          font-size="15"
          font-weight="900"
          text-anchor="middle"
          :fill="`url(#${uniqueId}-d)`"
          letter-spacing="-0.5"
        >
          D
        </text>

        <!-- ── 4. Golden Pointer at Top ── -->
        <g class="transition-transform duration-200 group-hover:-translate-y-0.5">
          <path
            d="M 27.5 4 L 36.5 4 L 32 14 Z"
            :fill="`url(#${uniqueId}-gold)`"
            stroke="#0F172A"
            stroke-width="1"
          />
          <circle cx="32" cy="5" r="1.5" fill="#FFFFFF" />
        </g>
      </svg>
    </div>

    <!-- Text & Branding -->
    <div v-if="!iconOnly && showText" class="flex flex-col leading-none">
      <div class="tracking-tight flex items-center gap-1" :class="sizeClasses.text">
        <span class="text-slate-900 dark:text-white transition-colors duration-200">DIP</span>
        <span class="text-amber-500 dark:text-amber-400 font-extrabold text-[0.85em]">&amp;</span>
        <span class="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 dark:from-blue-400 dark:via-indigo-300 dark:to-cyan-400 bg-clip-text text-transparent transition-all duration-200">
          DRIP
        </span>
      </div>

      <!-- Tagline / Subtitle -->
      <span
        v-if="showTagline"
        class="font-mono font-bold tracking-widest text-slate-400 dark:text-slate-500 uppercase mt-1 transition-colors duration-200"
        :class="sizeClasses.tagline"
      >
        Streetwear &amp; Lucky Box
      </span>
    </div>
  </NuxtLink>

  <!-- Non-clickable version when linkTo is null or false -->
  <div
    v-else
    class="inline-flex items-center select-none group transition-all duration-300"
    :class="sizeClasses.gap"
  >
    <!-- Logo Icon: Lucky Wheel 'D' -->
    <div
      class="relative flex-shrink-0 flex items-center justify-center"
      :class="sizeClasses.icon"
    >
      <svg
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        class="w-full h-full drop-shadow-md"
      >
        <defs>
          <linearGradient :id="`${uniqueId}-gold-static`" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#FDE047" />
            <stop offset="50%" stop-color="#F59E0B" />
            <stop offset="100%" stop-color="#D97706" />
          </linearGradient>

          <linearGradient :id="`${uniqueId}-hub-static`" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#1E293B" />
            <stop offset="100%" stop-color="#0B0F19" />
          </linearGradient>

          <linearGradient :id="`${uniqueId}-d-static`" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#FFFFFF" />
            <stop offset="100%" stop-color="#E2E8F0" />
          </linearGradient>
        </defs>

        <circle cx="32" cy="34" r="26" fill="#0B0F19" />
        <circle cx="32" cy="34" r="25" :stroke="`url(#${uniqueId}-gold-static)`" stroke-width="2.5" fill="none" />

        <g>
          <path d="M 32 34 L 32 11 A 23 23 0 0 1 48.26 17.74 Z" fill="#2563EB" />
          <path d="M 32 34 L 48.26 17.74 A 23 23 0 0 1 55 34 Z" fill="#7C3AED" />
          <path d="M 32 34 L 55 34 A 23 23 0 0 1 48.26 50.26 Z" fill="#EC4899" />
          <path d="M 32 34 L 48.26 50.26 A 23 23 0 0 1 32 57 Z" fill="#F97316" />
          <path d="M 32 34 L 32 57 A 23 23 0 0 1 15.74 50.26 Z" fill="#10B981" />
          <path d="M 32 34 L 15.74 50.26 A 23 23 0 0 1 9 34 Z" fill="#06B6D4" />
          <path d="M 32 34 L 9 34 A 23 23 0 0 1 15.74 17.74 Z" fill="#4F46E5" />
          <path d="M 32 34 L 15.74 17.74 A 23 23 0 0 1 32 11 Z" fill="#0EA5E9" />

          <line x1="32" y1="34" x2="32" y2="11" stroke="#FFFFFF" stroke-width="1.2" opacity="0.65" />
          <line x1="32" y1="34" x2="48.26" y2="17.74" stroke="#FFFFFF" stroke-width="1.2" opacity="0.65" />
          <line x1="32" y1="34" x2="55" y2="34" stroke="#FFFFFF" stroke-width="1.2" opacity="0.65" />
          <line x1="32" y1="34" x2="48.26" y2="50.26" stroke="#FFFFFF" stroke-width="1.2" opacity="0.65" />
          <line x1="32" y1="34" x2="32" y2="57" stroke="#FFFFFF" stroke-width="1.2" opacity="0.65" />
          <line x1="32" y1="34" x2="15.74" y2="50.26" stroke="#FFFFFF" stroke-width="1.2" opacity="0.65" />
          <line x1="32" y1="34" x2="9" y2="34" stroke="#FFFFFF" stroke-width="1.2" opacity="0.65" />
          <line x1="32" y1="34" x2="15.74" y2="17.74" stroke="#FFFFFF" stroke-width="1.2" opacity="0.65" />

          <circle cx="32" cy="12" r="1.3" fill="#FFFFFF" />
          <circle cx="47.6" cy="18.4" r="1.3" fill="#FFFFFF" />
          <circle cx="54" cy="34" r="1.3" fill="#FFFFFF" />
          <circle cx="47.6" cy="49.6" r="1.3" fill="#FFFFFF" />
          <circle cx="32" cy="56" r="1.3" fill="#FFFFFF" />
          <circle cx="16.4" cy="49.6" r="1.3" fill="#FFFFFF" />
          <circle cx="10" cy="34" r="1.3" fill="#FFFFFF" />
          <circle cx="16.4" cy="18.4" r="1.3" fill="#FFFFFF" />
        </g>

        <circle cx="32" cy="34" r="12.5" :fill="`url(#${uniqueId}-hub-static)`" :stroke="`url(#${uniqueId}-gold-static)`" stroke-width="2" />
        <text x="32" y="39.5" font-family="system-ui, -apple-system, sans-serif" font-size="15" font-weight="900" text-anchor="middle" :fill="`url(#${uniqueId}-d-static)`" letter-spacing="-0.5">D</text>

        <g>
          <path d="M 27.5 4 L 36.5 4 L 32 14 Z" :fill="`url(#${uniqueId}-gold-static)`" stroke="#0F172A" stroke-width="1" />
          <circle cx="32" cy="5" r="1.5" fill="#FFFFFF" />
        </g>
      </svg>
    </div>

    <!-- Text & Branding -->
    <div v-if="!iconOnly && showText" class="flex flex-col leading-none">
      <div class="tracking-tight flex items-center gap-1" :class="sizeClasses.text">
        <span class="text-slate-900 dark:text-white transition-colors duration-200">DIP</span>
        <span class="text-amber-500 dark:text-amber-400 font-extrabold text-[0.85em]">&amp;</span>
        <span class="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 dark:from-blue-400 dark:via-indigo-300 dark:to-cyan-400 bg-clip-text text-transparent transition-all duration-200">
          DRIP
        </span>
      </div>

      <span
        v-if="showTagline"
        class="font-mono font-bold tracking-widest text-slate-400 dark:text-slate-500 uppercase mt-1 transition-colors duration-200"
        :class="sizeClasses.tagline"
      >
        Streetwear &amp; Lucky Box
      </span>
    </div>
  </div>
</template>
