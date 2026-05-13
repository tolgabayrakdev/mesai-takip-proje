import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import QRCode from "qrcode";
import { ArrowLeft, Download, Printer, QrCode } from "lucide-react";

export default function AdminQrCode() {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const qrUrl = `${window.location.origin}/qr`;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    QRCode.toCanvas(canvas, qrUrl, {
      width: 280,
      margin: 3,
      color: { dark: "#000000", light: "#ffffff" },
    }).then(() => {
      setQrDataUrl(canvas.toDataURL("image/png"));
    });
  }, [qrUrl]);

  function handleDownload() {
    if (!qrDataUrl) return;
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = "mesai-qr-kodu.png";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  function handlePrint() {
    const html = `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8"/>
  <title>Mesai QR Kodu</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:Arial,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#fff}
    .card{text-align:center;padding:40px;border:2px solid #000;border-radius:16px;max-width:380px;width:100%}
    h1{font-size:22px;font-weight:700;margin-bottom:4px}
    p{font-size:13px;color:#555;margin-bottom:24px}
    img{width:260px;height:260px;display:block;margin:0 auto 20px}
    .url{font-size:11px;color:#888;word-break:break-all}
    .steps{text-align:left;margin-top:20px;font-size:12px;color:#444;line-height:2}
    @media print{body{min-height:unset}@page{margin:1cm}}
  </style>
</head>
<body>
  <div class="card">
    <h1>Mesai Giriş / Çıkış</h1>
    <p>Telefonunuzla aşağıdaki QR kodu okutun</p>
    <img src="${qrDataUrl}" alt="QR Kod"/>
    <div class="steps">
      <strong>Nasıl kullanılır?</strong><br/>
      1. Telefon kameranızı açın<br/>
      2. QR kodu okutun<br/>
      3. Açılan sayfada işleminizi yapın
    </div>
    <p class="url" style="margin-top:16px">${qrUrl}</p>
  </div>
  <script>window.onload=()=>{window.print();window.onafterprint=()=>window.close()}</script>
</body>
</html>`;

    const win = window.open("", "_blank", "width=500,height=650");
    if (!win) return;
    win.document.write(html);
    win.document.close();
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      {/* Başlık */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("/admin")}
          className="bg-card hover:bg-muted text-muted-foreground hover:text-foreground flex h-8 w-8 items-center justify-center rounded-lg border transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-xl font-bold tracking-tight">QR Kod Yönetimi</h1>
          <p className="text-muted-foreground mt-0.5 flex items-center gap-1 text-xs">
            <QrCode className="h-3 w-3" />
            Personel giriş/çıkış kodu
          </p>
        </div>
      </div>

      {/* QR Kartı */}
      <div className="bg-card overflow-hidden rounded-xl border">
        <div className="bg-muted/30 border-b px-5 py-3.5">
          <p className="text-sm font-semibold">Duvar QR Kodu</p>
          <p className="text-muted-foreground mt-0.5 text-xs">
            Bu kodu yazdırıp ofis girişine asın. Personel telefonuyla okutarak mesai işlemi
            yapabilir.
          </p>
        </div>

        <div className="flex flex-col items-center gap-6 p-8">
          {/* QR Canvas */}
          <div className="border-border rounded-2xl border-2 bg-white p-4">
            <canvas ref={canvasRef} />
          </div>

          {/* URL bilgisi */}
          <div className="text-center">
            <p className="text-muted-foreground text-xs">Kodlanan adres:</p>
            <p className="mt-0.5 font-mono text-sm font-medium break-all">{qrUrl}</p>
          </div>

          {/* Butonlar */}
          <div className="flex w-full gap-3">
            <button
              onClick={handleDownload}
              disabled={!qrDataUrl}
              className="bg-card hover:bg-muted flex flex-1 items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition-colors disabled:opacity-40"
            >
              <Download className="h-4 w-4" />
              PNG İndir
            </button>
            <button
              onClick={handlePrint}
              disabled={!qrDataUrl}
              className="bg-primary text-primary-foreground hover:bg-primary/90 flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition-colors disabled:opacity-40"
            >
              <Printer className="h-4 w-4" />
              Yazdır
            </button>
          </div>
        </div>
      </div>

      {/* Kullanım kılavuzu */}
      <div className="bg-card space-y-4 rounded-xl border p-5">
        <p className="text-sm font-semibold">Nasıl Çalışır?</p>
        <ol className="text-muted-foreground space-y-3 text-sm">
          {[
            "QR kodu yazdırıp ofis girişine veya çıkışına asın.",
            "Personel telefon kamerası ile kodu okuttuğunda uygulama açılır.",
            "Uygulamaya giriş yapmamışlarsa önce oturum açmaları istenir; açtıktan sonra otomatik geri dönerler.",
            "Sayfa, personelin mevcut mesai durumuna göre uygun aksiyonu (mesai başlat, molaya çık vb.) gösterir.",
            "Personel butona basarak işlemi tamamlar.",
          ].map((step, i) => (
            <li key={i} className="flex gap-3">
              <span className="bg-muted text-foreground flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold">
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
