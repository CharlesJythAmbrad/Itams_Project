import QRCode from "qrcode"

/**
 * Generates a unique tracking token for an asset
 */
export function generateUniqueTrackingId(prefix = "TRK") {
  const timestamp = Date.now().toString(36).toUpperCase()
  const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `${prefix}-${timestamp}-${randomPart}`
}

/**
 * Creates the live tracking URL for an asset
 */
export function createAssetTrackingUrl(assetTagOrId) {
  const origin = typeof window !== "undefined" && window.location?.origin 
    ? window.location.origin 
    : ""
  return `${origin}/dashboard/inventory/assets?search=${encodeURIComponent(assetTagOrId)}`
}

/**
 * Generates a base64 Data URL for a QR Code
 */
export async function generateQRCodeDataUrl(text, options = {}) {
  if (!text) return null
  try {
    return await QRCode.toDataURL(text, {
      width: options.width || 256,
      margin: options.margin !== undefined ? options.margin : 1,
      color: {
        dark: options.darkColor || "#18181b",
        light: options.lightColor || "#ffffff"
      },
      errorCorrectionLevel: options.errorCorrectionLevel || "M"
    })
  } catch (error) {
    console.error("Failed to generate QR code:", error)
    return null
  }
}
