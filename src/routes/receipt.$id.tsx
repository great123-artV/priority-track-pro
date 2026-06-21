import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { QRCodeImage, BarcodeImage } from "@/components/QRCodeImage";
import { Logo } from "@/components/Logo";
import { STATUS_LABELS, PAYMENT_LABELS, formatDate, formatDateTime, formatMoney, trackingUrl } from "@/lib/pme";
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
    <div className="min-h-screen bg-surface py-6">
      <div className="container mx-auto max-w-4xl px-4">
        {/* Toolbar */}
        <div className="no-print mb-4 flex flex-wrap items-center justify-between gap-3">
          <Button asChild variant="outline"><Link to="/shipments/$id" params={{ id }}><ArrowLeft className="mr-2 h-4 w-4" /> Back</Link></Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => window.print()}><Printer className="mr-2 h-4 w-4" /> Print</Button>
            <Button onClick={downloadPdf} disabled={downloading} className="bg-pme-red text-pme-red-foreground hover:bg-pme-red/90"><Download className="mr-2 h-4 w-4" /> {downloading ? "Generating…" : "Download PDF"}</Button>
          </div>
        </div>

        {/* Receipt */}
        <div ref={ref} className="print-area mx-auto rounded-xl border-2 border-navy/20 bg-white p-8 text-sm text-foreground shadow-card">
          {/* Header */}
          <div className="flex items-start justify-between border-b-4 border-pme-red pb-4">
            <div className="flex items-center gap-3">
              <Logo className="h-16 w-16" />
              <div>
                <div className="text-display text-2xl font-bold text-navy">PRIORITY MAIL EXPRESS</div>
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-pme-red">International Special Delivery</div>
              </div>
            </div>
            <div className="text-right text-xs">
              <div className="text-display text-base font-bold text-navy">AIRWAY BILL</div>
              <div className="text-muted-foreground">Receipt No: <span className="font-mono font-semibold text-foreground">{data.receipt_number}</span></div>
              <div className="text-muted-foreground">AWB No: <span className="font-mono font-semibold text-foreground">{data.tracking_number}</span></div>
              <div className="text-muted-foreground">Date: <span className="font-semibold text-foreground">{formatDateTime(data.created_at)}</span></div>
              <div className="text-muted-foreground">Branch: <span className="font-semibold text-foreground">{data.origin?.name ?? "—"}</span></div>
            </div>
          </div>

          {/* From / To */}
          <div className="mt-5 grid grid-cols-2 gap-4">
            <Box title="FROM (Sender)">
              <div className="font-semibold">{data.sender_name}</div>
              {data.sender_phone && <div>{data.sender_phone}</div>}
              <div>{[data.sender_city, data.sender_country].filter(Boolean).join(", ")}</div>
              {data.sender_address && <div className="text-muted-foreground">{data.sender_address}</div>}
            </Box>
            <Box title="SHIP TO (Receiver)">
              <div className="font-semibold">{data.receiver_name}</div>
              {data.receiver_phone && <div>{data.receiver_phone}</div>}
              <div>{[data.receiver_city, data.receiver_country].filter(Boolean).join(", ")}</div>
              {data.receiver_address && <div className="text-muted-foreground">{data.receiver_address}</div>}
            </Box>
          </div>

          {/* Shipment details */}
          <div className="mt-5">
            <SectionTitle>SHIPMENT DETAILS</SectionTitle>
            <table className="mt-2 w-full border-collapse text-xs">
              <tbody>
                <Row k="Package Description" v={data.package_description ?? "—"} />
                <Row k="Contents" v={data.package_contents ?? "—"} />
                <Row k="Quantity" v={String(data.quantity)} k2="Weight" v2={`${data.weight_kg} kg`} />
                <Row k="Service Type" v={data.delivery_type} k2="Delivery Time" v2={data.expected_arrival_date ? "By " + formatDate(data.expected_arrival_date) : "—"} />
                <Row k="Departure Date" v={formatDate(data.departure_date)} k2="Expected Arrival" v2={formatDate(data.expected_arrival_date)} />
                <Row k="Current Status" v={STATUS_LABELS[data.current_status]} />
              </tbody>
            </table>
          </div>

          {/* Payment */}
          <div className="mt-5">
            <SectionTitle>PAYMENT DETAILS</SectionTitle>
            <table className="mt-2 w-full border-collapse text-xs">
              <tbody>
                <Row k="Registration Charge" v={formatMoney(data.registration_charge, data.currency)} />
                <Row k="Custom Clearance" v={formatMoney(data.custom_clearance_charge, data.currency)} />
                <Row k="Insurance Fee" v={formatMoney(data.insurance_fee, data.currency)} />
                <Row k="Handling Fee" v={formatMoney(data.handling_fee, data.currency)} />
                <Row k="Discount" v={`- ${formatMoney(data.discount, data.currency)}`} />
                <tr className="bg-pme-red/10">
                  <td className="border border-navy/20 px-2 py-1.5 font-bold text-navy">TOTAL AMOUNT</td>
                  <td className="border border-navy/20 px-2 py-1.5 text-right text-display text-base font-bold text-pme-red">{formatMoney(data.total_amount, data.currency)}</td>
                </tr>
                <Row k="Payment Status" v={PAYMENT_LABELS[data.payment_status]} k2="Method" v2={data.payment_method ?? "—"} />
              </tbody>
            </table>
          </div>

          {/* QR + Barcode */}
          <div className="mt-6 grid grid-cols-3 gap-4 rounded-lg border border-navy/20 bg-surface p-4">
            <div className="flex flex-col items-center justify-center">
              <QRCodeImage value={trackingUrl(data.tracking_number)} size={140} />
              <div className="mt-1 text-[10px] text-muted-foreground">Scan to track</div>
            </div>
            <div className="col-span-2 flex flex-col justify-center">
              <BarcodeImage value={data.tracking_number} className="w-full" />
              <div className="mt-2 text-center font-mono text-xs">{data.tracking_number}</div>
              <p className="mt-3 text-xs text-muted-foreground">
                Scan QR code to track shipment movement and verify receipt authenticity at
                prioritymailexpress.com.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 border-t border-border pt-3 text-center text-[10px] text-muted-foreground">
            This receipt is system-generated and verifiable online. Keep it safe for your records.
            <br />Priority Mail Express · International Special Delivery · support@prioritymailexpress.com
          </div>
        </div>
      </div>
    </div>
  );
}

function Box({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-md border border-navy/30 bg-surface/50 p-3">
      <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-pme-red">{title}</div>
      <div className="space-y-0.5 text-xs">{children}</div>
    </div>
  );
}
function SectionTitle({ children }: { children: React.ReactNode }) {
  return <div className="rounded-t-md bg-navy px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-navy-foreground">{children}</div>;
}
function Row({ k, v, k2, v2 }: { k: string; v: string; k2?: string; v2?: string }) {
  return (
    <tr>
      <td className="w-1/4 border border-navy/20 bg-muted/40 px-2 py-1.5 font-semibold">{k}</td>
      <td className={`border border-navy/20 px-2 py-1.5 ${k2 ? "w-1/4" : ""}`}>{v}</td>
      {k2 && <td className="w-1/4 border border-navy/20 bg-muted/40 px-2 py-1.5 font-semibold">{k2}</td>}
      {k2 && <td className="border border-navy/20 px-2 py-1.5">{v2}</td>}
    </tr>
  );
}
