interface ShiftEvent {
  event_type: "mesai_baslat" | "mola_baslat" | "mola_bitis" | "mesai_bitir";
  occurred_at: string;
}

interface PrintPdfOptions {
  fullName: string;
  date: Date;
  events: ShiftEvent[];
  totalBreakMinutes: number;
}

const EVENT_LABELS: Record<ShiftEvent["event_type"], string> = {
  mesai_baslat: "Mesai Başlatıldı",
  mola_baslat: "Molaya Çıkıldı",
  mola_bitis: "Moladan Dönüldü",
  mesai_bitir: "Mesai Bitirildi",
};

const EVENT_COLOR: Record<ShiftEvent["event_type"], string> = {
  mesai_baslat: "#16a34a",
  mola_baslat: "#d97706",
  mola_bitis: "#d97706",
  mesai_bitir: "#2563eb",
};

function fmt(iso: string) {
  return new Date(iso).toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function calcNetMinutes(events: ShiftEvent[], totalBreakMinutes: number): number | null {
  const start = events.find((e) => e.event_type === "mesai_baslat");
  const end = events.find((e) => e.event_type === "mesai_bitir");
  if (!start || !end) return null;
  const totalMs = new Date(end.occurred_at).getTime() - new Date(start.occurred_at).getTime();
  return Math.floor(totalMs / 60_000) - totalBreakMinutes;
}

export function printShiftPdf({ fullName, date, events, totalBreakMinutes }: PrintPdfOptions) {
  const dateStr = date.toLocaleDateString("tr-TR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const netMinutes = calcNetMinutes(events, totalBreakMinutes);
  const netStr = netMinutes !== null
    ? `${Math.floor(netMinutes / 60)}s ${netMinutes % 60}dk`
    : "-";

  const rows = events
    .map(
      (e) => `
      <tr>
        <td>
          <span class="dot" style="background:${EVENT_COLOR[e.event_type]}"></span>
          ${EVENT_LABELS[e.event_type]}
        </td>
        <td class="time">${fmt(e.occurred_at)}</td>
      </tr>`
    )
    .join("");

  const html = `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8" />
  <title>Mesai Raporu – ${fullName}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, Helvetica, sans-serif; font-size: 13px; color: #111; padding: 40px; }
    header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 16px; border-bottom: 2px solid #111; margin-bottom: 24px; }
    header .brand { font-size: 18px; font-weight: 700; }
    header .brand span { font-size: 11px; font-weight: 400; color: #555; display: block; margin-top: 2px; }
    header .meta { text-align: right; font-size: 12px; color: #444; line-height: 1.6; }
    h2 { font-size: 14px; font-weight: 600; margin-bottom: 10px; color: #333; text-transform: uppercase; letter-spacing: 0.05em; }
    .summary { display: flex; gap: 24px; margin-bottom: 28px; }
    .summary-item { background: #f4f4f5; border-radius: 6px; padding: 12px 18px; flex: 1; }
    .summary-item .label { font-size: 11px; color: #666; margin-bottom: 4px; }
    .summary-item .value { font-size: 16px; font-weight: 700; }
    table { width: 100%; border-collapse: collapse; }
    thead tr { background: #f4f4f5; }
    th { text-align: left; padding: 8px 12px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #555; }
    td { padding: 10px 12px; border-bottom: 1px solid #e5e7eb; vertical-align: middle; }
    td .dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-right: 8px; vertical-align: middle; }
    td.time { font-variant-numeric: tabular-nums; font-weight: 600; color: #374151; }
    footer { margin-top: 40px; font-size: 11px; color: #aaa; text-align: center; }
    @media print {
      body { padding: 20px; }
      @page { margin: 1.5cm; }
    }
  </style>
</head>
<body>
  <header>
    <div class="brand">
      YebSoft Mesai Takip
      <span>Günlük Mesai Raporu</span>
    </div>
    <div class="meta">
      <strong>${fullName}</strong><br/>
      ${dateStr}
    </div>
  </header>

  <h2>Özet</h2>
  <div class="summary">
    <div class="summary-item">
      <div class="label">Toplam Mola</div>
      <div class="value">${totalBreakMinutes} dk</div>
    </div>
    <div class="summary-item">
      <div class="label">Net Çalışma</div>
      <div class="value">${netStr}</div>
    </div>
    <div class="summary-item">
      <div class="label">Toplam Hareket</div>
      <div class="value">${events.length}</div>
    </div>
  </div>

  <h2>Hareket Geçmişi</h2>
  <table>
    <thead>
      <tr>
        <th>Hareket</th>
        <th>Saat</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>

  <footer>Bu belge YebSoft Mesai Takip sistemi tarafından otomatik oluşturulmuştur.</footer>

  <script>window.onload = () => { window.print(); window.onafterprint = () => window.close(); }</script>
</body>
</html>`;

  const win = window.open("", "_blank", "width=800,height=600");
  if (!win) return;
  win.document.write(html);
  win.document.close();
}
