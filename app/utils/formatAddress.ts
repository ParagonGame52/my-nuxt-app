export function formatAddress(str?: string | null): string {
  if (!str) return '-'
  try {
    let p = typeof str === 'string' ? JSON.parse(str) : str
    if (typeof p === 'string') {
      try { p = JSON.parse(p) } catch {}
    }
    if (typeof p === 'object' && p !== null) {
      const parts: string[] = []
      if (p.houseDetails && String(p.houseDetails).trim()) parts.push(String(p.houseDetails).trim())
      if (p.subdistrict && String(p.subdistrict).trim()) parts.push(`ต.${p.subdistrict}`)
      if (p.district && String(p.district).trim()) parts.push(`อ.${p.district}`)
      if (p.province && String(p.province).trim()) parts.push(`จ.${p.province}`)
      if (p.zipcode && String(p.zipcode).trim()) parts.push(p.zipcode)
      if (p.lat && p.lng) parts.push(`(พิกัด: ${Number(p.lat).toFixed(4)}, ${Number(p.lng).toFixed(4)})`)
      if (parts.length > 0) {
        return parts.join(' ')
      }
    }
  } catch {
    // fallback plain string
  }
  return String(str)
}
