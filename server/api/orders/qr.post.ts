import generatePayload from 'promptpay-qr'
import QRCode from 'qrcode'

const PROMPTPAY_ID = '0808264523'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { amount } = body

  if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'ยอดเงินไม่ถูกต้อง' })
  }

  try {
    // Generate PromptPay payload (EMVCo standard)
    const payload = generatePayload(PROMPTPAY_ID, { amount: Number(amount) })

    // Convert payload to QR code base64 image
    const qrDataUrl = await QRCode.toDataURL(payload, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 300,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
    })

    return {
      success: true,
      qrDataUrl,
      promptpayId: PROMPTPAY_ID,
      amount: Number(amount)
    }
  } catch (err: any) {
    throw createError({ statusCode: 500, statusMessage: 'ไม่สามารถสร้าง QR Code ได้: ' + err.message })
  }
})
