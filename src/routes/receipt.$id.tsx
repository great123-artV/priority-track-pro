import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { QRCodeImage, BarcodeImage } from "@/components/QRCodeImage";
import { Logo } from "@/components/Logo";
import { formatDate, formatDateTime, formatMoney, getVerificationCode, trackingUrl } from "@/lib/pme";
import { Printer, Download, ArrowLeft, Share2, FileImage, Check, X, Clock } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";

export const Route = createFileRoute("/receipt/$id")({
  head: ({ params }) => ({ meta: [{ title: `Receipt ${params.id} — PME` }] }),
  component: ReceiptPage,
});

const getHtml2CanvasConfig = (sourceRef: React.RefObject<HTMLDivElement>) => ({
  scale: 2.5, // Increased scale for better clarity on mobile sharing
  backgroundColor: "#ffffff",
  useCORS: true,
  allowTaint: true,
  logging: false,
  width: 800,
  windowWidth: 800,
  onclone: (clonedDoc: Document) => {
    const el = clonedDoc.querySelector(".print-area") as HTMLElement;
    if (el) {
      // Reset transformations and ensure layout is stable for capture
      el.style.transform = "none";
      el.style.boxShadow = "none";
      el.style.border = "none";
      el.style.margin = "0";
      el.style.padding = "0";
      el.style.width = "800px";
      el.style.height = "auto";
      el.style.minHeight = "auto";
      el.style.position = "relative";
      el.style.left = "0";
      el.style.top = "0";

      // Fix potential grid issues that cause logo or elements to jump/resize
      // We force the header to use flexbox for the capture to ensure stability
      const header = el.firstElementChild as HTMLElement;
      if (header && header.classList.contains('grid')) {
        header.style.display = "flex";
        header.style.flexDirection = "row";
        header.style.alignItems = "center";
        header.style.justifyContent = "space-between";
        header.style.paddingLeft = "32px";
        header.style.paddingRight = "32px";

        // Fix logo container and image size
        const logoContainer = header.lastElementChild as HTMLElement;
        if (logoContainer) {
          logoContainer.style.width = "120px";
          logoContainer.style.flexShrink = "0";
          logoContainer.style.display = "flex";
          logoContainer.style.justifyContent = "flex-end";
          const logoImg = logoContainer.querySelector("img") as HTMLElement;
          if (logoImg) {
            logoImg.style.height = "70px";
            logoImg.style.width = "auto";
            logoImg.style.maxWidth = "none";
            logoImg.style.objectFit = "contain";
          }
        }
      }
    }

    // Force HEX colors on root and body (html2canvas doesn't support oklch)
    const root = clonedDoc.documentElement;
    const colors = {
      "--pme-red": "#E21D12",
      "--pme-blue": "#1E40AF",
      "--navy": "#0B1E3F",
      "--navy-deep": "#081226",
      "--foreground": "#1A2B4B",
      "--background": "#ffffff",
      "--surface": "#f8fafc",
      "--border": "#cbd5e1",
      "--card": "#ffffff",
      "--muted": "#f1f5f9",
      "--accent": "#f1f5f9",
      "--slate-50": "#f8fafc",
      "--slate-100": "#f1f5f9",
      "--slate-200": "#e2e8f0",
      "--slate-300": "#cbd5e1",
      "--slate-400": "#94a3b8",
      "--slate-500": "#64748b",
      "--slate-600": "#475569",
      "--slate-700": "#334155",
      "--slate-800": "#1e293b",
      "--slate-900": "#0f172a",
    };

    Object.entries(colors).forEach(([key, val]) => {
      root.style.setProperty(key, val);
      clonedDoc.body.style.setProperty(key, val);
    });

    const style = clonedDoc.createElement("style");
    style.innerHTML = `
      * { -webkit-print-color-adjust: exact !important; color-adjust: exact !important; }
      .text-pme-red { color: #E21D12 !important; }
      .text-navy { color: #0B1E3F !important; }
      .bg-navy { background-color: #0B1E3F !important; }
      .bg-pme-red { background-color: #E21D12 !important; }
      .text-slate-600 { color: #475569 !important; }
      .text-slate-700 { color: #334155 !important; }
      .text-slate-400 { color: #94a3b8 !important; }
      .bg-slate-50 { background-color: #f8fafc !important; }
      .bg-slate-200 { background-color: #e2e8f0 !important; }
      .border-slate-300 { border-color: #cbd5e1 !important; }
      .bg-slate-400\\/70 { background-color: rgba(148, 163, 184, 0.7) !important; }
      canvas { max-width: 100% !important; height: auto !important; }
      img { max-width: none !important; }
    `;
    clonedDoc.head.appendChild(style);

    // Remove oklch properties from existing rules to prevent crash
    try {
      for (const sheet of Array.from(clonedDoc.styleSheets)) {
        try {
          const s = sheet as CSSStyleSheet;
          for (let i = 0; i < s.cssRules.length; i++) {
            const rule = s.cssRules[i];
            if (rule instanceof CSSStyleRule && rule.cssText.includes("oklch")) {
              for (let j = rule.style.length - 1; j >= 0; j--) {
                const prop = rule.style[j];
                const val = rule.style.getPropertyValue(prop);
                if (val && val.includes("oklch")) {
                  rule.style.removeProperty(prop);
                }
              }
            }
          }
        } catch (e) {}
      }
    } catch (e) {}

    // Clean up potentially problematic SVGs
    clonedDoc.querySelectorAll("svg").forEach((svg) => {
      svg.setAttribute("fill", "#0B1E3F");
      svg.setAttribute("stroke", "#0B1E3F");
      svg.querySelectorAll("*").forEach(child => {
        if (child.getAttribute("fill")?.includes("oklch")) child.setAttribute("fill", "#0B1E3F");
        if (child.getAttribute("stroke")?.includes("oklch")) child.setAttribute("stroke", "#0B1E3F");
      });
    });
  },
});

function ReceiptPage() {
  const { id } = Route.useParams();
  const queryClient = useQueryClient();
  const ref = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [isEditingTime, setIsEditingTime] = useState(false);
  const [newTime, setNewTime] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const { data } = useQuery({
    queryKey: ["receipt", id],
    queryFn: async () => {
      const { data: s } = await supabase
        .from("shipments")
        .select("*, origin:branches!shipments_origin_branch_id_fkey(name,city,country,address,phone)")
        .eq("id", id)
        .maybeSingle();
      return s;
    },
  });

  useEffect(() => {
    if (data?.expected_arrival_date) {
      const date = new Date(data.expected_arrival_date);
      setNewTime(date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true }));
    }
  }, [data?.expected_arrival_date]);

  const captureCanvas = async (): Promise<HTMLCanvasElement> => {
    const { toCanvas } = await import("html-to-image");
    const node = ref.current!;
    // Wait a tick to ensure fonts/canvases (barcode, qr) are painted
    await new Promise((r) => setTimeout(r, 250));
    return toCanvas(node, {
      pixelRatio: 2.5,
      backgroundColor: "#ffffff",
      cacheBust: true,
      skipFonts: false,
      width: node.offsetWidth,
      height: node.offsetHeight,
      style: { transform: "none", boxShadow: "none", margin: "0" },
      filter: (el) => {
        if (!(el instanceof HTMLElement)) return true;
        return !el.classList?.contains("no-print");
      },
    });
  };

  const downloadPdf = async () => {
    if (!ref.current || !data) return;
    setDownloading(true);
    const toastId = toast.loading("Generating PDF…");
    try {
      const canvas = await captureCanvas();
      const { default: jsPDF } = await import("jspdf");
      const img = canvas.toDataURL("image/png", 1.0);
      const pdfWidth = 210;
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      const pdf = new jsPDF({
        orientation: pdfHeight > pdfWidth ? "portrait" : "landscape",
        unit: "mm",
        format: [pdfWidth, pdfHeight],
      });
      pdf.addImage(img, "PNG", 0, 0, pdfWidth, pdfHeight, undefined, "FAST");
      pdf.save(`PME-Receipt-${data.receipt_number}.pdf`);
      toast.success("PDF saved", { id: toastId });
    } catch (error) {
      console.error("PDF download failed", error);
      toast.error("Couldn't generate PDF. Try again.", { id: toastId });
    } finally {
      setDownloading(false);
    }
  };

  const downloadImage = async () => {
    if (!ref.current || !data) return;
    setDownloading(true);
    const toastId = toast.loading("Preparing receipt image…");
    try {
      const canvas = await captureCanvas();
      canvas.toBlob((blob) => {
        if (!blob) {
          toast.error("Generation failed", { id: toastId });
          return;
        }
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.download = `PME-Receipt-${data.receipt_number}.png`;
        link.href = url;
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 500);
        toast.success("Receipt image saved", { id: toastId });
      }, "image/png", 1.0);
    } catch (error) {
      console.error("Image download failed", error);
      toast.error("Couldn't download image. Try again.", { id: toastId });
    } finally {
      setDownloading(false);
    }
  };

  const shareReceipt = async () => {
    if (!ref.current || !data) return;
    const toastId = toast.loading("Preparing to share…");
    try {
      const canvas = await captureCanvas();
      const blob: Blob | null = await new Promise((resolve) =>
        canvas.toBlob((b) => resolve(b), "image/png", 1.0),
      );
      if (!blob) {
        toast.error("Couldn't generate image", { id: toastId });
        return;
      }
      const fileName = `PME-Receipt-${data.receipt_number}.png`;
      const file = new File([blob], fileName, { type: "image/png" });
      try {
        if (typeof navigator !== "undefined" && navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: `PME Receipt ${data.receipt_number}`,
            text: `Priority Mail Express receipt for shipment ${data.tracking_number}`,
          });
          toast.success("Shared", { id: toastId });
        } else {
          // Fallback: download the image so the user can share it manually
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.download = fileName;
          link.href = url;
          document.body.appendChild(link);
          link.click();
          link.remove();
          setTimeout(() => URL.revokeObjectURL(url), 500);
          try {
            await navigator.clipboard.writeText(window.location.href);
          } catch {}
          toast.success("Image downloaded — share it from your gallery", { id: toastId });
        }
      } catch (shareError) {
        if ((shareError as Error).name !== "AbortError") {
          console.error("Share failed", shareError);
          toast.error("Sharing cancelled", { id: toastId });
        } else {
          toast.dismiss(toastId);
        }
      }
    } catch (error) {
      console.error("Sharing failed", error);
      toast.error("Failed to share receipt", { id: toastId });
    }
  };

  const saveDeliveryTime = async () => {
    if (!data || !newTime) return;
    setIsSaving(true);
    try {
      const timeMatch = newTime.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
      if (!timeMatch) {
        toast.error("Invalid time format. Please use HH:MM AM/PM");
        setIsSaving(false);
        return;
      }

      let [_, hours, minutes, ampm] = timeMatch;
      let h = parseInt(hours);
      const m = parseInt(minutes);

      if (ampm) {
        if (ampm.toUpperCase() === "PM" && h < 12) h += 12;
        if (ampm.toUpperCase() === "AM" && h === 12) h = 0;
      }

      const datePart = (data.expected_arrival_date || new Date().toISOString()).split("T")[0];
      const timePart = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`;
      const isoDate = `${datePart}T${timePart}Z`;

      const { error } = await supabase
        .from("shipments")
        .update({ expected_arrival_date: isoDate })
        .eq("id", id);

      if (error) throw error;

      await queryClient.invalidateQueries({ queryKey: ["receipt", id] });
      setIsEditingTime(false);
      toast.success("Delivery time updated");
    } catch (error) {
      console.error("Failed to update delivery time", error);
      toast.error("Failed to update delivery time");
    } finally {
      setIsSaving(false);
    }
  };

  if (!data) return <div className="p-10 text-muted-foreground">Loading receipt…</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-slate-100 py-6">
      <div className="container mx-auto max-w-3xl px-4">
        {/* Toolbar */}
        <div className="no-print mb-4 flex flex-wrap items-center justify-between gap-3">
          <Button asChild variant="outline" size="sm">
            <Link to="/shipments/$id" params={{ id }}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Link>
          </Button>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <Printer className="mr-2 h-4 w-4" /> Print
            </Button>
            <Button variant="outline" size="sm" onClick={downloadImage} disabled={downloading}>
              <FileImage className="mr-2 h-4 w-4" /> Image
            </Button>
            <Button variant="outline" size="sm" onClick={downloadPdf} disabled={downloading}>
              <Download className="mr-2 h-4 w-4" /> PDF
            </Button>
            <Button variant="outline" size="sm" onClick={shareReceipt}>
              <Share2 className="mr-2 h-4 w-4" /> Share
            </Button>
          </div>
        </div>

        {/* Receipt — premium airway bill */}
        <div ref={ref} className="print-area mx-auto bg-white text-foreground shadow-[0_30px_80px_-30px_rgba(11,30,63,0.35)] ring-1 ring-navy/10">
          {/* Header */}
          <div className="relative flex items-center justify-between gap-3 border-b border-slate-300 px-8 pt-6 pb-4">
            <div className="w-[120px] flex-shrink-0">
              <div className="h-16 w-full overflow-hidden rounded-md bg-slate-200/60 ring-1 ring-slate-300/70">
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-r from-navy/80 via-navy to-pme-red text-[10px] font-semibold uppercase tracking-[0.25em] text-white">
                  PME Cargo
                </div>
              </div>
            </div>
            <div className="flex-1 text-center">
              <div className="text-display text-3xl font-extrabold leading-tight text-pme-red">Priority Mail Express</div>
              <div className="mt-0.5 text-[12px] font-semibold italic text-navy">International Special Delivery</div>
              <div className="mt-2 text-[10px] font-bold uppercase tracking-[0.25em] text-slate-500">Destination</div>
              <div className="text-display text-lg font-bold uppercase text-navy">{data.receiver_country ?? "—"}</div>
            </div>
            <div className="w-[120px] flex-shrink-0 flex justify-end">
              <Logo className="h-16 w-auto object-contain" />
            </div>
          </div>

          {/* FROM / SHIP TO */}
          <div className="flex border-b border-slate-300">
            <div className="flex-1 border-r border-slate-300">
              <div className="bg-slate-400/70 py-1.5 text-center text-[12px] font-bold tracking-[0.2em] text-white">FROM</div>
              <div className="space-y-2.5 px-5 py-4 text-[13px]">
                <Field label="SENDER NAME" value={data.sender_name} />
                <Field label="COUNTRY / CITY" value={[data.sender_city, data.sender_country].filter(Boolean).join(", ") || "—"} />
                {data.sender_phone && <Field label="PHONE" value={data.sender_phone} />}
              </div>
            </div>
            <div className="flex-1">
              <div className="bg-slate-400/70 py-1.5 text-center text-[12px] font-bold tracking-[0.2em] text-white">SHIP TO</div>
              <div className="space-y-2.5 px-5 py-4 text-[13px]">
                <Field label="RECEIVER NAME" value={data.receiver_name} />
                <Field label="COUNTRY / CITY" value={[data.receiver_city, data.receiver_country].filter(Boolean).join(", ") || "—"} />
                <Field label="HOME ADDRESS" value={data.receiver_address ?? "—"} />
              </div>
            </div>
          </div>

          {/* Delivery time + courier */}
          <div className="flex border-b border-slate-300 px-6 py-4 text-[13px]">
            <div className="flex-1 text-center group relative border-r border-slate-300">
              <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500">DELIVERY TIME</div>
              <div className="mt-1 flex items-center justify-center gap-2">
                {isEditingTime ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="time"
                      value={(() => {
                        const match = newTime.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
                        if (!match) return "";
                        let [_, h, m, ampm] = match;
                        let hours = parseInt(h);
                        if (ampm?.toUpperCase() === "PM" && hours < 12) hours += 12;
                        if (ampm?.toUpperCase() === "AM" && hours === 12) hours = 0;
                        return `${String(hours).padStart(2, "0")}:${m}`;
                      })()}
                      onChange={(e) => {
                        const [h, m] = e.target.value.split(":");
                        if (!h || !m) return;
                        let hours = parseInt(h);
                        const ampm = hours >= 12 ? "PM" : "AM";
                        hours = hours % 12 || 12;
                        setNewTime(`${hours}:${m} ${ampm}`);
                      }}
                      className="w-32 rounded border border-slate-300 px-2 py-0.5 text-center text-sm font-semibold text-navy focus:border-pme-red focus:outline-none"
                      autoFocus
                    />
                    <button onClick={saveDeliveryTime} disabled={isSaving} className="text-emerald-600 hover:text-emerald-700">
                      <Check className="h-4 w-4" />
                    </button>
                    <button onClick={() => setIsEditingTime(false)} className="text-rose-600 hover:text-rose-700">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="text-display text-base font-semibold text-navy">
                      {newTime || "12:30 PM"}
                    </div>
                    <button
                      onClick={() => setIsEditingTime(true)}
                      className="no-print text-slate-400 transition-colors hover:text-pme-red"
                      title="Edit delivery time"
                    >
                      <Clock className="h-3.5 w-3.5" />
                    </button>
                  </>
                )}
              </div>
            </div>
            <div className="flex-1">
              <CenterField label="COMPANY COURIER" value="ELITE COURIER" />
            </div>
          </div>

          {/* Charges + contents */}
          <div className="flex gap-4 border-b border-slate-300 px-6 py-5 text-[13px]">
            <div className="flex-1 border-r border-slate-300 pr-4">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Shipment registration charge</div>
              <div className="mt-0.5 text-display text-base font-bold text-navy">{formatMoney(data.registration_charge, data.currency)}</div>
              <div className="mt-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">Custom clearance charge</div>
              <div className="mt-0.5 text-display text-base font-bold text-navy">{formatMoney(data.custom_clearance_charge, data.currency)}</div>
            </div>
            <div className="w-[140px] text-center border-r border-slate-300 pr-4">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Piece / Weight</div>
              <div className="mt-1 text-display text-base font-bold text-navy">{String(data.quantity).padStart(2, "0")} | {data.weight_kg}</div>
            </div>
            <div className="flex-1 text-right">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Contents</div>
              <div className="mt-1 text-[13px] font-semibold text-navy leading-snug">{data.package_contents ?? data.package_description ?? "—"}</div>
            </div>
          </div>

          {/* Dates */}
          <div className="flex border-b border-slate-300 px-6 py-4 text-[13px]">
            <div className="flex-1 border-r border-slate-300">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Departure Date</div>
              <div className="mt-1 text-display text-base font-bold text-navy">{formatDate(data.departure_date)}</div>
            </div>
            <div className="flex-1 text-right">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Arrival Date</div>
              <div className="mt-1 text-display text-base font-bold text-navy">{formatDate(data.expected_arrival_date)}</div>
            </div>
          </div>

          {/* Barcode */}
          <div className="flex flex-col items-center border-b border-slate-300 px-6 py-6">
            <BarcodeImage value={data.tracking_number} className="max-w-md" />
            <div className="mt-2 font-mono text-sm tracking-wider text-foreground">{data.tracking_number}</div>
            <div className="mt-1 text-[11px] text-muted-foreground">Receipt: {data.receipt_number} · Issued {formatDateTime(data.created_at)}</div>
            <div className="mt-3 flex items-center gap-2 rounded-md border border-pme-red/30 bg-pme-red/5 px-3 py-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-pme-red">Verification Code</span>
              <span className="font-mono text-base font-bold tracking-[0.35em] text-navy">{getVerificationCode(data.receipt_number)}</span>
            </div>
            <div className="mt-1 text-[10px] text-slate-500">Confirm authenticity at prioritymailexpress.com/verify</div>
          </div>

          {/* QR + Trust */}
          <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="rounded-md bg-white p-1 ring-1 ring-slate-300">
                <QRCodeImage value={trackingUrl(data.tracking_number)} size={88} />
              </div>
              <div className="text-[11px] leading-tight text-slate-600">
                <div className="font-semibold text-navy">Scan to track live</div>
                Verify authenticity at<br />prioritymailexpress.com
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-md border border-slate-300 bg-slate-50 px-4 py-2">
              <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Secured · Safe Shopping</div>
              <div className="flex items-center gap-1 text-[11px] font-bold text-slate-700">
                <span className="rounded bg-blue-700 px-1.5 py-0.5 text-white">VISA</span>
                <span className="rounded bg-slate-800 px-1.5 py-0.5 text-white">MC</span>
                <span className="rounded bg-amber-500 px-1.5 py-0.5 text-white">AMEX</span>
                <span className="rounded bg-sky-600 px-1.5 py-0.5 text-white">PayPal</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-slate-300 bg-slate-50 px-6 py-3 text-center text-[10px] text-slate-600">
            This receipt is system-generated and verifiable online · Priority Mail Express · International Special Delivery · support@prioritymailexpress.com
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <div className="text-[11px] font-bold uppercase tracking-[0.15em] text-slate-700">{label}</div>
      <div className="mt-0.5 text-[13px] font-medium text-navy">{value}</div>
    </div>
  );
}
function CenterField({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <div className="text-[11px] font-bold uppercase tracking-[0.15em] text-slate-700">{label}</div>
      <div className="mt-1 text-display text-base font-semibold text-navy">{value}</div>
    </div>
  );
}
