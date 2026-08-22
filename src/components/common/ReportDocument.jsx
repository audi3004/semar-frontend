import React, { useState, useEffect } from "react";
import QRCode from "qrcode";
import { QrCode } from "lucide-react";
import { PLN_LOGO_PNG_BASE64 } from "../../assets/plnLogoBase64";
import semarLogoDefault from "../../assets/logo_semar_trns.png";
import {
   formatDateIndonesianLong,
   formatRupiah,
   getFormattedDocNo,
} from "../../utils/formatters";
import { DataService } from "../../services/dataService";
import { DOCUMENT_LETTERHEAD } from "../pdf/documentLetterhead";
import { appendOvertimeCorrection, formatReportUnitHierarchy } from "../../utils/reportFormatting";

const plnLogo = PLN_LOGO_PNG_BASE64;

export const ReportDocument = ({
   currentDateStr = new Date().toLocaleDateString("id-ID"),
   docNoStr = "001/REKAP/PLNES-UP2/2026",
   semarLogo = semarLogoDefault,
   data = [],
   title = "LAPORAN DOKUMEN ELEKTRONIK",
   filterInfo = {},
   signatories = [],
}) => {
   const [qrCodeDataUrl, setQrCodeDataUrl] = useState("");

   // Generate QR Code ketika currentDateStr atau docNoStr berubah
   useEffect(() => {
      const qrPayload = `TANGGAL CETAK: ${currentDateStr}\nNO: ${docNoStr}`;

      QRCode.toDataURL(qrPayload, {
         width: 150,
         margin: 1,
         color: { dark: "#000000", light: "#ffffff" },
      })
         .then((url) => setQrCodeDataUrl(url))
         .catch((err) => console.error("Gagal membuat QR Code:", err));
   }, [currentDateStr, docNoStr]);

   return (
      <div className="report-container font-sans text-black bg-white p-6">
         {/* CSS Cetak / Print Rules A4 Landscape & Header-Footer Statis */}
         <style>{`
        @media print {
          @page {
            size: A4 landscape;
            margin: 20mm 15mm 20mm 15mm;
          }
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          /* Header Statis di Setiap Halaman */
          .print-header-fixed {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background: white;
            z-index: 50;
          }
          /* Footer Statis di Setiap Halaman */
          .print-footer-fixed {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background: white;
            z-index: 50;
            padding-top: 8px;
            border-top: 1px solid black;
          }
          /* Spacer agar konten utama tidak tertimpa Header/Footer */
          .print-header-space {
            height: 80px; 
          }
          .print-footer-space {
            height: 60px;
          }
          thead {
            display: table-header-group;
          }
          tbody {
            display: table-row-group;
          }
          tr {
            break-inside: avoid;
            page-break-inside: avoid;
          }
          /* Counter Halaman Otomatis */
          .page-counter::after {
            content: "Hal " counter(page) " - " counter(pages);
          }
        }
      `}</style>

         {/* HEADER DOKUMEN (Statis di Media Cetak) */}
         <header className="print-header-fixed mb-5 bg-white">
            <div className="relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b-2 border-[#075369] pb-3.5">
               <div className="absolute bottom-0 left-0 h-0.5 w-24 bg-[#00A2B8]" />
               <div className="flex items-center gap-3.5 min-w-0">
                  <img
                     src={plnLogo}
                     alt="PLN Logo"
                     className="block h-9 sm:h-10 w-auto max-w-[180px] object-contain flex-shrink-0"
                     referrerPolicy="no-referrer"
                  />
                  <div className="min-w-0 border-l border-slate-300 pl-3.5">
                     <p className="text-[9px] sm:text-[10px] leading-tight font-extrabold text-[#075369] uppercase tracking-[0.04em]">
                        {DOCUMENT_LETTERHEAD.unitName}
                     </p>
                     <p className="mt-1 text-[8px] sm:text-[9px] leading-tight text-slate-600 font-medium">
                        {DOCUMENT_LETTERHEAD.territoryName}
                     </p>
                  </div>
               </div>
               <div className="w-full sm:w-auto text-left sm:text-right text-[10px] text-slate-700 sm:border-l sm:border-[#00A2B8] sm:pl-4">
                  <h1 className="font-extrabold text-[#075369] uppercase tracking-[0.06em]">
                     {title}
                  </h1>
                  <p className="mt-1 font-mono text-slate-900 font-bold break-all sm:whitespace-nowrap">
                     {docNoStr}
                  </p>
                  <p className="mt-0.5 text-[9px] text-slate-600">
                     Tgl Cetak: {currentDateStr}
                  </p>
               </div>
            </div>
         </header>

         {/* Spacer Header untuk Halaman Print */}
         <div className="hidden print:block print-header-space" />

         {/* KONTEN UTAMA DOKUMEN */}
         <main className="main-content my-4">
            {filterInfo &&
               (filterInfo.month || filterInfo.periode || filterInfo.type || filterInfo.unit) && (
                  <div className="mb-3 text-xs border-b border-black pb-2 flex flex-wrap gap-4">
                     {(filterInfo.month || filterInfo.periode) && (
                        <div>
                           <span className="font-bold">Periode:</span>{" "}
                           {filterInfo.periode || `${filterInfo.month} ${filterInfo.year || ""}`}
                        </div>
                     )}
                     {filterInfo.type && (
                        <div>
                           <span className="font-bold">Jenis:</span>{" "}
                           {filterInfo.type.toUpperCase()}
                        </div>
                     )}
                     {filterInfo.unit && (
                        <div>
                           <span className="font-bold">Unit:</span>{" "}
                           {filterInfo.unit}
                        </div>
                     )}
                  </div>
               )}

            <div className="overflow-x-auto">
               <table className="w-full text-left text-xs border-collapse border border-black">
                  <thead>
                     <tr className="bg-slate-100 uppercase text-[10px] font-bold text-black">
                        <th className="border border-black p-2 text-center w-10">
                           No
                        </th>
                        <th className="border border-black p-2">No. Dokumen</th>
                        <th className="border border-black p-2">
                           Tgl Pengajuan
                        </th>
                        <th className="border border-black p-2">Pegawai</th>
                        <th className="border border-black p-2">Jenis</th>
                        <th className="border border-black p-2">Unit/Lokasi</th>
                        <th className="border border-black p-2">Keterangan</th>
                        <th className="border border-black p-2 text-right">
                           Estimasi Biaya
                        </th>
                     </tr>
                  </thead>
                  <tbody>
                     {data && data.length > 0 ? (
                        data.map((item, idx) => {
                           let nominal = "-";
                           if (item.type === "lembur")
                              nominal = formatRupiah(
                                 item.estimasiBiayaRupiah || 0,
                              );
                           if (item.type === "sppd")
                              nominal = formatRupiah(
                                 item.totalEstimasiBiaya || 0,
                              );

                           return (
                              <tr
                                 key={item.id || idx}
                                 className="hover:bg-slate-50 text-[11px]"
                              >
                                 <td className="border border-black p-2 text-center">
                                    {idx + 1}
                                 </td>
                                 <td className="border border-black p-2 font-mono">
                                    {getFormattedDocNo(item)}
                                 </td>
                                 <td className="border border-black p-2">
                                    {item.tanggalPengajuan
                                       ? formatDateIndonesianLong(
                                            item.tanggalPengajuan,
                                         )
                                       : "-"}
                                 </td>
                                 <td className="border border-black p-2">
                                    <div className="font-bold">
                                       {item.employeeName ||
                                          item.namaPegawai ||
                                          "-"}
                                    </div>
                                    <div className="text-[10px] text-slate-600 font-mono">
                                       {item.employeeNip || item.nip || ""}
                                    </div>
                                 </td>
                                 <td className="border border-black p-2 uppercase font-semibold">
                                    {item.type || item.jenisPermohonan || "-"}
                                 </td>
                                 <td className="border border-black p-2">
                                    {formatReportUnitHierarchy(item)}
                                 </td>
                                 <td className="border border-black p-2">
                                    {appendOvertimeCorrection(item.keterangan || item.kegiatanDetail ||
                                       item.maksudPerjalanan || item.maksudSppd ||
                                       item.diagnosaSingkat || item.ijinReasonType || item.cutiType || item.alasan ||
                                       "-", item)}
                                 </td>
                                 <td className="border border-black p-2 text-right font-bold">
                                    {nominal}
                                 </td>
                              </tr>
                           );
                        })
                     ) : (
                        <tr>
                           <td
                              colSpan="8"
                              className="border border-black p-4 text-center text-slate-500 italic"
                           >
                              Tidak ada data transaksi.
                           </td>
                        </tr>
                     )}
                  </tbody>
               </table>
            </div>

            {(() => {
               const defaultSignatories =
                  DataService.getDefaultReportSignatories(
                     filterInfo.unit || filterInfo.unitUpt,
                  );

               let rawSigs = filterInfo.strictSignatories
                  ? (Array.isArray(signatories) ? signatories : [])
                  : Array.isArray(signatories) && signatories.length > 0
                     ? signatories
                     : defaultSignatories;
               if (
                  rawSigs.length === 3 &&
                  (rawSigs[0].role?.includes("Verifikasi") ||
                     (rawSigs[0].title === "DIVERIFIKASI OLEH" &&
                        rawSigs[1].title === "DISETUJUI OLEH"))
               ) {
                  rawSigs = [
                     {
                        ...rawSigs[1],
                        title: "DIVERIFIKASI OLEH",
                        role: "Checker",
                     },
                     rawSigs[2],
                  ];
               }

               const hasAnyData = rawSigs.some(
                  (s) => s && (s.name || s.nip || s.title || s.role),
               );
               if (!hasAnyData && !filterInfo.strictSignatories) {
                  rawSigs = defaultSignatories;
               }

               const validSignatories = rawSigs.filter((sig) => {
                  if (!sig) return false;
                  return Boolean(sig.name || sig.nip || sig.title || sig.role);
               });

               if (!validSignatories || validSignatories.length === 0)
                  return null;
               const colsClass =
                  validSignatories.length === 2
                     ? "grid-cols-2"
                     : validSignatories.length === 1
                       ? "grid-cols-1"
                       : "grid-cols-3";

               return (
                  <div
                     className={`mt-8 grid ${colsClass} gap-4 text-center text-xs page-break-inside-avoid`}
                  >
                     {validSignatories.map((sig, idx) => (
                        <div
                           key={idx}
                           className="flex flex-col items-center justify-between h-28 border border-black p-2"
                        >
                           <span className="font-bold text-[10px] uppercase">
                              {sig.title ||
                                 sig.positionLabel ||
                                 `Penandatangan ${idx + 1}`}
                           </span>
                           <div className="my-1 h-10 w-full flex items-center justify-center">
                              {sig.signatureUrl || sig.signature ? (
                                 <img
                                    src={sig.signatureUrl || sig.signature}
                                    alt={`Tanda tangan ${sig.name || sig.role || idx + 1}`}
                                    className="max-h-10 max-w-32 object-contain mix-blend-multiply"
                                 />
                              ) : (
                                 <span className="text-[9px] text-slate-500 italic">Belum ditandatangani</span>
                              )}
                           </div>
                           <div>
                              <p className="font-bold underline">
                                 {sig.name || "(.........................)"}
                              </p>
                              <p className="text-[9px] font-mono">
                                 {sig.nip
                                    ? `NIP. ${sig.nip}`
                                    : sig.jabatan || ""}
                              </p>
                           </div>
                        </div>
                     ))}
                  </div>
               );
            })()}
         </main>

         {/* Spacer Footer untuk Halaman Print */}
         <div className="hidden print:block print-footer-space" />

         {/* FOOTER DOKUMEN (Statis di Media Cetak) */}
         <footer className="print-footer-fixed">
            {/* Authenticity Verification Footer Formal */}
            <div className="pt-3 border-t border-black flex flex-col sm:flex-row items-center justify-between text-[10px] text-black gap-2 page-break-inside-avoid">
               <div className="flex items-center gap-2.5">
                  {qrCodeDataUrl ? (
                     <img
                        src={qrCodeDataUrl}
                        alt="QR Code Pengesahan"
                        className="w-10 h-10 object-contain"
                     />
                  ) : (
                     <div className="p-1.5 bg-white border border-black">
                        <QrCode className="w-7 h-7 text-black" />
                     </div>
                  )}
                  <div>
                     <p className="font-bold text-black">DOKUMEN ELEKTRONIK</p>
                     <p className="text-[9.5px] text-black">
                        Otorisasi SEMAR PLN Electricity Services
                     </p>
                     <p className="text-[9.5px] text-black">
                        Unit Pelaksana 2 Jawa Tengah &amp; DI Yogyakarta
                     </p>
                  </div>
               </div>
               <div className="text-right font-mono text-[9.5px] flex flex-col items-end">
                  <img
                     src={semarLogo}
                     alt="SEMAR Logo"
                     className="h-6 sm:h-7 w-auto object-contain flex-shrink-0 mb-0.5"
                     referrerPolicy="no-referrer"
                  />
                  <p className="text-black">
                     Waktu Cetak: {new Date().toLocaleString("id-ID")}
                  </p>
                  {/* Penomoran Halaman Otomatis */}
                  <p className="text-black page-counter"></p>
               </div>
            </div>
         </footer>
      </div>
   );
};
