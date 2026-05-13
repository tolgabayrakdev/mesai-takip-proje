type EventType = "mesai_baslat" | "mola_baslat" | "mola_bitis" | "mesai_bitir";
type Period = "daily" | "weekly" | "monthly";

export interface HistoryEntry {
  id: number;
  event_type: EventType;
  occurred_at: string;
  date: string;
  session_started: string;
  session_ended: string | null;
  total_break_minutes: number;
}

const EVENT_LABELS: Record<EventType, string> = {
  mesai_baslat: "Mesai Başlatıldı",
  mola_baslat: "Molaya Çıkıldı",
  mola_bitis: "Moladan Dönüldü",
  mesai_bitir: "Mesai Bitirildi",
};

const EVENT_COLOR: Record<EventType, string> = {
  mesai_baslat: "#16a34a",
  mola_baslat: "#d97706",
  mola_bitis: "#d97706",
  mesai_bitir: "#2563eb",
};

const PERIOD_LABELS: Record<Period, string> = {
  daily: "Günlük",
  weekly: "Haftalık",
  monthly: "Aylık",
};

function fmtTime(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
}

function fmtDate(dateStr: string) {
  return new Date(dateStr + "T12:00:00").toLocaleDateString("tr-TR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function fmtDateShort(dateStr: string) {
  return new Date(dateStr + "T12:00:00").toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function calcNet(started: string, ended: string | null, breakMin: number): string {
  if (!ended) return "Devam ediyor";
  const mins =
    Math.round((new Date(ended).getTime() - new Date(started).getTime()) / 60_000) - breakMin;
  if (mins <= 0) return "—";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}s ${m}dk` : `${m}dk`;
}

function calcNetMinutes(started: string, ended: string | null, breakMin: number): number | null {
  if (!ended) return null;
  const mins =
    Math.round((new Date(ended).getTime() - new Date(started).getTime()) / 60_000) - breakMin;
  return mins > 0 ? mins : null;
}

function groupByDay(entries: HistoryEntry[]): [string, HistoryEntry[]][] {
  const map = new Map<string, HistoryEntry[]>();
  for (const e of entries) {
    const day = e.date.slice(0, 10);
    if (!map.has(day)) map.set(day, []);
    map.get(day)!.push(e);
  }
  return [...map.entries()].sort((a, b) => b[0].localeCompare(a[0]));
}

// ─── PDF Export ────────────────────────────────────────────────────────────────

export function exportAdminPdf(employeeName: string, period: Period, entries: HistoryEntry[]) {
  const days = groupByDay(entries);
  const today = new Date().toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const dayBlocks = days
    .map(([day, dayEntries]) => {
      const first = dayEntries[0];
      const net = calcNet(first.session_started, first.session_ended, first.total_break_minutes);

      const eventRows = dayEntries
        .map(
          (e) => `
      <tr>
        <td>
          <span class="dot" style="background:${EVENT_COLOR[e.event_type]}"></span>
          ${EVENT_LABELS[e.event_type]}
        </td>
        <td class="time">${fmtTime(e.occurred_at)}</td>
      </tr>`
        )
        .join("");

      return `
    <div class="day-block">
      <div class="day-header">
        <div>
          <div class="day-title">${fmtDate(day)}</div>
          <div class="day-sub">${fmtTime(first.session_started)} — ${fmtTime(first.session_ended)}</div>
        </div>
        <div class="day-badges">
          ${first.session_ended ? `<span class="badge green">${net} çalışma</span>` : ""}
          ${
            first.total_break_minutes > 0
              ? `<span class="badge amber">${first.total_break_minutes} dk mola</span>`
              : `<span class="badge gray">Mola yok</span>`
          }
        </div>
      </div>
      <table>
        <thead><tr><th>Hareket</th><th>Saat</th></tr></thead>
        <tbody>${eventRows}</tbody>
      </table>
    </div>`;
    })
    .join("");

  // Özet istatistikler
  const completedDays = days.filter(([, de]) => de[0].session_ended !== null);
  const totalNetMins = completedDays.reduce((sum, [, de]) => {
    const mins = calcNetMinutes(
      de[0].session_started,
      de[0].session_ended,
      de[0].total_break_minutes
    );
    return sum + (mins ?? 0);
  }, 0);
  const totalBreakMins = days.reduce((sum, [, de]) => sum + de[0].total_break_minutes, 0);
  const avgNetMins = completedDays.length > 0 ? Math.round(totalNetMins / completedDays.length) : 0;

  function minsToStr(m: number) {
    const h = Math.floor(m / 60);
    const min = m % 60;
    return h > 0 ? `${h}s ${min}dk` : `${min}dk`;
  }

  const html = `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8"/>
  <title>Mesai Raporu – ${employeeName}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#111;padding:36px}
    header{display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:14px;border-bottom:2px solid #111;margin-bottom:20px}
    .brand{font-size:17px;font-weight:700}
    .brand span{font-size:11px;font-weight:400;color:#555;display:block;margin-top:2px}
    .meta{text-align:right;font-size:11px;color:#444;line-height:1.7}
    h2{font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:#555;margin-bottom:8px}
    .summary{display:flex;gap:16px;margin-bottom:24px}
    .s-item{background:#f4f4f5;border-radius:6px;padding:10px 14px;flex:1}
    .s-item .lbl{font-size:10px;color:#666;margin-bottom:3px}
    .s-item .val{font-size:15px;font-weight:700}
    .day-block{border:1px solid #e5e7eb;border-radius:8px;margin-bottom:12px;overflow:hidden;page-break-inside:avoid}
    .day-header{display:flex;justify-content:space-between;align-items:center;padding:10px 14px;background:#f9fafb;border-bottom:1px solid #e5e7eb}
    .day-title{font-size:12px;font-weight:600}
    .day-sub{font-size:11px;color:#6b7280;margin-top:2px}
    .day-badges{display:flex;gap:6px;flex-wrap:wrap}
    .badge{font-size:10px;font-weight:600;border-radius:999px;padding:2px 8px}
    .badge.green{background:#dcfce7;color:#15803d}
    .badge.amber{background:#fef3c7;color:#b45309}
    .badge.gray{background:#f3f4f6;color:#6b7280}
    table{width:100%;border-collapse:collapse}
    thead tr{background:#f9fafb}
    th{text-align:left;padding:6px 14px;font-size:10px;text-transform:uppercase;letter-spacing:.05em;color:#6b7280}
    td{padding:7px 14px;border-top:1px solid #f3f4f6;vertical-align:middle}
    .dot{display:inline-block;width:7px;height:7px;border-radius:50%;margin-right:7px;vertical-align:middle}
    td.time{font-weight:600;color:#374151;font-variant-numeric:tabular-nums}
    footer{margin-top:32px;font-size:10px;color:#9ca3af;text-align:center}
    @media print{body{padding:16px}@page{margin:1.2cm}}
  </style>
</head>
<body>
  <header>
    <div class="brand">
      YebSoft Mesai Takip
      <span>${PERIOD_LABELS[period]} Mesai Raporu</span>
    </div>
    <div class="meta">
      <strong>${employeeName}</strong><br/>
      Oluşturulma: ${today}<br/>
      Periyot: ${PERIOD_LABELS[period]} (${days.length} gün)
    </div>
  </header>

  <h2>Özet</h2>
  <div class="summary">
    <div class="s-item"><div class="lbl">Toplam Gün</div><div class="val">${days.length}</div></div>
    <div class="s-item"><div class="lbl">Toplam Net Çalışma</div><div class="val">${minsToStr(totalNetMins)}</div></div>
    <div class="s-item"><div class="lbl">Toplam Mola</div><div class="val">${minsToStr(totalBreakMins)}</div></div>
    <div class="s-item"><div class="lbl">Günlük Ort. Çalışma</div><div class="val">${minsToStr(avgNetMins)}</div></div>
  </div>

  <h2>Günlük Detay</h2>
  ${dayBlocks}

  <footer>Bu belge YebSoft Mesai Takip sistemi tarafından otomatik oluşturulmuştur.</footer>
  <script>window.onload=()=>{window.print();window.onafterprint=()=>window.close()}</script>
</body>
</html>`;

  const win = window.open("", "_blank", "width=860,height=700");
  if (!win) return;
  win.document.write(html);
  win.document.close();
}

// ─── CSV Export ────────────────────────────────────────────────────────────────

export function exportAdminCsv(employeeName: string, period: Period, entries: HistoryEntry[]) {
  const days = groupByDay(entries);

  const headers = [
    "Tarih",
    "Gün",
    "Giriş Saati",
    "Çıkış Saati",
    "Toplam Mola (dk)",
    "Net Çalışma (dk)",
    "Net Çalışma",
    "Hareketler",
  ];

  const rows = days.map(([day, dayEntries]) => {
    const first = dayEntries[0];
    const netMins = calcNetMinutes(
      first.session_started,
      first.session_ended,
      first.total_break_minutes
    );
    const dayName = new Date(day + "T12:00:00").toLocaleDateString("tr-TR", { weekday: "long" });
    const eventLog = dayEntries
      .map((e) => `${EVENT_LABELS[e.event_type]} (${fmtTime(e.occurred_at)})`)
      .join(" | ");

    return [
      fmtDateShort(day),
      dayName,
      fmtTime(first.session_started),
      fmtTime(first.session_ended),
      first.total_break_minutes.toString(),
      netMins !== null ? netMins.toString() : "",
      netMins !== null
        ? calcNet(first.session_started, first.session_ended, first.total_break_minutes)
        : "Devam ediyor",
      eventLog,
    ];
  });

  const escape = (val: string) => `"${val.replace(/"/g, '""')}"`;
  const csvLines = [
    // Başlık satırı: personel adı ve periyot bilgisi
    escape(`Personel: ${employeeName}`),
    escape(`Periyot: ${PERIOD_LABELS[period]}`),
    escape(`Oluşturulma: ${new Date().toLocaleDateString("tr-TR")}`),
    "",
    headers.map(escape).join(","),
    ...rows.map((r) => r.map(escape).join(",")),
  ];

  // BOM ekle → Excel'de Türkçe karakterler düzgün görünsün
  const blob = new Blob(["﻿" + csvLines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `mesai_${employeeName.replace(/\s+/g, "_")}_${period}_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
