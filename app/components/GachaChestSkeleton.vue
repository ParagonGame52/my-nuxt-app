<template>
  <div class="bg-white dark:bg-[#191919] border border-slate-200 dark:border-[#212327] rounded-3xl p-6 shadow-sm space-y-5 flex flex-col items-center">
    <!-- Chest Image Skeleton -->
    <div class="w-36 h-36 rounded-2xl overflow-hidden relative">
      <AppSkeleton height="100%" width="100%" rounded="2xl" />
    </div>

    <!-- Info Skeleton -->
    <div class="w-full space-y-2 text-center flex flex-col items-center">
      <AppSkeleton width="70%" height="18px" />
      <AppSkeleton width="40%" height="14px" />
    </div>

    <!-- Prize counter + Price -->
    <div class="w-full pt-3 border-t border-slate-100 dark:border-[#212327] flex items-center justify-between">
      <AppSkeleton width="70px" height="14px" />
      <AppSkeleton width="80px" height="24px" />
    </div>

    <!-- Roll Button -->
    <AppSkeleton width="100%" height="44px" rounded="full" />
  </div>
</template>
