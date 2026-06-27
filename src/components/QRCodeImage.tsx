import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";

export function QRCodeImage({
  value,
  size = 180,
  className,
}: {
  value: string;
  size?: number;
  className?: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    QRCode.toCanvas(ref.current, value, {
      width: size,
      margin: 1,
      errorCorrectionLevel: "M",
    }).catch((err) => console.error("QR Error", err));
  }, [value, size]);
  return <canvas ref={ref} style={{ width: size, height: size }} className={className} />;
}

export function BarcodeImage({ value, className }: { value: string; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    import("jsbarcode").then((m) => {
      try {
        m.default(ref.current!, value, {
          format: "CODE128",
          height: 50,
          displayValue: false,
          margin: 0,
          background: "#ffffff",
          lineColor: "#0B1E3F",
        });
      } catch {
        /* ignore */
      }
    });
  }, [value]);
  return <canvas ref={ref} className={className} />;
}
