<template>
  <div class="bg-white dark:bg-[#191919] border border-slate-200 dark:border-[#212327] rounded-2xl overflow-hidden shadow-sm">
    <!-- Table Header Skeleton -->
    <div class="p-4 border-b border-slate-200 dark:border-[#212327] flex items-center justify-between gap-4 bg-slate-50/50 dark:bg-[#0a0a0a]">
      <AppSkeleton width="160px" height="18px" />
      <AppSkeleton width="100px" height="32px" rounded="full" />
    </div>

    <!-- Table Rows -->
    <div class="divide-y divide-slate-100 dark:divide-[#212327]">
      <div v-for="i in rows" :key="i" class="p-4 flex items-center justify-between gap-4">
        <div class="flex items-center gap-3 flex-1 min-w-0">
          <AppSkeleton width="36px" height="36px" variant="circle" />
          <div class="space-y-1.5 flex-1 max-w-sm">
            <AppSkeleton width="75%" height="14px" />
            <AppSkeleton width="45%" height="11px" />
          </div>
        </div>
        <AppSkeleton width="80px" height="16px" />
        <AppSkeleton width="60px" height="24px" variant="badge" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ rows?: number }>(), { rows: 5 })
</script>
