import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";

export function QRCodeImage({ value, size = 180, className }: { value: string; size?: number; className?: string }) {
  const [src, setSrc] = useState<string>("");
  useEffect(() => {
    QRCode.toDataURL(value, { width: size, margin: 1, errorCorrectionLevel: "M" })
      .then(setSrc)
      .catch(() => setSrc(""));
  }, [value, size]);
  if (!src) return <div className={className} style={{ width: size, height: size, background: "#f1f1f1" }} />;
  return <img src={src} alt="QR Code" width={size} height={size} className={className} />;
}

export function BarcodeImage({ value, className }: { value: string; className?: string }) {
  const ref = useRef<SVGSVGElement>(null);
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
      } catch { /* ignore */ }
    });
  }, [value]);
  return <svg ref={ref} className={className} />;
}
