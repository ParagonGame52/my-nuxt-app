<template>
  <div class="min-h-screen py-10 transition-colors duration-300">
    <div class="max-w-7xl mx-auto px-4">
      <div class="bg-white dark:bg-[#191919] rounded-3xl shadow-sm border border-slate-200 dark:border-[#212327] p-8 md:p-12 max-w-3xl mx-auto transition-colors duration-300">
        
        <div class="text-center mb-8 flex flex-col items-center">
          <AppLogo size="xl" :showTagline="true" linkTo="/" class="mb-4" />
          <h1 class="text-xl md:text-2xl font-black text-slate-800 dark:text-white mt-1 tracking-tight">
            เกี่ยวกับแบรนด์ <span class="text-blue-600 dark:text-blue-400">DIP &amp; DRIP</span>
          </h1>
        </div>

        <div class="space-y-6 text-slate-600 dark:text-slate-400 text-sm leading-loose">
          <p>
            ยินดีต้อนรับสู่ <strong class="text-slate-800 dark:text-slate-200 font-black">DIP & DRIP</strong> แพลตฟอร์มจำหน่ายเสื้อผ้าแฟชั่นนำเข้าคุณภาพพรีเมียม และตู้สุ่มชุดแฟชั่นสุดฮิตอันดับ 1 ของไทย เราคัดสรรเสื้อผ้าสไตล์ Streetwear, Minimal, และ Vintage จากทั่วโลกมาให้คุณ
          </p>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 rounded-2xl p-4 text-center">
              <div class="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-2">
                <Icon name="lucide:check-circle-2" class="w-5 h-5" />
              </div>
              <p class="font-black text-slate-800 dark:text-slate-200 text-sm">สินค้าแท้ 100%</p>
              <p class="text-xs text-slate-500 dark:text-slate-500 mt-1">คัดสรรจากแหล่งผู้ผลิตโดยตรง</p>
            </div>
            <div class="bg-pink-50 dark:bg-pink-950/30 border border-pink-100 dark:border-pink-900/50 rounded-2xl p-4 text-center">
              <div class="w-10 h-10 rounded-xl bg-pink-100 dark:bg-pink-900/50 text-pink-600 dark:text-pink-400 flex items-center justify-center mx-auto mb-2">
                <Icon name="lucide:zap" class="w-5 h-5" />
              </div>
              <p class="font-black text-slate-800 dark:text-slate-200 text-sm">จัดส่งไวใน 24 ชม.</p>
              <p class="text-xs text-slate-500 dark:text-slate-500 mt-1">บริการจัดส่งทั่วประเทศไทย</p>
            </div>
            <div class="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 rounded-2xl p-4 text-center">
              <div class="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-2">
                <Icon name="lucide:dice-5" class="w-5 h-5" />
              </div>
              <p class="font-black text-slate-800 dark:text-slate-200 text-sm">ตู้สุ่มสุดคุ้ม</p>
              <p class="text-xs text-slate-500 dark:text-slate-500 mt-1">ลุ้นรับชุดราคาสูงสุดทุกกล่อง</p>
            </div>
          </div>

          <p>
            ระบบของเราพัฒนาขึ้นเพื่อให้ประสบการณ์การช้อปปิ้งออนไลน์เป็นเรื่องสนุกและตื่นเต้น ไม่ว่าจะเป็นการเลือกซื้อสินค้าตามปกติหรือลุ้นโชคผ่านตู้สุ่ม Lucky Box ที่มีของรางวัลสุดพิเศษรอคุณอยู่
          </p>
        </div>
        
      </div>
    </div>
  </div>
</template>