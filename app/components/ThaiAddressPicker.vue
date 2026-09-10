<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
  modelValue?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

// Form state
const houseDetails = ref('')
const selectedProvince = ref('')
const selectedDistrict = ref('')
const selectedSubdistrict = ref('')
const selectedZipcode = ref('')

// Compute combined address as JSON for reliable save/restore
function buildAddressJson() {
  return JSON.stringify({
    houseDetails: houseDetails.value,
    province: selectedProvince.value,
    district: selectedDistrict.value,
    subdistrict: selectedSubdistrict.value,
    zipcode: selectedZipcode.value
  })
}

function updateCombinedAddress() {
  emit('update:modelValue', buildAddressJson())
}

watch([houseDetails, selectedProvince, selectedDistrict, selectedSubdistrict, selectedZipcode], () => {
  updateCombinedAddress()
})

// Watch for modelValue changes — fires when parent sets value after mount
watch(() => props.modelValue, (newVal) => {
  if (!newVal) return
  if (selectedProvince.value || houseDetails.value) return
  try {
    const parsed = JSON.parse(newVal)
    houseDetails.value = parsed.houseDetails || ''
    selectedProvince.value = parsed.province || ''
    selectedDistrict.value = parsed.district || ''
    selectedSubdistrict.value = parsed.subdistrict || ''
    selectedZipcode.value = parsed.zipcode || ''
  } catch {
    houseDetails.value = newVal
  }
}, { immediate: true })
</script>

<template>
  <div class="space-y-3">

    <!-- Row 1: Province / District / Subdistrict (พิมพ์เอง) -->
    <div class="grid grid-cols-3 gap-2">
      <div>
        <label class="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">จังหวัด</label>
        <input
          v-model="selectedProvince"
          type="text"
          class="w-full bg-slate-50 dark:bg-[#0a0a0a] border border-slate-200 dark:border-[#212327] rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
        />
      </div>
      <div>
        <label class="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">อำเภอ/เขต</label>
        <input
          v-model="selectedDistrict"
          type="text"
          class="w-full bg-slate-50 dark:bg-[#0a0a0a] border border-slate-200 dark:border-[#212327] rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
        />
      </div>
      <div>
        <label class="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">ตำบล/แขวง</label>
        <input
          v-model="selectedSubdistrict"
          type="text"
          class="w-full bg-slate-50 dark:bg-[#0a0a0a] border border-slate-200 dark:border-[#212327] rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
        />
      </div>
    </div>

    <!-- Row 2: House details + Zipcode (พิมพ์เอง) -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-2">
      <div class="md:col-span-3">
        <label class="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">บ้านเลขที่/ซอย/ถนน</label>
        <input
          v-model="houseDetails"
          type="text"
          class="w-full bg-slate-50 dark:bg-[#0a0a0a] border border-slate-200 dark:border-[#212327] rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
        />
      </div>
      <div>
        <label class="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">รหัสไปรษณีย์</label>
        <input
          v-model="selectedZipcode"
          type="text"
          class="w-full bg-slate-50 dark:bg-[#0a0a0a] border border-slate-200 dark:border-[#212327] rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
        />
      </div>
    </div>

  </div>
</template>



