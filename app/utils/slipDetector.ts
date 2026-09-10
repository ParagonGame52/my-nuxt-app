import jsQR from "jsqr"

export interface SlipDetectionResult {
  isValidSlip: boolean
  qrData?: string
  error?: string
}

/**
 * Client-side QR Code detector for Bank Slips using HTML5 Canvas & jsQR
 * Scans uploaded image to check if a valid QR code (PromptPay Slip Mini QR) exists.
 */
export async function detectSlipQRCode(file: File): Promise<SlipDetectionResult> {
  return new Promise((resolve) => {
    // 1. Basic file type check
    if (!file.type.startsWith("image/")) {
      return resolve({
        isValidSlip: false,
        error: "กรุณาแนบรูปภาพสลิปธนาคารที่มี QR Code"
      })
    }

    const img = new Image()
    const objectUrl = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(objectUrl)
      try {
        // Attempt detection across multiple scales to ensure reliability (Full, Scaled, Enhanced)
        const scales = [1.0, 0.75, 0.5, 1.25]
        
        for (const scale of scales) {
          const canvas = document.createElement("canvas")
          const ctx = canvas.getContext("2d", { willReadFrequently: true })
          if (!ctx) continue

          const targetWidth = Math.min(1600, Math.round(img.width * scale))
          const targetHeight = Math.round((img.height / img.width) * targetWidth)

          canvas.width = targetWidth
          canvas.height = targetHeight

          ctx.drawImage(img, 0, 0, targetWidth, targetHeight)
          const imageData = ctx.getImageData(0, 0, targetWidth, targetHeight)

          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "attemptBoth"
          })

          if (code && code.data && code.data.trim().length > 0) {
            return resolve({
              isValidSlip: true,
              qrData: code.data
            })
          }
        }

        // If no QR code found across all scales
        return resolve({
          isValidSlip: false,
          error: "กรุณาแนบรูปภาพสลิปธนาคารที่มี QR Code"
        })
      } catch (err: any) {
        console.error("QR Code detection error:", err)
        return resolve({
          isValidSlip: false,
          error: "ไม่สามารถตรวจสอบสลิปได้ กรุณาแนบรูปภาพสลิปธนาคารที่มี QR Code ที่ชัดเจน"
        })
      }
    }

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      resolve({
        isValidSlip: false,
        error: "ไม่สามารถอ่านไฟล์รูปภาพได้ กรุณาแนบรูปภาพสลิปธนาคารที่มี QR Code"
      })
    }

    img.src = objectUrl
  })
}
