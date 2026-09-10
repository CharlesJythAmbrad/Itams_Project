import React, { useState, useEffect, useRef } from "react"
import { createPortal } from "react-dom"
import {
  X,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
  Scan,
  Smartphone,
  Monitor
} from "lucide-react"
import { Button } from "@/components/ui/button"

// Dynamically load jsQR from CDN if native BarcodeDetector is unavailable
let jsQRPromise = null
function loadJsQR() {
  if (typeof window === "undefined") return Promise.reject(new Error("No window"))
  if (window.jsQR) return Promise.resolve(window.jsQR)
  if (jsQRPromise) return jsQRPromise

  jsQRPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script")
    script.src = "https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js"
    script.async = true
    script.onload = () => {
      if (window.jsQR) resolve(window.jsQR)
      else reject(new Error("jsQR failed to initialize"))
    }
    script.onerror = () => reject(new Error("Failed to load jsQR library from CDN"))
    document.head.appendChild(script)
  })
  return jsQRPromise
}

export function ScanAssetDialog({ isOpen, onClose, onScanSuccess }) {
  const [hasPermission, setHasPermission] = useState(null)
  const [errorMessage, setErrorMessage] = useState("")
  const [isScanning, setIsScanning] = useState(false)
  const [scannedResult, setScannedResult] = useState(null)
  const [manualInput, setManualInput] = useState("")

  // Determine if device is mobile or desktop
  const isMobileDevice = typeof navigator !== "undefined" && (
    /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
    (navigator.maxTouchPoints && navigator.maxTouchPoints > 1 && window.innerWidth < 800)
  )

  // Default facing mode: 'environment' (back camera) on mobile, 'user' (webcam facing front) on desktop
  const [facingMode, setFacingMode] = useState(isMobileDevice ? "environment" : "user")

  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const animationFrameRef = useRef(null)
  const barcodeDetectorRef = useRef(null)

  // Initialize BarcodeDetector if natively supported by browser
  useEffect(() => {
    if (typeof window !== "undefined" && "BarcodeDetector" in window) {
      try {
        barcodeDetectorRef.current = new window.BarcodeDetector({
          formats: ["qr_code", "code_128", "code_39", "ean_13", "upc_a"]
        })
      } catch (err) {
        console.warn("BarcodeDetector error:", err)
      }
    } else {
      // Pre-load jsQR fallback
      loadJsQR().catch(() => {})
    }
  }, [])

  // Stop camera media streams
  const stopCamera = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        try {
          track.stop()
        } catch (e) {}
      })
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setIsScanning(false)
  }

  // Start camera stream based on selected facingMode
  const startCamera = async () => {
    stopCamera()
    setErrorMessage("")
    setScannedResult(null)

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setErrorMessage("Camera access is not supported on this browser or connection (HTTPS required).")
      setHasPermission(false)
      return
    }

    try {
      // Constraints configuration:
      // Desktop: User facing (front cam)
      // Mobile: Environment facing (rear scanner)
      let stream = null
      try {
        const constraints = {
          video: {
            facingMode: { ideal: facingMode },
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: false
        }
        stream = await navigator.mediaDevices.getUserMedia(constraints)
      } catch (modeErr) {
        // Fallback to simple video true if device does not support specific facingMode
        console.warn("Retrying with generic video constraints:", modeErr)
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
      }

      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.setAttribute("playsinline", "true")
        videoRef.current.muted = true
        await videoRef.current.play()
      }

      setHasPermission(true)
      setIsScanning(true)

      // Begin scanning frames
      requestScanFrame()
    } catch (err) {
      console.error("Camera access error:", err)
      setHasPermission(false)
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setErrorMessage("Camera permission was denied. Please allow camera permissions in your browser address bar.")
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        setErrorMessage("No camera hardware detected on this device.")
      } else {
        setErrorMessage(`Camera error: ${err.message || "Failed to start camera."}`)
      }
    }
  }

  // Continuous frame scanning loop
  const requestScanFrame = () => {
    const scanLoop = async () => {
      if (!videoRef.current || videoRef.current.readyState < 2) {
        animationFrameRef.current = requestAnimationFrame(scanLoop)
        return
      }

      const video = videoRef.current
      const canvas = canvasRef.current

      // Strategy A: Native BarcodeDetector API
      if (barcodeDetectorRef.current) {
        try {
          const barcodes = await barcodeDetectorRef.current.detect(video)
          if (barcodes && barcodes.length > 0) {
            const rawValue = barcodes[0].rawValue
            if (rawValue) {
              handleFoundCode(rawValue)
              return
            }
          }
        } catch (e) {
          // Fall back to canvas/jsQR if native detector fails
        }
      }

      // Strategy B: Canvas + jsQR fallback
      if (canvas && video.videoWidth && video.videoHeight) {
        try {
          canvas.width = video.videoWidth
          canvas.height = video.videoHeight
          const ctx = canvas.getContext("2d", { willReadFrequently: true })
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
            
            const jsQR = window.jsQR || (await loadJsQR().catch(() => null))
            if (jsQR) {
              const code = jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: "dontInvert"
              })
              if (code && code.data) {
                handleFoundCode(code.data)
                return
              }
            }
          }
        } catch (canvasErr) {
          // ignore transient draw errors
        }
      }

      animationFrameRef.current = requestAnimationFrame(scanLoop)
    }

    animationFrameRef.current = requestAnimationFrame(scanLoop)
  }

  // Handle scanned string from QR or barcode
  const handleFoundCode = (codeString) => {
    stopCamera()
    
    // Extract asset tag or identifier from scanned URL or direct string
    let extractedTag = codeString.trim()
    
    try {
      if (codeString.includes("http://") || codeString.includes("https://")) {
        const urlObj = new URL(codeString)
        const searchParam = urlObj.searchParams.get("search")
        if (searchParam) {
          extractedTag = searchParam
        } else {
          const segments = urlObj.pathname.split("/").filter(Boolean)
          if (segments.length > 0) {
            extractedTag = segments[segments.length - 1]
          }
        }
      }
    } catch (e) {
      // Keep raw string
    }

    setScannedResult({
      raw: codeString,
      cleanTag: extractedTag
    })

    if (onScanSuccess) {
      onScanSuccess(extractedTag, codeString)
    }
  }

  // Toggle between user (front) and environment (back) cameras
  const toggleFacingMode = () => {
    const nextMode = facingMode === "environment" ? "user" : "environment"
    setFacingMode(nextMode)
  }

  // Handle manual code entry submit
  const handleManualSubmit = (e) => {
    e.preventDefault()
    if (!manualInput.trim()) return
    handleFoundCode(manualInput.trim())
  }

  // Lifecycle control when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      startCamera()
    } else {
      stopCamera()
      setScannedResult(null)
      setManualInput("")
      setErrorMessage("")
    }

    return () => {
      stopCamera()
    }
  }, [isOpen, facingMode])

  if (!isOpen) return null

  if (typeof document === "undefined") return null

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 animate-in fade-in-50 duration-200">
      {/* Dark backdrop */}
      <div 
        className="fixed inset-0 bg-black/75 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Dialog Modal Container */}
      <div className="relative z-10 w-full max-w-lg bg-white dark:bg-zinc-900 rounded-xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col max-h-[95vh]">
        {/* Header */}
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-800/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400 rounded-lg">
              <Scan className="size-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                Scan Asset QR Code
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300">
                  {isMobileDevice ? "Mobile Scanner" : "Desktop Camera"}
                </span>
              </h2>
              <p className="text-xs text-muted-foreground">
                {isMobileDevice 
                  ? "Rear camera active — point your phone at the physical QR tag" 
                  : "Front webcam active — hold the QR sticker towards the screen"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-zinc-400 hover:text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Viewport / Scanner Feed */}
        <div className="p-4 space-y-4 overflow-y-auto">
          {/* Camera Viewfinder Box */}
          <div className="relative aspect-video sm:aspect-[4/3] w-full bg-black rounded-lg overflow-hidden border border-zinc-700 shadow-inner flex items-center justify-center">
            {/* Video element for live feed */}
            <video
              ref={videoRef}
              className={`w-full h-full object-cover ${facingMode === "user" ? "scale-x-[-1]" : ""}`}
              autoPlay
              playsInline
              muted
            />

            {/* Hidden canvas for image analysis */}
            <canvas ref={canvasRef} className="hidden" />

            {/* Scanning Target Overlay */}
            {isScanning && !scannedResult && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <div className="relative size-48 sm:size-56 border-2 border-red-500/80 rounded-xl shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]">
                  {/* Glowing Corner Accents */}
                  <div className="absolute -top-1 -left-1 size-5 border-t-4 border-l-4 border-red-600 rounded-tl" />
                  <div className="absolute -top-1 -right-1 size-5 border-t-4 border-r-4 border-red-600 rounded-tr" />
                  <div className="absolute -bottom-1 -left-1 size-5 border-b-4 border-l-4 border-red-600 rounded-bl" />
                  <div className="absolute -bottom-1 -right-1 size-5 border-b-4 border-r-4 border-red-600 rounded-br" />

                  {/* Animated laser scanning line */}
                  <div className="w-full h-0.5 bg-red-500 shadow-[0_0_8px_#ef4444] animate-bounce duration-1000 mt-20" />
                </div>
                <p className="mt-3 text-xs font-medium text-white/90 bg-black/60 px-3 py-1 rounded-full shadow backdrop-blur-sm">
                  Align QR code within frame
                </p>
              </div>
            )}

            {/* Error or Permission Denied Display */}
            {errorMessage && (
              <div className="absolute inset-0 bg-zinc-900/95 flex flex-col items-center justify-center p-6 text-center text-zinc-100 space-y-3">
                <AlertCircle className="size-10 text-red-500" />
                <h3 className="font-semibold text-sm">Camera Unavailable</h3>
                <p className="text-xs text-zinc-300 max-w-xs">{errorMessage}</p>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={startCamera}
                  className="mt-2 text-xs bg-zinc-800 border-zinc-700 hover:bg-zinc-700 text-white"
                >
                  <RotateCcw className="size-3.5 mr-1.5" />
                  Retry Camera
                </Button>
              </div>
            )}

            {/* Success Scanned Overlay */}
            {scannedResult && (
              <div className="absolute inset-0 bg-emerald-950/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center text-white animate-in zoom-in-95 duration-200">
                <CheckCircle2 className="size-12 text-emerald-400 mb-2" />
                <h4 className="font-bold text-base">QR Code Detected!</h4>
                <div className="mt-2 px-4 py-2 bg-emerald-900/60 border border-emerald-500/40 rounded-lg max-w-xs truncate font-mono text-sm text-emerald-200">
                  {scannedResult.cleanTag}
                </div>
                <p className="text-xs text-emerald-300 mt-2">
                  Asset found in system
                </p>
                <Button
                  size="sm"
                  onClick={startCamera}
                  className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5"
                >
                  <Scan className="size-3.5" />
                  Scan Another Asset
                </Button>
              </div>
            )}
          </div>

          {/* Camera Switcher and Controls */}
          <div className="flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              {facingMode === "environment" ? (
                <>
                  <Smartphone className="size-3.5 text-red-600" />
                  <span>Back Camera (Scanner Mode)</span>
                </>
              ) : (
                <>
                  <Monitor className="size-3.5 text-red-600" />
                  <span>Front Camera (Webcam Mode)</span>
                </>
              )}
            </div>

            {/* Toggle Camera (Front / Back) */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={toggleFacingMode}
              disabled={!hasPermission}
              className="h-7 px-2 text-xs rounded-[5px] gap-1.5 border-zinc-300 dark:border-zinc-700"
              title="Switch camera direction (Front / Back)"
            >
              <RotateCcw className="size-3" />
              Switch to {facingMode === "environment" ? "Front Cam" : "Rear Cam"}
            </Button>
          </div>

          {/* Manual Input Fallback */}
          <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800">
            <p className="text-xs font-medium text-muted-foreground mb-1.5">
              Or manually type asset tag / serial code:
            </p>
            <form onSubmit={handleManualSubmit} className="flex gap-2">
              <input
                type="text"
                placeholder="e.g., ITAMS-2026-COMP-001"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                className="flex-1 px-3 py-1.5 border border-zinc-300 dark:border-zinc-700 rounded-[5px] text-xs font-mono bg-transparent focus:outline-none focus:ring-1 focus:ring-red-500"
              />
              <Button
                type="submit"
                size="sm"
                className="h-8 px-3 text-xs rounded-[5px] bg-red-700 hover:bg-red-800 text-white"
                disabled={!manualInput.trim()}
              >
                Search
              </Button>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40 flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="text-xs rounded-[5px]"
          >
            Close Scanner
          </Button>
        </div>
      </div>
    </div>,
    document.body
  )
}

export default ScanAssetDialog
