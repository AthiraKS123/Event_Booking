import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Camera, X, Sparkles } from 'lucide-react';

const QrScannerModal = ({ isOpen, onClose, onScanSuccess }) => {
  const scannerRef = useRef(null);
  const isHandledRef = useRef(false);

  useEffect(() => {
    if (!isOpen) {
      cleanupScanner();
      return;
    }

    isHandledRef.current = false;

    // Small delay to ensure the DOM element #qr-reader-widget is rendered in modal
    const timer = setTimeout(() => {
      try {
        const container = document.getElementById('qr-reader-widget');
        if (!container) return;

        // Clear any previous leftover DOM children in container
        container.innerHTML = '';

        const scanner = new Html5QrcodeScanner(
          'qr-reader-widget',
          {
            fps: 15,
            qrbox: (viewfinderWidth, viewfinderHeight) => {
              const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
              const qrboxSize = Math.floor(minEdge * 0.75);
              return { width: qrboxSize, height: qrboxSize };
            },
            aspectRatio: 1.0,
            showTorchButtonIfSupported: true,
            showZoomSliderIfSupported: true,
            rememberLastUsedCamera: true,
          },
          /* verbose= */ false
        );

        scannerRef.current = scanner;

        scanner.render(
          (decodedText) => {
            if (isHandledRef.current) return;
            isHandledRef.current = true;

            console.log('🎉 Gatekeeper QR Scanned Successfully:', decodedText);

            // Stop scanner & trigger success
            cleanupScanner();

            if (onScanSuccess) {
              onScanSuccess(decodedText);
            }
          },
          (errorMessage) => {
            // Normal scanning frame in progress
          }
        );
      } catch (err) {
        console.error('Failed to initialize Html5QrcodeScanner:', err);
      }
    }, 150);

    return () => {
      clearTimeout(timer);
      cleanupScanner();
    };
  }, [isOpen]);

  const cleanupScanner = () => {
    try {
      if (scannerRef.current) {
        scannerRef.current.clear().catch((err) => console.warn('Scanner clear error:', err));
        scannerRef.current = null;
      }
    } catch (e) {
      console.warn('Cleanup error:', e);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-lg bg-white dark:bg-[#141B26] border border-[#EBE5DC] dark:border-[#283548] rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh] transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#DE5D3B]/20 bg-[#DE5D3B] dark:bg-[#FF6B4A] text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center border border-white/20">
              <Camera className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                Gatekeeper Entry Pass Scanner
                <Sparkles className="w-4 h-4 text-white" />
              </h3>
              <p className="text-[11px] text-white/80">Live Camera & Image QR Verification</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              cleanupScanner();
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-[#C84E2E] hover:bg-[#B33F21] flex items-center justify-center text-white transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body: Official Html5QrcodeScanner Widget */}
        <div className="p-6 flex-1 overflow-y-auto space-y-4">
          <div className="rounded-2xl overflow-hidden bg-gray-950 border border-gray-800 p-4 text-white">
            {/* Target Div where Html5QrcodeScanner renders */}
            <div id="qr-reader-widget" className="w-full"></div>
          </div>

          <div className="text-center text-xs text-[#676C75] dark:text-[#94A3B8] space-y-1">
            <p>💡 <strong>Tip:</strong> You can scan using your <strong>Live Camera</strong> or click <strong>"Scan an Image File"</strong> inside the scanner widget.</p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#EBE5DC] dark:border-[#283548] bg-[#FAF7F2] dark:bg-[#1E2838] flex items-center justify-between transition-colors">
          <span className="text-[11px] text-[#676C75] dark:text-[#94A3B8]">Cryptographic Gatekeeper Engine • 2026</span>
          <button
            type="button"
            onClick={() => {
              cleanupScanner();
              onClose();
            }}
            className="px-4 py-2 rounded-xl bg-[#DE5D3B] hover:bg-[#C84E2E] dark:bg-[#FF6B4A] dark:hover:bg-[#E55A3A] text-white font-bold text-xs shadow-xs cursor-pointer transition-all"
          >
            Close Scanner
          </button>
        </div>
      </div>
    </div>
  );
};

export default QrScannerModal;
