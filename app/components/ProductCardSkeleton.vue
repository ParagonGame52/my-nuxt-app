<template>
  <div class="bg-white dark:bg-[#191919] border border-slate-200 dark:border-[#212327] rounded-2xl overflow-hidden shadow-sm flex flex-col p-3 space-y-3">
    <!-- Image Box -->
    <div class="relative w-full aspect-square rounded-xl overflow-hidden bg-slate-100 dark:bg-[#0a0a0a] border border-slate-200/60 dark:border-[#212327]">
      <AppSkeleton height="100%" width="100%" rounded="none" />
      <div class="absolute top-2 left-2">
        <AppSkeleton width="50px" height="18px" variant="badge" />
      </div>
    </div>

    <!-- Content -->
    <div class="space-y-2 flex-1 flex flex-col justify-between pt-1">
      <div class="space-y-1.5">
        <AppSkeleton width="85%" height="14px" />
        <AppSkeleton width="60%" height="12px" />
      </div>

      <div class="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-[#212327]">
        <AppSkeleton width="60px" height="18px" />
        <AppSkeleton width="32px" height="32px" variant="circle" />
      </div>
    </div>
  </div>
</template>
