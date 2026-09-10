import React, { useState, useEffect } from "react"
import {
  QrCode,
  Download,
  Printer,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Sparkles
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  generateQRCodeDataUrl,
  createAssetTrackingUrl,
  generateUniqueTrackingId
} from "@/utils/qrCodeGenerator"

export function AssetQRCodeDisplay({ asset, className = "" }) {
  const [qrDataUrl, setQrDataUrl] = useState("")
  const [copied, setCopied] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)

  // Tracking payload: Use stored qr_code or construct live URL from asset tag
  const trackingPayload = asset?.qr_code || createAssetTrackingUrl(asset?.asset_tag || asset?.id || "asset")

  useEffect(() => {
    let isMounted = true

    async function loadQR() {
      setIsGenerating(true)
      const dataUrl = await generateQRCodeDataUrl(trackingPayload, { width: 280, margin: 1 })
      if (isMounted) {
        setQrDataUrl(dataUrl)
        setIsGenerating(false)
      }
    }

    if (trackingPayload) {
      loadQR()
    }

    return () => {
      isMounted = false
    }
  }, [trackingPayload])

  const handleCopyLink = () => {
    navigator.clipboard.writeText(trackingPayload)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    if (!qrDataUrl) return
    const link = document.createElement("a")
    link.href = qrDataUrl
    link.download = `${asset?.asset_tag || "asset"}-qr-tracking.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handlePrint = () => {
    const printWindow = window.open("", "_blank")
    if (!printWindow) return

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Asset Tag - ${asset?.asset_tag || "ITAMS"}</title>
          <style>
            @page { size: auto; margin: 10mm; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              background: #f4f4f5;
            }
            .badge-card {
              width: 320px;
              padding: 20px;
              background: white;
              border: 2px solid #18181b;
              border-radius: 8px;
              text-align: center;
              box-shadow: 0 4px 12px rgba(0,0,0,0.05);
            }
            .brand-header {
              font-size: 11px;
              font-weight: 800;
              letter-spacing: 1.5px;
              color: #b91c1c;
              margin-bottom: 8px;
              text-transform: uppercase;
            }
            .qr-wrapper {
              margin: 12px auto;
              width: 180px;
              height: 180px;
            }
            .qr-wrapper img {
              width: 100%;
              height: 100%;
              display: block;
            }
            .tag {
              font-family: monospace;
              font-size: 18px;
              font-weight: 900;
              color: #09090b;
              margin: 6px 0;
            }
            .name {
              font-size: 13px;
              font-weight: 600;
              color: #27272a;
              margin-bottom: 4px;
            }
            .details {
              font-size: 10px;
              color: #71717a;
            }
            .footer-note {
              margin-top: 12px;
              padding-top: 8px;
              border-top: 1px dashed #e4e4e7;
              font-size: 9px;
              color: #a1a1aa;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
          </style>
        </head>
        <body>
          <div class="badge-card">
            <div class="brand-header">ITAMS • Asset Custody</div>
            <div class="tag">${asset?.asset_tag || "ASSET TAG"}</div>
            <div class="qr-wrapper">
              <img src="${qrDataUrl}" alt="Asset QR Code" />
            </div>
            <div class="name">${asset?.name || "Equipment"}</div>
            <div class="details">${asset?.brand || ""} ${asset?.model || ""} • ${asset?.category || "Device"}</div>
            <div class="footer-note">Scan with camera for live asset details & updates</div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `
    printWindow.document.write(html)
    printWindow.document.close()
  }

  return (
    <div className={`p-4 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-200/80 dark:border-zinc-800 ${className}`}>
      <div className="flex flex-col sm:flex-row items-center gap-5">
        {/* Visual QR Code Image */}
        <div className="relative group shrink-0 bg-white p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 shadow-sm">
          {qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt={`QR code for ${asset?.asset_tag || "asset"}`}
              className="size-36 object-contain rounded"
            />
          ) : (
            <div className="size-36 flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 rounded">
              <QrCode className="size-8 text-muted-foreground animate-pulse" />
            </div>
          )}
          <span className="absolute -bottom-2 -right-2 p-1 bg-red-700 text-white rounded-full shadow-md">
            <ShieldCheck className="size-3.5" />
          </span>
        </div>

        {/* Tracking Information & Controls */}
        <div className="flex-1 min-w-0 space-y-2.5 text-center sm:text-left">
          <div>
            <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs font-bold text-red-700 dark:text-red-400 uppercase tracking-wider">
              <Sparkles className="size-3.5" />
              Unique Live Tracking QR Code
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Scan with any mobile camera to view real-time location, assignments, maintenance history, and updates.
            </p>
          </div>

          <div className="flex items-center justify-center sm:justify-start gap-2 bg-white dark:bg-zinc-900 px-2.5 py-1.5 rounded-md border border-zinc-200 dark:border-zinc-800 font-mono text-[11px] text-foreground truncate max-w-full">
            <QrCode className="size-3.5 text-muted-foreground shrink-0" />
            <span className="truncate">{trackingPayload}</span>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopyLink}
              className="h-7 px-2.5 text-xs rounded-[5px] gap-1.5"
              title="Copy live tracking link"
            >
              {copied ? (
                <>
                  <Check className="size-3 text-emerald-600" />
                  <span className="text-emerald-600 font-medium">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="size-3" />
                  <span>Copy Link</span>
                </>
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="h-7 px-2.5 text-xs rounded-[5px] gap-1.5"
              title="Download QR code image as PNG"
            >
              <Download className="size-3" />
              <span>Download PNG</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="h-7 px-2.5 text-xs rounded-[5px] gap-1.5 bg-red-50 hover:bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300 dark:hover:bg-red-900/50 border-red-200 dark:border-red-900"
              title="Print physical hardware label"
            >
              <Printer className="size-3" />
              <span>Print Label</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AssetQRCodeDisplay
