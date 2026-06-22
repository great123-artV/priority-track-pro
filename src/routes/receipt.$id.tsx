import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { QRCodeImage, BarcodeImage } from "@/components/QRCodeImage";
import { Logo } from "@/components/Logo";
import { formatDate, formatDateTime, formatMoney, trackingUrl } from "@/lib/pme";
import { Printer, Download, ArrowLeft } from "lucide-react";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/receipt/$id")({
  head: ({ params }) => ({ meta: [{ title: `Receipt ${params.id} — PME` }] }),
  component: ReceiptPage,
});

function ReceiptPage() {
  const { id } = Route.useParams();
  const ref = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  const { data } = useQuery({
    queryKey: ["receipt", id],
    queryFn: async () => {
      const { data: s } = await supabase
        .from("shipments")
        .select("*, origin:branches!shipments_origin_branch_id_fkey(name,city,country,address,phone)")
        .eq("id", id).maybeSingle();
      return s;
    },
  });

  const downloadPdf = async () => {
    if (!ref.current) return;
    setDownloading(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const { default: jsPDF } = await import("jspdf");
      const canvas = await html2canvas(ref.current, { scale: 2, backgroundColor: "#ffffff" });
      const img = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ unit: "mm", format: "a4" });
      const w = pdf.internal.pageSize.getWidth();
      const h = (canvas.height * w) / canvas.width;
      pdf.addImage(img, "PNG", 0, 0, w, h);
      pdf.save(`${data?.receipt_number ?? "PME-receipt"}.pdf`);
    } finally { setDownloading(false); }
  };

  if (!data) return <div className="p-10 text-muted-foreground">Loading receipt…</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-slate-100 py-6">
      <div className="container mx-auto max-w-3xl px-4">
        {/* Toolbar */}
        <div className="no-print mb-4 flex flex-wrap items-center justify-between gap-3">
          <Button asChild variant="outline"><Link to="/shipments/$id" params={{ id }}><ArrowLeft className="mr-2 h-4 w-4" /> Back</Link></Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => window.print()}><Printer className="mr-2 h-4 w-4" /> Print</Button>
            <Button onClick={downloadPdf} disabled={downloading} className="bg-pme-red text-pme-red-foreground hover:bg-pme-red/90"><Download className="mr-2 h-4 w-4" /> {downloading ? "Generating…" : "Download PDF"}</Button>
          </div>
        </div>

        {/* Receipt — premium airway bill */}
        <div ref={ref} className="print-area mx-auto bg-white text-foreground shadow-[0_30px_80px_-30px_rgba(11,30,63,0.35)] ring-1 ring-navy/10">
          {/* Header */}
          <div className="relative grid grid-cols-12 items-center gap-3 border-b border-slate-300 px-8 pt-6 pb-4">
            <div className="col-span-3">
              <div className="h-20 w-full overflow-hidden rounded-md bg-slate-200/60 ring-1 ring-slate-300/70">
                {/* decorative aircraft strip; logo on right preserves brand */}
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
            <CenterField label="DELIVERY TIME" value={data.expected_arrival_date ? new Date(data.expected_arrival_date).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "12:30 PM"} />
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
