<script setup lang="ts">
import { ref, computed } from 'vue'
import type { SalesReport } from '~/types/admin'

const props = defineProps<{
  salesReport: SalesReport | null
}>()

const chartTooltip = ref<{ show: boolean; x: number; y: number; day: any } | null>(null)

const chartData = computed(() => {
  const days = props.salesReport?.dailySales || []
  if (!days.length) return null

  const W = 700, H = 220, padL = 60, padR = 20, padT = 20, padB = 40
  const innerW = W - padL - padR
  const innerH = H - padT - padB

  const maxRev = Math.max(...days.map((d: any) => d.revenue), 1)
  const maxCnt = Math.max(...days.map((d: any) => d.count), 1)

  const xStep = innerW / Math.max(days.length - 1, 1)

  const revPoints = days.map((d: any, i: number) => ({
    x: padL + i * xStep,
    y: padT + innerH - (d.revenue / maxRev) * innerH,
    rev: d.revenue,
    cnt: d.count,
    label: new Date(d.date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })
  }))

  const cntPoints = days.map((d: any, i: number) => ({
    x: padL + i * xStep,
    y: padT + innerH - (d.count / maxCnt) * innerH
  }))

  // Build smooth path
  const smooth = (pts: { x: number; y: number }[]) => {
    if (pts.length < 2) return pts.map(p => `${p.x},${p.y}`).join(' ')
    const p0 = pts[0]!
    let d = `M ${p0.x} ${p0.y}`
    for (let i = 0; i < pts.length - 1; i++) {
      const curr = pts[i]!
      const next = pts[i + 1]!
      const cp1x = curr.x + (next.x - curr.x) / 3
      const cp2x = next.x - (next.x - curr.x) / 3
      d += ` C ${cp1x} ${curr.y} ${cp2x} ${next.y} ${next.x} ${next.y}`
    }
    return d
  }

  const revPath = smooth(revPoints)
  const cntPath = smooth(cntPoints)

  // Fill area under revenue curve
  const areaPath = revPath + ` L ${padL + innerW} ${padT + innerH} L ${padL} ${padT + innerH} Z`

  // Y-axis ticks
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(t => ({
    y: padT + innerH - t * innerH,
    label: '฿' + Math.round(maxRev * t).toLocaleString()
  }))

  return { W, H, padL, padR, padT, padB, innerW, innerH, revPoints, cntPoints, revPath, cntPath, areaPath, yTicks, maxRev, maxCnt }
})
</script>

<template>
  <div v-if="salesReport" class="space-y-6">
    <!-- Stats cards -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div
        v-for="stat in [
          { label: 'ออเดอร์ทั้งหมด', value: salesReport.summary.total_orders, icon: 'lucide:package', color: 'from-blue-600 to-blue-700' },
          { label: 'รายได้รวม (฿)', value: salesReport.summary.total_revenue.toLocaleString(), icon: 'lucide:wallet', color: 'from-emerald-600 to-emerald-700' },
          { label: 'สมาชิกทั้งหมด', value: salesReport.userStats.total_members, icon: 'lucide:users', color: 'from-purple-600 to-purple-700' },
          { label: 'รอดำเนินการ', value: salesReport.summary.pending_orders, icon: 'lucide:clock', color: 'from-amber-600 to-amber-700' },
        ]"
        :key="stat.label"
        class="bg-gradient-to-br rounded-3xl p-5 text-white shadow-lg"
        :class="stat.color"
      >
        <div class="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mb-2">
          <Icon :name="stat.icon" class="w-5 h-5 text-white" />
        </div>
        <div class="text-2xl font-black">{{ stat.value }}</div>
        <div class="text-xs opacity-80 font-bold mt-1">{{ stat.label }}</div>
      </div>
    </div>

    <!-- Daily Revenue Chart (Pure SVG) -->
    <div class="bg-white dark:bg-[#191919] border border-slate-200 dark:border-[#212327] rounded-3xl p-6 shadow-sm">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-sm font-black text-slate-800 dark:text-white">รายได้ย้อนหลัง 7 วัน</h3>
        <div class="flex gap-3 text-[10px] font-bold">
          <span class="flex items-center gap-1 text-indigo-500"><span class="inline-block w-3 h-1 bg-indigo-500 rounded"></span>รายได้</span>
          <span class="flex items-center gap-1 text-emerald-500"><span class="inline-block w-3 h-0.5 border-t-2 border-dashed border-emerald-500"></span>ออเดอร์</span>
        </div>
      </div>
      <div v-if="!chartData || salesReport.dailySales.length === 0" class="text-center py-12 text-slate-400 text-sm">
        <div class="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-[#191919] flex items-center justify-center mx-auto mb-2 text-slate-400">
          <Icon name="lucide:bar-chart-2" class="w-6 h-6" />
        </div>
        ยังไม่มีข้อมูลยอดขาย
      </div>
      <!-- Pure SVG Chart -->
      <div v-else class="relative select-none">
        <svg :viewBox="`0 0 ${chartData.W} ${chartData.H}`" class="w-full" style="height:240px">
          <defs>
            <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#6366f1" stop-opacity="0.35"/>
              <stop offset="100%" stop-color="#6366f1" stop-opacity="0"/>
            </linearGradient>
          </defs>
          <!-- Grid lines -->
          <line
            v-for="tick in chartData.yTicks"
            :key="tick.y"
            :x1="chartData.padL"
            :y1="tick.y"
            :x2="chartData.W - chartData.padR"
            :y2="tick.y"
            stroke="currentColor"
            stroke-width="0.5"
            class="text-slate-200 dark:text-slate-800"
          />
          <!-- Y-axis labels -->
          <text
            v-for="tick in chartData.yTicks"
            :key="'yt'+tick.y"
            :x="chartData.padL - 6"
            :y="tick.y + 4"
            text-anchor="end"
            class="fill-indigo-400"
            style="font-size:9px;font-weight:700"
          >
            {{ tick.label }}
          </text>
          <!-- Area fill -->
          <path :d="chartData.areaPath" fill="url(#revGrad)"/>
          <!-- Revenue line -->
          <path :d="chartData.revPath" fill="none" stroke="#6366f1" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
          <!-- Order count line (dashed) -->
          <path :d="chartData.cntPath" fill="none" stroke="#10b981" stroke-width="2" stroke-dasharray="6 3" stroke-linecap="round"/>
          <!-- Revenue data points + hover -->
          <g
            v-for="(pt, i) in chartData.revPoints"
            :key="'rp'+i"
            @mouseenter="chartTooltip = { show: true, x: pt.x, y: pt.y, day: pt }"
            @mouseleave="chartTooltip = null"
            style="cursor:pointer"
          >
            <circle :cx="pt.x" :cy="pt.y" r="10" fill="transparent"/>
            <circle :cx="pt.x" :cy="pt.y" r="4" fill="#6366f1" stroke="white" stroke-width="2"/>
            <!-- X-axis label -->
            <text
              :x="pt.x"
              :y="chartData.H - chartData.padB + 16"
              text-anchor="middle"
              class="fill-slate-400 dark:fill-slate-500"
              style="font-size:9px;font-weight:700"
            >
              {{ pt.label }}
            </text>
          </g>
          <!-- Order count dots -->
          <circle
            v-for="(pt, i) in chartData.cntPoints"
            :key="'cp'+i"
            :cx="pt.x"
            :cy="pt.y"
            r="3"
            fill="#10b981"
            stroke="white"
            stroke-width="1.5"
          />
          <!-- Tooltip -->
          <g v-if="chartTooltip">
            <rect
              :x="Math.max(chartData.padL, Math.min(chartTooltip.x - 65, chartData.W - chartData.padR - 130))"
              :y="chartTooltip.y < 70 ? chartTooltip.y + 10 : chartTooltip.y - 58"
              width="130"
              height="52"
              rx="8"
              fill="rgba(15,23,42,0.95)"
              stroke="rgba(99,102,241,0.5)"
              stroke-width="1"
            />
            <text
              :x="Math.max(chartData.padL, Math.min(chartTooltip.x - 65, chartData.W - chartData.padR - 130)) + 10"
              :y="chartTooltip.y < 70 ? chartTooltip.y + 26 : chartTooltip.y - 40"
              class="fill-slate-200"
              style="font-size:10px;font-weight:700"
            >
              {{ chartTooltip.day.label }}
            </text>
            <text
              :x="Math.max(chartData.padL, Math.min(chartTooltip.x - 65, chartData.W - chartData.padR - 130)) + 10"
              :y="chartTooltip.y < 70 ? chartTooltip.y + 40 : chartTooltip.y - 26"
              class="fill-indigo-400"
              style="font-size:10px"
            >
              ฿{{ chartTooltip.day.rev.toLocaleString() }}
            </text>
            <text
              :x="Math.max(chartData.padL, Math.min(chartTooltip.x - 65, chartData.W - chartData.padR - 130)) + 10"
              :y="chartTooltip.y < 70 ? chartTooltip.y + 54 : chartTooltip.y - 12"
              class="fill-emerald-400"
              style="font-size:10px"
            >
              {{ chartTooltip.day.cnt }} ออเดอร์
            </text>
          </g>
        </svg>
      </div>
    </div>

    <!-- Top Products Table -->
    <div class="bg-white dark:bg-[#191919] border border-slate-200 dark:border-[#212327] rounded-3xl overflow-hidden shadow-sm">
      <div class="px-6 py-4 border-b border-slate-200 dark:border-[#212327]">
        <h3 class="text-sm font-black text-slate-800 dark:text-white">สินค้าขายดี 5 อันดับแรก</h3>
      </div>
      <div v-if="salesReport.topProducts.length === 0" class="text-center py-8 text-slate-400 text-sm">ยังไม่มีข้อมูลการขาย</div>
      <table v-else class="w-full text-xs">
        <thead>
          <tr class="bg-slate-50 dark:bg-[#0a0a0a] text-slate-500 font-bold border-b border-slate-200 dark:border-[#212327]">
            <th class="p-4 text-left">#</th>
            <th class="p-4 text-left">ชื่อสินค้า</th>
            <th class="p-4 text-center">ขายได้ (ชิ้น)</th>
            <th class="p-4 text-right">รายได้รวม</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-200 dark:divide-slate-800">
          <tr v-for="(prod, i) in salesReport.topProducts" :key="prod.product_name" class="hover:bg-slate-50/50 dark:hover:bg-[#1a1c20]/20">
            <td class="p-4 font-black text-slate-400">{{ i + 1 }}</td>
            <td class="p-4 font-bold text-slate-800 dark:text-slate-200">{{ prod.product_name }}</td>
            <td class="p-4 text-center font-black text-blue-600">{{ prod.total_sold }}</td>
            <td class="p-4 text-right font-black text-emerald-600">฿{{ prod.total_revenue.toLocaleString() }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
