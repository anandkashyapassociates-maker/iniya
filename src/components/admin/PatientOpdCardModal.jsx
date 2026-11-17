import React, { useRef, useState, useEffect } from 'react';
import {
  HeartPulse,
  X,
  Download,
  Printer,
} from 'lucide-react';
import { getImageUrl } from '../../utils/imageUrl';
import { useToast } from '../../context/ToastContext';

// Native Canvas 2D OPD Card Generator (100% reliable, zero CSS/oklch parser issues)
const generateCardCanvas = async (customer, clinicName, recordId) => {
  const canvas = document.createElement('canvas');
  // Dimensions: 840 x 500 px (Retina 2x of 420x250)
  canvas.width = 840;
  canvas.height = 500;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');

  // Helper for drawing rounded rectangle
  const drawRoundRect = (x, y, w, h, r) => {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  };

  // 1. Base Card Shape Clip
  drawRoundRect(20, 20, 800, 460, 28);
  ctx.save();
  ctx.clip();

  // 2. Midnight Dark Gradient Background (#020617 - #0f172a - #020617)
  const bg = ctx.createLinearGradient(20, 20, 820, 480);
  bg.addColorStop(0, '#020617');
  bg.addColorStop(0.5, '#0f172a');
  bg.addColorStop(1, '#020617');
  ctx.fillStyle = bg;
  ctx.fillRect(20, 20, 800, 460);

  // 3. Subtle Ambient Light Glows
  const glowTop = ctx.createRadialGradient(720, 60, 5, 720, 60, 220);
  glowTop.addColorStop(0, 'rgba(99, 102, 241, 0.28)'); // Indigo
  glowTop.addColorStop(1, 'rgba(99, 102, 241, 0)');
  ctx.fillStyle = glowTop;
  ctx.fillRect(20, 20, 800, 460);

  const glowBottom = ctx.createRadialGradient(100, 420, 5, 100, 420, 220);
  glowBottom.addColorStop(0, 'rgba(6, 182, 212, 0.22)'); // Cyan
  glowBottom.addColorStop(1, 'rgba(6, 182, 212, 0)');
  ctx.fillStyle = glowBottom;
  ctx.fillRect(20, 20, 800, 460);

  ctx.restore();

  // 4. Outer Border
  drawRoundRect(20, 20, 800, 460, 28);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.lineWidth = 2;
  ctx.stroke();

  // 5. Header Section
  // Rose HeartPulse Box
  drawRoundRect(55, 52, 52, 52, 14);
  const roseGrad = ctx.createLinearGradient(55, 52, 107, 104);
  roseGrad.addColorStop(0, '#f43f5e');
  roseGrad.addColorStop(1, '#db2777');
  ctx.fillStyle = roseGrad;
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Heart Pulse Icon Line
  ctx.save();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(67, 78);
  ctx.lineTo(73, 78);
  ctx.lineTo(76, 70);
  ctx.lineTo(80, 86);
  ctx.lineTo(85, 68);
  ctx.lineTo(89, 81);
  ctx.lineTo(92, 78);
  ctx.lineTo(95, 78);
  ctx.stroke();
  ctx.restore();

  // Header Title & Subtitle
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
  ctx.fillText('Clinic OPD Card', 122, 75);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '13px monospace, system-ui, sans-serif';
  const clinicText = `Digital Health ID • ${clinicName || 'Iniya Aesthetics & Wellness'}`;
  ctx.fillText(clinicText.length > 42 ? clinicText.slice(0, 40) + '...' : clinicText, 122, 97);

  // 3D Gold Microchip
  drawRoundRect(640, 60, 46, 36, 6);
  const goldGrad = ctx.createLinearGradient(640, 60, 686, 96);
  goldGrad.addColorStop(0, '#fef08a');
  goldGrad.addColorStop(0.5, '#f59e0b');
  goldGrad.addColorStop(1, '#b45309');
  ctx.fillStyle = goldGrad;
  ctx.fill();
  ctx.strokeStyle = '#78350f';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Chip Pad Divisions
  ctx.save();
  ctx.strokeStyle = 'rgba(120, 53, 15, 0.65)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(642, 78);
  ctx.lineTo(684, 78);
  ctx.moveTo(663, 62);
  ctx.lineTo(663, 94);
  ctx.stroke();
  ctx.restore();

  // Record ID Pill Badge
  drawRoundRect(698, 60, 96, 36, 8);
  ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(59, 130, 246, 0.5)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = '#93c5fd';
  ctx.font = 'bold 14px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(recordId, 746, 83);
  ctx.textAlign = 'left';

  // Divider Line 1
  ctx.strokeStyle = 'rgba(51, 65, 85, 0.7)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(55, 126);
  ctx.lineTo(795, 126);
  ctx.stroke();

  // 6. Middle Section: Patient Avatar & Details
  const avatarX = 55;
  const avatarY = 150;
  const avatarSize = 96;
  const avatarRadius = 22;

  let imageDrawn = false;
  const patientImgUrl = customer.image_url || customer.image ? getImageUrl(customer.image_url || customer.image) : null;
  if (patientImgUrl) {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = patientImgUrl;
      const loaded = await new Promise((resolve) => {
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
        setTimeout(() => resolve(false), 1200);
      });
      if (loaded) {
        ctx.save();
        drawRoundRect(avatarX, avatarY, avatarSize, avatarSize, avatarRadius);
        ctx.clip();
        ctx.drawImage(img, avatarX, avatarY, avatarSize, avatarSize);
        ctx.restore();
        imageDrawn = true;
      }
    } catch {
      imageDrawn = false;
    }
  }

  if (!imageDrawn) {
    drawRoundRect(avatarX, avatarY, avatarSize, avatarSize, avatarRadius);
    const avGrad = ctx.createLinearGradient(avatarX, avatarY, avatarX + avatarSize, avatarY + avatarSize);
    if (customer.gender === 'female') {
      avGrad.addColorStop(0, '#ec4899');
      avGrad.addColorStop(1, '#be185d');
    } else if (customer.gender === 'other') {
      avGrad.addColorStop(0, '#a855f7');
      avGrad.addColorStop(1, '#6b21a8');
    } else {
      avGrad.addColorStop(0, '#3b82f6');
      avGrad.addColorStop(1, '#1d4ed8');
    }
    ctx.fillStyle = avGrad;
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 44px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(customer.name?.charAt(0).toUpperCase() || 'P', avatarX + avatarSize / 2, avatarY + avatarSize / 2 + 2);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
  }

  // Avatar Ring
  drawRoundRect(avatarX, avatarY, avatarSize, avatarSize, avatarRadius);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Patient Name
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 28px system-ui, -apple-system, sans-serif';
  const nameText = customer.name || 'Patient Full Name';
  ctx.fillText(nameText.length > 28 ? nameText.slice(0, 26) + '...' : nameText, 175, 192);

  // Gender Pill
  const genderLabel = customer.gender ? customer.gender.charAt(0).toUpperCase() + customer.gender.slice(1) : 'Gender';
  const genderWidth = Math.max(84, ctx.measureText(genderLabel).width + 30);
  drawRoundRect(175, 212, genderWidth, 30, 8);
  ctx.fillStyle = 'rgba(30, 41, 59, 0.9)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(71, 85, 105, 0.8)';
  ctx.lineWidth = 1.2;
  ctx.stroke();

  ctx.fillStyle = '#e2e8f0';
  ctx.font = 'bold 13px system-ui, -apple-system, sans-serif';
  ctx.fillText(genderLabel, 190, 232);

  // Bullet & Age
  ctx.fillStyle = '#64748b';
  ctx.font = '16px system-ui, -apple-system, sans-serif';
  ctx.fillText('•', 175 + genderWidth + 14, 232);

  ctx.fillStyle = '#cbd5e1';
  ctx.font = '500 15px system-ui, -apple-system, sans-serif';
  const ageText = customer.age ? `${customer.age} Yrs` : 'Age pending';
  ctx.fillText(ageText, 175 + genderWidth + 30, 232);

  // Divider Line 2
  ctx.strokeStyle = 'rgba(51, 65, 85, 0.7)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(55, 275);
  ctx.lineTo(795, 275);
  ctx.stroke();

  // 7. Bottom Section: Contact & Clearance
  // Contact
  ctx.fillStyle = '#94a3b8';
  ctx.font = 'bold 12px system-ui, -apple-system, sans-serif';
  ctx.fillText('CONTACT', 55, 305);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 20px monospace, system-ui, sans-serif';
  ctx.fillText(customer.mobile || '—', 55, 335);

  // Clearance
  ctx.fillStyle = '#94a3b8';
  ctx.font = 'bold 12px system-ui, -apple-system, sans-serif';
  ctx.fillText('CLEARANCE', 440, 305);

  if (customer.is_active) {
    // Active Pill
    drawRoundRect(440, 314, 140, 32, 8);
    const actGrad = ctx.createLinearGradient(440, 314, 580, 346);
    actGrad.addColorStop(0, 'rgba(6, 78, 59, 0.95)');
    actGrad.addColorStop(1, 'rgba(19, 78, 74, 0.95)');
    ctx.fillStyle = actGrad;
    ctx.fill();
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.6)';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Pulsing Green Beacon
    ctx.beginPath();
    ctx.arc(458, 330, 4.5, 0, Math.PI * 2);
    ctx.fillStyle = '#34d399';
    ctx.fill();

    ctx.fillStyle = '#6ee7b7';
    ctx.font = 'bold 13px system-ui, -apple-system, sans-serif';
    ctx.fillText('Active OPD', 472, 335);
  } else {
    drawRoundRect(440, 314, 120, 32, 8);
    ctx.fillStyle = 'rgba(30, 41, 59, 0.9)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(71, 85, 105, 0.7)';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 13px system-ui, -apple-system, sans-serif';
    ctx.fillText('Inactive', 475, 335);
  }

  // 8. Security Strip & Barcode Line
  ctx.strokeStyle = 'rgba(51, 65, 85, 0.5)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(55, 385);
  ctx.lineTo(795, 385);
  ctx.stroke();

  ctx.fillStyle = '#64748b';
  ctx.font = '11px monospace';
  ctx.fillText(`OPD-${recordId}`, 55, 420);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '12px system-ui, -apple-system, sans-serif';
  const addrText = customer.address ? customer.address.trim() : 'Verified Active Patient Record';
  ctx.fillText(addrText.length > 45 ? addrText.slice(0, 42) + '...' : addrText, 220, 420);

  ctx.fillStyle = '#64748b';
  ctx.font = '11px monospace';
  ctx.fillText('VALID EHR  [ ☤ ]', 685, 420);

  return canvas;
};

export default function PatientOpdCardModal({
  customer,
  onClose,
  clinicName = 'Iniya Aesthetics & Wellness',
}) {
  const toast = useToast();
  const cardRef = useRef(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [customer?.id, customer?.image_url, customer?.image]);

  if (!customer) return null;

  const formatRecordId = (id) => `REC-${String(id || 0).padStart(4, '0')}`;
  const recordId = formatRecordId(customer.id);

  // Gender colors
  const genderColor =
    customer.gender === 'female'
      ? 'from-pink-500/20 to-rose-500/10 text-rose-300 border-rose-500/40'
      : customer.gender === 'other'
      ? 'from-purple-500/20 to-indigo-500/10 text-purple-300 border-purple-500/40'
      : 'from-blue-500/20 to-cyan-500/10 text-blue-300 border-blue-500/40';

  const avatarInitial = customer.name?.charAt(0).toUpperCase() || 'P';

  // Native High-Resolution PNG Image Download
  const handleDownloadImage = async () => {
    setIsDownloading(true);

    try {
      const canvas = await generateCardCanvas(customer, clinicName, recordId);

      canvas.toBlob((blob) => {
        if (!blob) {
          throw new Error('Canvas to Blob conversion failed');
        }
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        const safeName = (customer.name || 'Patient').trim().replace(/[^a-zA-Z0-9_-]/g, '_');
        link.download = `OPD-Card-${recordId}-${safeName}.png`;
        link.href = url;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        toast.success('OPD Card downloaded successfully as high-resolution image!');
      }, 'image/png');
    } catch (err) {
      console.error('Error generating card image:', err);
      toast.error('Unable to export card image. You can use the Print / PDF option.');
    } finally {
      setIsDownloading(false);
    }
  };

  // Handle Clean Print / PDF
  const handlePrintCard = () => {
    if (!cardRef.current) return;

    const oldIframe = document.getElementById('opd-card-print-frame');
    if (oldIframe) {
      oldIframe.remove();
    }

    const iframe = document.createElement('iframe');
    iframe.id = 'opd-card-print-frame';
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.zIndex = '-9999';
    document.body.appendChild(iframe);

    // Collect all stylesheets
    const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
      .map((s) => s.outerHTML)
      .join('\n');

    const printElement = cardRef.current.cloneNode(true);

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <title>${recordId} - ${customer.name || 'Patient'} OPD Card</title>
          ${styles}
          <style>
            @page {
              size: auto;
              margin: 12mm;
            }
            *, *::before, *::after {
              box-sizing: border-box !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            html, body {
              background: #ffffff !important;
              margin: 0 !important;
              padding: 0 !important;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
            }
            .print-card-wrapper {
              display: flex;
              flex-direction: column;
              align-items: center;
              gap: 16px;
              width: 100%;
              max-width: 440px;
              margin: 0 auto;
            }
            .print-meta-header {
              text-align: center;
              margin-bottom: 8px;
            }
            .print-meta-header h2 {
              font-size: 16px;
              font-weight: 700;
              color: #0f172a;
              margin: 0;
            }
            .print-meta-header p {
              font-size: 11px;
              color: #64748b;
              margin: 2px 0 0 0;
            }
            .smart-card-3d {
              max-width: 440px !important;
              box-shadow: 0 4px 14px rgba(0,0,0,0.2) !important;
              border: 1px solid #1e293b !important;
              transform: none !important;
            }
            .animate-float-card, .animate-holographic-sweep {
              animation: none !important;
            }
            .print-footer-note {
              font-size: 10px;
              color: #94a3b8;
              text-align: center;
              margin-top: 10px;
              border-top: 1px dashed #cbd5e1;
              padding-top: 8px;
              width: 100%;
            }
          </style>
        </head>
        <body>
          <div class="print-card-wrapper">
            <div class="print-meta-header">
              <h2>${clinicName}</h2>
              <p>Official Patient OPD &amp; Clinical Health Identification</p>
            </div>
            ${printElement.outerHTML}
            <div class="print-footer-note">
              Issued on: ${new Date(customer.created_at || Date.now()).toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })} &bull; Digital Verification: Verified Active Electronic Health Record
            </div>
          </div>
        </body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      try {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      } catch (err) {
        console.error('Print error:', err);
      }
    }, 350);
  };

  const patientImageUrl = customer.image_url || customer.image ? getImageUrl(customer.image_url || customer.image) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-100 transform transition-all relative max-h-[94vh] overflow-y-auto space-y-4">
        
        {/* Modal Top Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold shadow-2xs">
              <HeartPulse className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
              <span>Patient Medical Chart &amp; OPD Card</span>
            </span>
            <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200/80">
              {recordId}
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Card Showcase Stage */}
        <div className="relative py-2 flex flex-col items-center justify-center">
          {/* Subtle Ambient Backing Grid */}
          <div className="w-full flex items-center justify-center">
            {/* Smooth Floating Wrapper for interactive look */}
            <div className="animate-float-card w-full max-w-[420px]">
              
              {/* THE 3D SMART OPD CARD (Export Target) */}
              <div
                ref={cardRef}
                className="smart-card-3d mx-auto relative overflow-hidden p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white select-none cursor-default group/smartcard space-y-4 border border-slate-800/90 shadow-2xl"
                style={{
                  minHeight: '235px',
                  boxShadow: '0 20px 45px -12px rgba(2, 6, 23, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.12), inset 0 1.5px 1px 0 rgba(255, 255, 255, 0.2)',
                }}
              >
                {/* 3D Holographic Light Beam Sweep */}
                <div className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-white/[0.09] to-transparent pointer-events-none animate-holographic-sweep" />

                {/* Subtle Midnight Specular Ambient Glow */}
                <div className="absolute -top-16 -right-16 w-44 h-44 bg-gradient-to-br from-indigo-500/20 to-blue-600/10 rounded-full blur-3xl pointer-events-none group-hover/smartcard:scale-125 transition-transform duration-700" />
                <div className="absolute -bottom-16 -left-16 w-44 h-44 bg-gradient-to-tr from-cyan-500/15 to-emerald-500/10 rounded-full blur-3xl pointer-events-none group-hover/smartcard:scale-125 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-b from-white/[0.05] via-transparent to-black/40 pointer-events-none" />

                {/* Top Section: Card Header & 3D Gold Microchip */}
                <div className="relative z-10 flex items-center justify-between pb-3 border-b border-slate-800/80">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center text-white shadow-md shadow-rose-500/30 ring-1 ring-white/20 shrink-0">
                      <HeartPulse className="w-4.5 h-4.5 animate-pulse drop-shadow-sm" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white tracking-wide font-display block leading-tight">
                        Clinic OPD Card
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono tracking-tight block">
                        Digital Health ID &bull; {clinicName || 'Iniya Clinic'}
                      </span>
                    </div>
                  </div>

                  {/* 3D Gold EMV Smart Chip + Status Tag */}
                  <div className="flex items-center gap-2">
                    {/* Simulated 3D Gold Contact Chip */}
                    <div
                      className="w-6.5 h-5 rounded-[4px] bg-gradient-to-br from-amber-200 via-amber-400 to-amber-600 p-[1px] shadow-sm shadow-amber-950/70 shrink-0 opacity-95 group-hover/smartcard:opacity-100 transition-opacity"
                      title="Smart Medical ID Chip"
                    >
                      <div className="w-full h-full rounded-[3px] bg-gradient-to-tr from-amber-400 via-amber-300 to-amber-200 grid grid-cols-2 gap-[1px] p-[1px]">
                        <div className="border-r border-b border-amber-700/50 rounded-tl-[1px]" />
                        <div className="border-l border-b border-amber-700/50 rounded-tr-[1px]" />
                        <div className="border-r border-t border-amber-700/50 rounded-bl-[1px]" />
                        <div className="border-l border-t border-amber-700/50 rounded-br-[1px]" />
                      </div>
                    </div>

                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-blue-950/90 text-blue-300 border border-blue-600/40 tracking-wider shadow-xs">
                      {recordId}
                    </span>
                  </div>
                </div>

                {/* Middle Section: Patient Primary Details (3D Raised Avatar & Name) */}
                <div className="relative z-10 flex items-center gap-3.5 py-1">
                  <div className="w-13 h-13 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 overflow-hidden flex items-center justify-center font-bold text-lg text-white border border-slate-700/80 shadow-md shadow-black/50 ring-2 ring-white/10 shrink-0 group-hover/smartcard:scale-105 transition-transform duration-300">
                    {patientImageUrl && !imgError ? (
                      <img
                        src={patientImageUrl}
                        alt={customer.name}
                        className="w-full h-full object-cover"
                        onError={() => setImgError(true)}
                      />
                    ) : (
                      <span className="bg-gradient-to-tr from-blue-300 via-indigo-200 to-cyan-300 bg-clip-text text-transparent font-extrabold text-lg drop-shadow-sm">
                        {avatarInitial}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-base sm:text-lg text-white truncate font-display tracking-tight drop-shadow-xs">
                      {customer.name || 'Patient Full Name'}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-300 font-medium capitalize mt-1">
                      <span className={`px-2 py-0.5 rounded-md bg-slate-800/90 text-[10px] font-bold border border-slate-700/80 shadow-2xs ${genderColor}`}>
                        {customer.gender === 'female' ? '👩 Female' : customer.gender === 'male' ? '👨 Male' : '🧑 Other'}
                      </span>
                      <span className="text-slate-500">&bull;</span>
                      <span className="text-slate-300 font-medium text-xs">
                        {customer.age ? `${customer.age} Yrs` : 'Age pending'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Section: Contact & 3D Clearance Status */}
                <div className="relative z-10 grid grid-cols-2 gap-3 pt-3 border-t border-slate-800/80 text-[11px]">
                  <div>
                    <div className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Contact</div>
                    <div className="text-white font-mono font-bold text-xs truncate mt-0.5 tracking-tight">
                      {customer.mobile || '—'}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Clearance</div>
                    <div className="mt-0.5">
                      <span
                        className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-md border shadow-sm ${
                          customer.is_active
                            ? 'bg-gradient-to-r from-emerald-950/90 to-teal-950/90 text-emerald-300 border-emerald-500/50 shadow-emerald-950/50'
                            : 'bg-slate-900 text-slate-400 border-slate-700/60'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            customer.is_active ? 'bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse' : 'bg-slate-500'
                          }`}
                        />
                        {customer.is_active ? 'Active OPD' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Micro Security Barcode Strip */}
                <div className="relative z-10 pt-2 border-t border-slate-800/50 flex items-center justify-between text-[9px] text-slate-500 font-mono">
                  <span className="tracking-widest opacity-80 uppercase">OPD-{recordId}</span>
                  <span className="tracking-tight text-slate-400 font-medium">{customer.address ? customer.address.slice(0, 24) + '...' : 'Verified Patient'}</span>
                  <span className="tracking-widest opacity-80">VALID EHR</span>
                </div>

              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons Toolbar: Download PNG & Print/PDF */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
          <button
            type="button"
            onClick={handleDownloadImage}
            disabled={isDownloading}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 text-white text-xs font-semibold shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 transition-all cursor-pointer disabled:opacity-50"
          >
            <Download className={`w-4 h-4 ${isDownloading ? 'animate-bounce' : ''}`} />
            <span>{isDownloading ? 'Generating Card...' : 'Download Card (PNG)'}</span>
          </button>

          <button
            type="button"
            onClick={handlePrintCard}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs hover:shadow-xs transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>Print / Save PDF</span>
          </button>
        </div>

        {/* Modal Bottom Footer Actions */}
        <div className="flex items-center justify-end pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
