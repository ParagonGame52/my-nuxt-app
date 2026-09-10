<script setup lang="ts">
defineProps<{
  modelValue: string | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', val: string | null): void
}>()

function close() {
  emit('update:modelValue', null)
}
</script>

<template>
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
        v-if="modelValue"
        class="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
        @click.self="close"
      >
        <button
          @click="close"
          class="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition cursor-pointer"
        >
          <Icon name="lucide:x" class="w-5 h-5" />
        </button>
        <img
          :src="modelValue"
          class="max-w-full max-h-[90vh] rounded-2xl shadow-2xl object-contain"
          alt="preview"
        />
      </div>
    </Transition>
  </Teleport>
</template>
