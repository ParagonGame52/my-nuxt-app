<script setup lang="ts">
import { useConfirm } from '~/composables/useConfirm'

const { visible, options, accept, reject } = useConfirm()

// Color map for button accent per type — matches DESIGN.md accent tokens
const typeConfig = computed(() => {
  switch (options.value.type) {
    case 'danger':
      return {
        icon: 'lucide:alert-triangle',
        iconColor: 'text-rose-400',
        confirmBg: 'bg-rose-600 hover:bg-rose-500',
        confirmBorder: 'border-rose-600',
      }
    case 'warning':
      return {
        icon: 'lucide:alert-triangle',
        iconColor: 'text-[#ff7a17]',
        confirmBg: 'bg-[#ff7a17] hover:bg-[#e86d10]',
        confirmBorder: 'border-[#ff7a17]',
      }
    case 'info':
    default:
      return {
        icon: 'lucide:info',
        iconColor: 'text-[#a0c3ec]',
        confirmBg: 'bg-white hover:bg-[#fafaf7]',
        confirmBorder: 'border-white',
      }
  }
})
</script>

<template>
  <!-- Global Confirm Dialog — styled per DESIGN.md ex-modal-card -->
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="visible"
        class="fixed inset-0 z-[9999] flex items-center justify-center p-4"
        @click.self="reject"
      >
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/70 backdrop-blur-sm" @click="reject" />

        <!-- Modal Card — canvas surface, hairline border, 8px radius -->
        <Transition
          enter-active-class="transition duration-200 ease-out"
          enter-from-class="opacity-0 scale-95"
          enter-to-class="opacity-100 scale-100"
          leave-active-class="transition duration-150 ease-in"
          leave-from-class="opacity-100 scale-100"
          leave-to-class="opacity-0 scale-95"
        >
          <div
            v-if="visible"
            class="relative w-full max-w-sm bg-[#0a0a0a] border border-[#212327] rounded-lg shadow-2xl overflow-hidden"
          >
            <div class="p-6 space-y-4">
              <!-- Icon + Title -->
              <div class="flex items-start gap-3">
                <div class="flex-shrink-0 mt-0.5">
                  <Icon :name="typeConfig.icon" class="w-5 h-5" :class="typeConfig.iconColor" />
                </div>
                <div class="flex-1 min-w-0 space-y-1.5">
                  <h3 class="text-sm font-medium text-white leading-snug">
                    {{ options.title }}
                  </h3>
                  <p v-if="options.message" class="text-sm text-[#7d8187] leading-relaxed">
                    {{ options.message }}
                  </p>
                </div>
              </div>

              <!-- Hairline divider -->
              <div class="border-t border-[#212327]" />

              <!-- Actions — pill outline buttons per DESIGN.md -->
              <div class="flex items-center justify-end gap-2">
                <!-- Cancel: button-outline-sm -->
                <button
                  @click="reject"
                  class="inline-flex items-center px-4 py-1.5 text-sm text-white bg-[#0a0a0a] border border-[#212327] rounded-full transition duration-150 hover:border-white/30"
                >
                  {{ options.cancelText }}
                </button>

                <!-- Confirm: filled pill for danger/warning, outline for info -->
                <button
                  @click="accept"
                  class="inline-flex items-center px-4 py-1.5 text-sm font-medium rounded-full border transition duration-150"
                  :class="[typeConfig.confirmBg, typeConfig.confirmBorder,
                    options.type === 'info' ? 'text-[#0a0a0a]' : 'text-white'
                  ]"
                >
                  {{ options.confirmText }}
                </button>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>
