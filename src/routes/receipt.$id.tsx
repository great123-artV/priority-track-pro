import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { QRCodeImage, BarcodeImage } from "@/components/QRCodeImage";
import { Logo } from "@/components/Logo";
import { formatDate, formatDateTime, formatMoney, trackingUrl } from "@/lib/pme";
import { Printer, Download, ArrowLeft, Share2, FileImage, Check, X, Clock } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";

export const Route = createFileRoute("/receipt/$id")({
  head: ({ params }) => ({ meta: [{ title: `Receipt ${params.id} — PME` }] }),
  component: ReceiptPage,
});

const getHtml2CanvasConfig = (sourceRef: React.RefObject<HTMLDivElement>) => ({
  scale: 2,
  backgroundColor: "#ffffff",
  useCORS: true,
  logging: false,
  width: sourceRef.current?.scrollWidth,
  height: sourceRef.current?.scrollHeight,
  windowWidth: sourceRef.current?.scrollWidth,
  windowHeight: sourceRef.current?.scrollHeight,
  onclone: (clonedDoc: Document) => {
    const el = clonedDoc.querySelector(".print-area") as HTMLElement;
    if (el) {
      el.style.transform = "none";
      el.style.boxShadow = "none";
      el.style.border = "none";
      el.style.margin = "0";
      el.style.padding = "0";
      el.style.width = `${sourceRef.current?.scrollWidth}px`;
    }

    // Force HEX colors on root (html2canvas doesn't support oklch)
    const root = clonedDoc.documentElement;
    root.style.setProperty("--pme-red", "#E21D12");
    root.style.setProperty("--pme-blue", "#1E40AF");
    root.style.setProperty("--navy", "#0B1E3F");
    root.style.setProperty("--navy-deep", "#081226");
    root.style.setProperty("--foreground", "#1A2B4B");
    root.style.setProperty("--background", "#ffffff");
    root.style.setProperty("--surface", "#f8fafc");
    root.style.setProperty("--border", "#cbd5e1");
    root.style.setProperty("--card", "#ffffff");
    root.style.setProperty("--muted", "#f1f5f9");
    root.style.setProperty("--accent", "#f1f5f9");

    const style = clonedDoc.createElement("style");
    style.innerHTML = `
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
    `;
    clonedDoc.head.appendChild(style);

    // Remove oklch rules from existing stylesheets to prevent crash
    try {
      for (const sheet of Array.from(clonedDoc.styleSheets)) {
        try {
          const s = sheet as CSSStyleSheet;
          for (let i = s.cssRules.length - 1; i >= 0; i--) {
            if (s.cssRules[i].cssText.includes("oklch")) {
              s.deleteRule(i);
            }
          }
        } catch (e) { /* ignore cross-origin */ }
      }
    } catch (e) { /* ignore */ }

    // Clean up potentially problematic SVGs (like icons) while keeping canvases (QR/Barcode)
    clonedDoc.querySelectorAll("svg").forEach((svg) => {
      // Most SVGs in this app use oklch which crashes html2canvas.
      // We'll replace them with HEX or remove them if they are just icons.
      const isLarge = svg.getBoundingClientRect().width > 100;
      if (!isLarge || svg.parentElement?.classList.contains("no-print")) {
        svg.remove();
      } else {
        svg.setAttribute("fill", "#0B1E3F");
        svg.setAttribute("stroke", "#0B1E3F");
        svg.querySelectorAll("*").forEach(child => {
          if (child.getAttribute("fill")?.includes("oklch")) child.setAttribute("fill", "#0B1E3F");
          if (child.getAttribute("stroke")?.includes("oklch")) child.setAttribute("stroke", "#0B1E3F");
        });
      }
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

  const downloadPdf = async () => {
    if (!ref.current) return;
    setDownloading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const html2canvas = (await import("html2canvas")).default;
      const { default: jsPDF } = await import("jspdf");

      const canvas = await html2canvas(ref.current, getHtml2CanvasConfig(ref));
      const img = canvas.toDataURL("image/png");

      const imgProps = { width: canvas.width, height: canvas.height };
      const pdfWidth = 210;
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      const pdf = new jsPDF({
        orientation: pdfHeight > pdfWidth ? "portrait" : "landscape",
        unit: "mm",
        format: [pdfWidth, pdfHeight]
      });

      pdf.addImage(img, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${data?.receipt_number ?? "PME-receipt"}.pdf`);
      toast.success("PDF downloaded successfully");
    } catch (error) {
      console.error("PDF download failed", error);
      toast.error("Failed to download PDF");
    } finally { setDownloading(false); }
  };

  const downloadImage = async () => {
    if (!ref.current) return;
    setDownloading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(ref.current, getHtml2CanvasConfig(ref));
      const link = document.createElement("a");
      link.download = `${data?.receipt_number ?? "PME-receipt"}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      toast.success("Image downloaded successfully");
    } catch (error) {
      console.error("Image download failed", error);
      toast.error("Failed to download image");
    } finally { setDownloading(false); }
  };

  const shareReceipt = async () => {
    if (!ref.current) return;
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(ref.current, getHtml2CanvasConfig(ref));

      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File([blob], `${data?.receipt_number ?? "receipt"}.png`, { type: "image/png" });

        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: `PME Receipt ${data?.receipt_number}`,
            text: `Receipt for shipment ${data?.tracking_number}`,
          });
        } else {
          if (navigator.share) {
            await navigator.share({
              title: `PME Receipt ${data?.receipt_number}`,
              url: window.location.href,
            });
          } else {
            await navigator.clipboard.writeText(window.location.href);
            toast.success("Receipt link copied to clipboard");
          }
        }
      }, "image/png");
    } catch (error) {
      console.error("Sharing failed", error);
      toast.error("Failed to share receipt");
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
          <div className="relative grid grid-cols-12 items-center gap-3 border-b border-slate-300 px-8 pt-6 pb-4">
            <div className="col-span-3">
              <div className="h-20 w-full overflow-hidden rounded-md bg-slate-200/60 ring-1 ring-slate-300/70">
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-r from-navy/80 via-navy to-pme-red text-[10px] font-semibold uppercase tracking-[0.25em] text-white">
                  PME Cargo
                </div>
              </div>
            </div>
            <div className="col-span-6 text-center">
              <div className="text-display text-3xl font-extrabold leading-none text-pme-red">Priority Mail Express</div>
              <div className="mt-1 text-[13px] font-semibold italic text-navy">International Special Delivery</div>
              <div className="mt-3 text-[11px] font-bold uppercase tracking-[0.3em] text-slate-600">Destination</div>
              <div className="text-display text-lg font-bold uppercase text-navy">{data.receiver_country ?? "—"}</div>
            </div>
            <div className="col-span-3 flex items-center justify-end">
              <Logo className="h-20 w-auto object-contain" />
            </div>
          </div>

          {/* FROM / SHIP TO */}
          <div className="grid grid-cols-2 border-b border-slate-300">
            <div className="border-r border-slate-300">
              <div className="bg-slate-400/70 py-2 text-center text-[13px] font-bold tracking-[0.2em] text-white">FROM</div>
              <div className="space-y-3 px-6 py-5 text-[13px]">
                <Field label="SENDER NAME" value={data.sender_name} />
                <Field label="COUNTRY / CITY" value={[data.sender_city, data.sender_country].filter(Boolean).join(", ") || "—"} />
                {data.sender_phone && <Field label="PHONE" value={data.sender_phone} />}
              </div>
            </div>
            <div>
              <div className="bg-slate-400/70 py-2 text-center text-[13px] font-bold tracking-[0.2em] text-white">SHIP TO</div>
              <div className="space-y-3 px-6 py-5 text-[13px]">
                <Field label="RECEIVER NAME" value={data.receiver_name} />
                <Field label="COUNTRY / CITY" value={[data.receiver_city, data.receiver_country].filter(Boolean).join(", ") || "—"} />
                <Field label="HOME ADDRESS" value={data.receiver_address ?? "—"} />
              </div>
            </div>
          </div>

          {/* Delivery time + courier */}
          <div className="grid grid-cols-2 border-b border-slate-300 px-6 py-4 text-[13px]">
            <div className="text-center group relative">
              <div className="text-[11px] font-bold uppercase tracking-[0.15em] text-slate-700">DELIVERY TIME</div>
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
            <CenterField label="COMPANY COURIER" value="ELITE COURIER" />
          </div>

          {/* Charges + contents */}
          <div className="grid grid-cols-3 gap-4 border-b border-slate-300 px-6 py-5 text-[13px]">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-600">Shipment registration charge</div>
              <div className="mt-1 text-display text-base font-bold text-navy">{formatMoney(data.registration_charge, data.currency)}</div>
              <div className="mt-3 text-[11px] font-bold uppercase tracking-wider text-slate-600">Custom clearance charge</div>
              <div className="mt-1 text-display text-base font-bold text-navy">{formatMoney(data.custom_clearance_charge, data.currency)}</div>
            </div>
            <div className="text-center">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-600">Piece / Weight</div>
              <div className="mt-1 text-display text-base font-bold text-navy">{String(data.quantity).padStart(2, "0")} | {data.weight_kg}</div>
            </div>
            <div className="text-right">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-600">Contents</div>
              <div className="mt-1 text-[13px] font-semibold text-navy">{data.package_contents ?? data.package_description ?? "—"}</div>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 border-b border-slate-300 px-6 py-4 text-[13px]">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-600">Departure Date</div>
              <div className="mt-1 text-display text-base font-bold text-navy">{formatDate(data.departure_date)}</div>
            </div>
            <div className="text-right">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-600">Arrival Date</div>
              <div className="mt-1 text-display text-base font-bold text-navy">{formatDate(data.expected_arrival_date)}</div>
            </div>
          </div>

          {/* Barcode */}
          <div className="flex flex-col items-center border-b border-slate-300 px-6 py-6">
            <BarcodeImage value={data.tracking_number} className="max-w-md" />
            <div className="mt-2 font-mono text-sm tracking-wider text-foreground">{data.tracking_number}</div>
            <div className="mt-1 text-[11px] text-muted-foreground">Receipt: {data.receipt_number} · Issued {formatDateTime(data.created_at)}</div>
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
