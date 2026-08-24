<script setup lang="ts">
const props = defineProps<{
  modelValue: boolean
  isPromoEdit: boolean
  promoForm: {
    title: string
    description: string
    image: string
    badge: string
    discount_mode: 'percent' | 'fixed' | 'free'
    discount_val: number
    discount_text: string
    start_date: string
    end_date: string
    is_active: number
    target_category: string
    promo_type: 'product' | 'shipping'
    min_spend: number
  }
  actionLoading: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void
  (e: 'submit'): void
  (e: 'sync-discount'): void
  (e: 'set-duration', minutes: number): void
}>()

function close() {
  emit('update:modelValue', false)
}
</script>

<template>
  <div v-if="modelValue" class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
    <div class="bg-white dark:bg-[#191919] border border-slate-200 dark:border-[#212327] rounded-3xl w-full max-w-lg shadow-2xl p-6 md:p-8 max-h-[90vh] overflow-y-auto space-y-5">
      
      <!-- Modal Header -->
      <div class="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-[#212327]">
        <h2 class="text-base font-black text-slate-800 dark:text-white">{{ isPromoEdit ? "แก้ไขโปรโมชั่น" : "เพิ่มโปรโมชั่นใหม่" }}</h2>
        <button @click="close" class="text-slate-400 hover:text-slate-200 transition p-1 rounded-lg cursor-pointer">
          <Icon name="lucide:x" class="w-5 h-5" />
        </button>
      </div>

      <form @submit.prevent="emit('submit')" class="space-y-4 text-xs font-semibold text-slate-700 dark:text-slate-300">
        <!-- Title -->
        <div class="space-y-1.5">
          <label class="block font-bold">หัวข้อโปรโมชั่น *</label>
          <input v-model="promoForm.title" type="text" placeholder="เช่น Flash Sale ลด 30%!" class="w-full bg-slate-50 dark:bg-[#0a0a0a] border border-slate-200 dark:border-[#212327] rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-pink-500 transition" />
        </div>

        <!-- Description -->
        <div class="space-y-1.5">
          <label class="block font-bold">รายละเอียด *</label>
          <textarea v-model="promoForm.description" rows="3" placeholder="อธิบายโปรโมชั่นอย่างละเอียด..." class="w-full bg-slate-50 dark:bg-[#0a0a0a] border border-slate-200 dark:border-[#212327] rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-pink-500 transition resize-none" />
        </div>

        <!-- Image URL -->
        <div class="space-y-1.5">
          <label class="block font-bold">ลิงก์รูปภาพ (URL)</label>
          <input v-model="promoForm.image" type="text" placeholder="https://..." class="w-full bg-slate-50 dark:bg-[#0a0a0a] border border-slate-200 dark:border-[#212327] rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-pink-500 transition" />
          <!-- Image preview -->
          <div v-if="promoForm.image" class="mt-2 h-28 rounded-xl overflow-hidden bg-slate-100 dark:bg-[#191919] border border-slate-200 dark:border-[#212327]">
            <img :src="promoForm.image" alt="preview" class="w-full h-full object-cover" />
          </div>
        </div>

        <!-- Promo Type, Target Category & Min Spend -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-slate-50 dark:bg-[#0a0a0a] rounded-2xl border border-slate-200 dark:border-[#212327]">
          <div class="space-y-1">
            <label class="block font-bold text-[11px]">ประเภทโปรโมชั่น</label>
            <select v-model="promoForm.promo_type" class="w-full bg-white dark:bg-[#191919] border border-slate-200 dark:border-[#212327] rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-pink-500 transition cursor-pointer">
              <option value="product">ส่วนลดสินค้า</option>
              <option value="shipping">ลดค่าจัดส่ง / ฟรีค่าส่ง</option>
            </select>
          </div>
          <div class="space-y-1">
            <label class="block font-bold text-[11px]">หมวดหมู่สินค้าที่ลด</label>
            <select :disabled="promoForm.promo_type === 'shipping'" v-model="promoForm.target_category" class="w-full bg-white dark:bg-[#191919] border border-slate-200 dark:border-[#212327] rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-pink-500 transition disabled:opacity-40 cursor-pointer">
              <option value="ALL">ทุกหมวดหมู่ (ALL)</option>
              <option value="STREETWEAR">STREETWEAR</option>
              <option value="MINIMAL">MINIMAL</option>
              <option value="KOREAN">KOREAN</option>
              <option value="VINTAGE">VINTAGE</option>
              <option value="ACCESSORIES">ACCESSORIES</option>
            </select>
          </div>
          <div class="space-y-1">
            <label class="block font-bold text-[11px]">ยอดซื้อขั้นต่ำ (฿)</label>
            <input v-model="promoForm.min_spend" type="number" min="0" placeholder="0 = ไม่มีขั้นต่ำ" class="w-full bg-white dark:bg-[#191919] border border-slate-200 dark:border-[#212327] rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-pink-500 transition" />
          </div>
        </div>

        <!-- Badge -->
        <div class="space-y-1.5">
          <label class="block font-bold">ป้ายกำกับ (Badge)</label>
          <select v-model="promoForm.badge" class="w-full bg-slate-50 dark:bg-[#0a0a0a] border border-slate-200 dark:border-[#212327] rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-pink-500 transition cursor-pointer">
            <option>โปรโมชั่น</option>
            <option>Flash Sale</option>
            <option>Buy 2 Get 1</option>
            <option>New Collection</option>
            <option>Clearance</option>
            <option>Limited</option>
          </select>
        </div>

        <!-- Discount Settings: Percentage (%) vs Amount (฿) vs Free Shipping -->
        <div class="p-4 bg-slate-50 dark:bg-[#0a0a0a] rounded-2xl border border-slate-200 dark:border-[#212327] space-y-3">
          <div class="flex items-center justify-between flex-wrap gap-2">
            <label class="block font-bold text-xs text-slate-800 dark:text-slate-200">
              กำหนดส่วนลด (ลดเป็น % หรือ บาท)
            </label>
            <!-- Unit Selector Tabs -->
            <div class="flex bg-slate-200/70 dark:bg-[#191919] p-1 rounded-xl border border-slate-200 dark:border-[#212327] text-xs">
              <button
                type="button"
                @click="promoForm.discount_mode = 'percent'; emit('sync-discount')"
                :class="promoForm.discount_mode === 'percent' ? 'bg-pink-600 text-white shadow-sm font-black' : 'text-slate-600 dark:text-slate-400 font-bold'"
                class="px-3 py-1 rounded-lg transition flex items-center gap-1 cursor-pointer"
              >
                <span>% เปอร์เซ็นต์</span>
              </button>
              <button
                type="button"
                @click="promoForm.discount_mode = 'fixed'; emit('sync-discount')"
                :class="promoForm.discount_mode === 'fixed' ? 'bg-pink-600 text-white shadow-sm font-black' : 'text-slate-600 dark:text-slate-400 font-bold'"
                class="px-3 py-1 rounded-lg transition flex items-center gap-1 cursor-pointer"
              >
                <span>฿ บาท</span>
              </button>
              <button
                v-if="promoForm.promo_type === 'shipping'"
                type="button"
                @click="promoForm.discount_mode = 'free'; emit('sync-discount')"
                :class="promoForm.discount_mode === 'free' ? 'bg-emerald-600 text-white shadow-sm font-black' : 'text-slate-600 dark:text-slate-400 font-bold'"
                class="px-3 py-1 rounded-lg transition flex items-center gap-1 cursor-pointer"
              >
                <span>ฟรีค่าส่ง</span>
              </button>
            </div>
          </div>

          <!-- Value Input and Quick Presets -->
          <div v-if="promoForm.discount_mode !== 'free'" class="space-y-2">
            <div class="flex items-center gap-2">
              <div class="relative flex-1">
                <input
                  v-model.number="promoForm.discount_val"
                  @input="emit('sync-discount')"
                  type="number"
                  min="1"
                  :max="promoForm.discount_mode === 'percent' ? 100 : 99999"
                  :placeholder="promoForm.discount_mode === 'percent' ? 'ระบุตัวเลข % เช่น 20, 30, 50' : 'ระบุจำนวนเงิน เช่น 30, 50, 100'"
                  class="w-full bg-white dark:bg-[#191919] border border-slate-200 dark:border-[#212327] rounded-xl pl-4 pr-12 py-2.5 text-xs font-black text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500 transition"
                />
                <span class="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-black text-pink-500">
                  {{ promoForm.discount_mode === 'percent' ? '%' : 'บาท' }}
                </span>
              </div>
            </div>

            <!-- Quick Presets -->
            <div class="flex flex-wrap items-center gap-1.5 pt-1">
              <span class="text-[10px] text-slate-400 font-bold mr-1">ปุ่มลัด:</span>
              <template v-if="promoForm.discount_mode === 'percent'">
                <button
                  v-for="pct in [5, 10, 15, 20, 25, 30, 50, 70, 90]"
                  :key="pct"
                  type="button"
                  @click="promoForm.discount_val = pct; emit('sync-discount')"
                  :class="promoForm.discount_val === pct ? 'bg-pink-500 text-white font-black' : 'bg-white dark:bg-[#191919] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-[#212327]'"
                  class="px-2.5 py-1 rounded-lg text-[10px] transition hover:border-pink-400 cursor-pointer"
                >
                  {{ pct }}%
                </button>
              </template>
              <template v-else>
                <button
                  v-for="amt in [20, 30, 50, 100, 200, 500]"
                  :key="amt"
                  type="button"
                  @click="promoForm.discount_val = amt; emit('sync-discount')"
                  :class="promoForm.discount_val === amt ? 'bg-pink-500 text-white font-black' : 'bg-white dark:bg-[#191919] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-[#212327]'"
                  class="px-2.5 py-1 rounded-lg text-[10px] transition hover:border-pink-400 cursor-pointer"
                >
                  ฿{{ amt }}
                </button>
              </template>
            </div>
          </div>

          <!-- Custom Text / Preview -->
          <div class="pt-2 border-t border-slate-200/60 dark:border-[#212327]">
            <div class="flex items-center justify-between mb-1">
              <label class="block text-[10px] font-bold text-slate-400">ข้อความที่จะแสดงบนป้ายโปรโมชั่น (แก้ไขข้อความได้)</label>
              <span class="text-[10px] font-black text-pink-500 bg-pink-50 dark:bg-pink-950/40 px-2 py-0.5 rounded-md border border-pink-200/50">
                ตัวอย่าง: {{ promoForm.discount_text || '-' }}
              </span>
            </div>
            <input
              v-model="promoForm.discount_text"
              type="text"
              class="w-full bg-white dark:bg-[#191919] border border-slate-200 dark:border-[#212327] rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500 transition"
            />
          </div>
        </div>

        <!-- Date and Time range with Quick Presets -->
        <div class="space-y-2.5">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="space-y-1.5">
              <label class="block font-bold">วันและเวลาเริ่มต้น</label>
              <input v-model="promoForm.start_date" type="datetime-local" class="w-full bg-slate-50 dark:bg-[#0a0a0a] border border-slate-200 dark:border-[#212327] rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-pink-500 transition text-xs font-bold" />
            </div>
            <div class="space-y-1.5">
              <label class="block font-bold">วันและเวลาสิ้นสุด (หมดอายุ)</label>
              <input v-model="promoForm.end_date" type="datetime-local" class="w-full bg-slate-50 dark:bg-[#0a0a0a] border border-slate-200 dark:border-[#212327] rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-pink-500 transition text-xs font-bold" />
            </div>
          </div>

          <!-- Quick Duration Presets for Flash Sales -->
          <div class="p-3 bg-slate-50 dark:bg-[#0a0a0a] rounded-2xl border border-slate-200/60 dark:border-[#212327] space-y-1.5">
            <span class="text-[10px] text-slate-500 dark:text-slate-400 font-bold block">ปุ่มลัดตั้งเวลาด่วน (นับจากตอนนี้):</span>
            <div class="flex flex-wrap items-center gap-1.5">
              <button type="button" @click="emit('set-duration', 10)" class="px-2.5 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/30 rounded-lg text-[10px] font-black transition cursor-pointer">
                10 นาที (Flash)
              </button>
              <button type="button" @click="emit('set-duration', 20)" class="px-2.5 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/30 rounded-lg text-[10px] font-black transition cursor-pointer">
                20 นาที
              </button>
              <button type="button" @click="emit('set-duration', 30)" class="px-2.5 py-1 bg-pink-500/10 hover:bg-pink-500/20 text-pink-600 dark:text-pink-400 border border-pink-500/30 rounded-lg text-[10px] font-black transition cursor-pointer">
                30 นาที
              </button>
              <button type="button" @click="emit('set-duration', 60)" class="px-2.5 py-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30 rounded-lg text-[10px] font-black transition cursor-pointer">
                1 ชม.
              </button>
              <button type="button" @click="emit('set-duration', 60 * 24)" class="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 rounded-lg text-[10px] font-black transition cursor-pointer">
                1 วัน
              </button>
              <button type="button" @click="emit('set-duration', 60 * 24 * 7)" class="px-2.5 py-1 bg-slate-200 dark:bg-[#191919] text-slate-700 dark:text-slate-300 rounded-lg text-[10px] font-black transition cursor-pointer">
                7 วัน
              </button>
            </div>
          </div>
        </div>

        <!-- Active toggle -->
        <div class="flex items-center justify-between p-4 bg-slate-50 dark:bg-[#0a0a0a] rounded-2xl border border-slate-200 dark:border-[#212327]">
          <div class="space-y-0.5">
            <p class="font-bold text-slate-800 dark:text-slate-200 text-sm">แสดงโปรโมชั่นนี้</p>
            <p class="text-xs text-slate-400 dark:text-slate-500">ปิดเพื่อซ่อนโปรโมชั่นนี้จากหน้าเว็บสำหรับลูกค้า</p>
          </div>
          <button
            type="button"
            @click="promoForm.is_active = promoForm.is_active ? 0 : 1"
            :class="promoForm.is_active ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20' : 'bg-slate-200 dark:bg-[#191919] text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-[#212327]'"
            class="px-4 py-2 rounded-xl text-xs font-black transition-all duration-200 flex items-center gap-2 flex-shrink-0 cursor-pointer"
          >
            <span :class="promoForm.is_active ? 'bg-white' : 'bg-slate-400 dark:bg-slate-500'" class="w-2.5 h-2.5 rounded-full inline-block"></span>
            <span>{{ promoForm.is_active ? 'แสดงอยู่ (เปิด)' : 'ซ่อนอยู่ (ปิด)' }}</span>
          </button>
        </div>

        <!-- Buttons -->
        <div class="flex justify-end gap-2 pt-2">
          <button type="button" @click="close" class="px-5 py-2.5 bg-slate-100 dark:bg-[#191919] hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer">
            <Icon name="lucide:x" class="w-4 h-4" />
            <span>ยกเลิก</span>
          </button>
          <button type="submit" :disabled="actionLoading" class="px-6 py-2.5 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white font-black rounded-xl transition shadow-lg shadow-pink-600/20 disabled:opacity-60 cursor-pointer">
            {{ actionLoading ? 'กำลังบันทึก...' : isPromoEdit ? 'บันทึกการแก้ไข' : 'เพิ่มโปรโมชั่น' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
