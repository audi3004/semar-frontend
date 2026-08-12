import { useState, useEffect } from "react";
import {
   X,
   Download,
   CheckCircle,
   ShieldCheck,
   FileText,
   QrCode,
   Eye,
   User,
   Building2,
   XCircle,
   Briefcase,
   Printer,
   ExternalLink,
   RefreshCw,
   Clock,
   CheckCircle2,
} from "lucide-react";
import QRCode from "qrcode";
import {
   formatRupiah,
   formatDateIndonesianLong as formatDateIndonesian,
   getStatusLabel,
   getFormattedDocNo,
} from "../../utils/formatters";
import { getSubmissionAttachments } from "../../utils/pdfAttachments";
import { PdfService } from "../../services/pdfService";
import { DataService } from "../../services/dataService";
import { AuthService } from "../../services/authService";
import { PLN_LOGO_PNG_BASE64 } from "../../assets/plnLogoBase64";
import semarLogo from "../../assets/logo_semar_trns.png";
import { motion } from "motion/react";
import { DOCUMENT_LETTERHEAD } from "../pdf/documentLetterhead";

const plnLogo = PLN_LOGO_PNG_BASE64;

const DocumentLetterhead = ({ label, numberLabel, dateLabel }) => (
   <div className="relative overflow-hidden border-b-2 border-[#075369] pb-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 page-break-inside-avoid">
      <div className="absolute bottom-0 left-0 h-0.5 w-24 bg-[#00A2B8]" />
      <div className="flex items-center gap-3.5 min-w-0">
         <img
            src={plnLogo}
            alt="PLN Logo"
            className="h-9 sm:h-10 w-auto object-contain flex-shrink-0"
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
         <p className="font-extrabold text-[#075369] uppercase tracking-[0.06em]">{label}</p>
         <p className="mt-1 font-mono text-slate-900 font-bold whitespace-nowrap">{numberLabel}</p>
         <p className="mt-0.5 text-[9px] text-slate-600">{dateLabel}</p>
      </div>
   </div>
);

export const DocumentViewerModal = ({
   submission,
   isReport = false,
   reportSubmissions = [],
   reportFilterInfo = {},
   reportSignatories = [],
   isPeriodCompleted = true,
   isOpen,
   onClose,
}) => {
   const [viewTab, setViewTab] = useState("html"); // "html" | "pdf"
   const [pdfPreviewUrl, setPdfPreviewUrl] = useState(null);
   const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
   const [qrCodeDataUrl, setQrCodeDataUrl] = useState("");

   const finalDocNo = submission ? getFormattedDocNo(submission) : "";
   const currentDateStr = new Date().toLocaleDateString("id-ID");
   const qrPayload = submission
      ? `TANGGAL CETAK: ${currentDateStr}\nNO: ${finalDocNo}`
      : isReport
        ? `LAPORAN RESUME PERMOHONAN APPROVED 3\nTANGGAL CETAK: ${currentDateStr}\nPERIODE: ${reportFilterInfo?.periode || "Semua"}`
        : "";

   useEffect(() => {
      if (qrPayload) {
         QRCode.toDataURL(qrPayload, { width: 150, margin: 1 })
            .then((url) => setQrCodeDataUrl(url))
            .catch((err) => console.error("QR Code generation error:", err));
      }
   }, [qrPayload]);

   // Load PDF Data URL when switching to PDF tab or when modal opens in PDF mode
   useEffect(() => {
      if (isOpen && viewTab === "pdf" && !pdfPreviewUrl) {
         loadPdfPreview();
      }
   }, [
      isOpen,
      viewTab,
      submission,
      isReport,
      reportSubmissions,
      reportFilterInfo,
      reportSignatories,
   ]);

   // Reset tab and PDF URL when modal closes or submission changes
   useEffect(() => {
      if (!isOpen) {
         setViewTab("html");
         setPdfPreviewUrl(null);
      }
   }, [isOpen, submission, isReport]);

   const loadPdfPreview = async () => {
      setIsGeneratingPdf(true);
      try {
         if (isReport) {
            const dataUrl = await PdfService.generateReportPdfDataUrl(
               reportSubmissions,
               reportFilterInfo,
               reportSignatories,
            );
            setPdfPreviewUrl(dataUrl);
         } else if (submission) {
            const dataUrl = await PdfService.generatePdfDataUrl(submission);
            setPdfPreviewUrl(dataUrl);
         }
      } catch (err) {
         console.error("Gagal membuat data URL PDF:", err);
      } finally {
         setIsGeneratingPdf(false);
      }
   };

   if (!isOpen) return null;
   if (!submission && !isReport) return null;

   const currentUser = AuthService.getCurrentUser();
   const userRole = (currentUser?.role || "").toLowerCase();

   const handleDownloadPDF = () => {
      if (isReport) {
         if (!isPeriodCompleted) return;
         PdfService.downloadReportPdf(
            reportSubmissions,
            reportFilterInfo,
            reportSignatories,
         );
      } else if (submission) {
         if (!isFullyApproved) {
            alert(
               "Unduh PDF belum dapat dilakukan. Dokumen harus disetujui secara lengkap hingga Approval 3 (Selesai).",
            );
            return;
         }
         PdfService.downloadPdf(submission);
      }
   };

   const handlePrint = () => {
      window.print();
   };

   // Helper calculation for single submission
   const statusLower = submission
      ? (submission.status || "").toLowerCase()
      : "";
   const currentRoleLower = submission
      ? (submission.currentApproverRole || "").toLowerCase()
      : "";

   const isApproved = statusLower === "approved";
   const isStageApproval3 =
      statusLower === "pending_approved3" ||
      statusLower === "pending_approver3" ||
      statusLower === "pending_app_3" ||
      currentRoleLower === "approved3" ||
      currentRoleLower === "approver3";

   const isMakerCheckerApp1 =
      userRole === "maker" ||
      userRole === "checker" ||
      userRole === "approved1" ||
      userRole === "verification";

   let showSppdNominal = false;
   if (isApproved) {
      showSppdNominal = true;
   } else if (isStageApproval3) {
      showSppdNominal = !isMakerCheckerApp1;
   }

   const calculatedTotalSppd = submission
      ? submission.totalEstimasiBiaya &&
        Number(submission.totalEstimasiBiaya) > 0
         ? Number(submission.totalEstimasiBiaya)
         : (submission.expenses || []).reduce(
              (acc, e) => acc + (Number(e.nominal) || 0),
              0,
           )
      : 0;

   const hasVerificationAssigned = DataService.isVerificationAssigned();
   const steps = submission?.approvalSteps || [];
   const checkerStep = steps.find((s) => s.role === "checker") ||
      steps[0] || {
         role: "checker",
         roleLabel: "TL PLN (Checker)",
         status: "pending",
      };
   const verificationStep = steps.find((s) => s.role === "verification") ||
      steps[1] || {
         role: "verification",
         roleLabel: "AMN PLN (Verifikasi)",
         status: "pending",
      };
   const approved1Step = steps.find((s) => s.role === "approved1") ||
      steps[2] || {
         role: "approved1",
         roleLabel: "MAN PLN (Approved 1)",
         status: "pending",
      };
   const approved2Step = steps.find((s) => s.role === "approved2") ||
      steps[3] || {
         role: "approved2",
         roleLabel: "TL ES (Approved 2)",
         status: "pending",
      };
   const approved3Step = steps.find((s) => s.role === "approved3") ||
      steps[4] || {
         role: "approved3",
         roleLabel: "AMN ES (Approved 3)",
         status: "pending",
      };

   const renderSignatureBox = (titleOrStep, stepParam, isMaker = false) => {
      if (!submission) return null;
      const isFirstParamStep =
         typeof titleOrStep === "object" && titleOrStep !== null;
      const step = isFirstParamStep ? titleOrStep : stepParam;
      const title = isFirstParamStep
         ? step?.roleLabel || "Tanda Tangan"
         : titleOrStep;
      const role =
         step?.role ||
         (isMaker
            ? "maker"
            : title?.toLowerCase().includes("checker")
              ? "checker"
              : title?.toLowerCase().includes("verif")
                ? "verification"
                : title?.toLowerCase().includes("1")
                  ? "approved1"
                  : title?.toLowerCase().includes("2")
                    ? "approved2"
                    : title?.toLowerCase().includes("3")
                      ? "approved3"
                      : "");

      const roleSigKey = role ? `${role}SignatureUrl` : null;
      const roleNameKey = role ? `${role}Name` : null;
      const roleNipKey = role ? `${role}Nip` : null;
      const roleDateKey = role ? `${role}Date` : null;
      const roleStatusKey = role ? `${role}Status` : null;

      const stepStatus =
         step?.status ||
         (roleStatusKey ? submission[roleStatusKey] : null) ||
         (role && submission[`${role}SignatureUrl`] ? "approved" : "pending");
      const isSkipped =
         !isMaker && (stepStatus === "skipped" || stepStatus === "DILEWATI");
      const isApprovedStep = isMaker
         ? true
         : stepStatus === "approved" ||
           stepStatus === "DISETUJUI" ||
           Boolean(step?.signatureUrl) ||
           Boolean(roleSigKey && submission[roleSigKey]);
      const isRejectedStep =
         !isMaker && (stepStatus === "rejected" || stepStatus === "DITOLAK");

      const name = isMaker
         ? submission.employeeName || submission.makerName || "-"
         : isSkipped
           ? "(Role Kosong)"
           : step?.actionByName ||
             (roleNameKey ? submission[roleNameKey] : null) ||
             step?.name ||
             "-";

      const nip = isMaker
         ? submission.employeeNip || submission.makerNip || null
         : isSkipped
           ? null
           : step?.actionByNip ||
             (roleNipKey ? submission[roleNipKey] : null) ||
             step?.nip ||
             null;

      const roleText = isMaker
         ? submission.employeeJabatan ||
           submission.makerJabatan ||
           "Tenaga Kerja / Pemohon"
         : isSkipped
           ? "Dilewati Otomatis"
           : step?.roleLabel || step?.name || title;

      const sigUrl = isMaker
         ? submission.makerSignatureUrl || submission.signatureUrl || ""
         : step?.signatureUrl ||
           (roleSigKey ? submission[roleSigKey] : "") ||
           "";

      const dateText = isMaker
         ? submission.tanggalPengajuan
            ? formatDateIndonesian(submission.tanggalPengajuan)
            : "-"
         : step?.actionDate ||
           (roleDateKey ? submission[roleDateKey] : null) ||
           "-";

      return (
         <div className="border border-black p-2 flex flex-col justify-between h-36 bg-white rounded-none">
            <div>
               <div
                  className={`flex items-center ${isMaker ? "justify-between" : "justify-end"} border-b border-black pb-1 mb-1`}
               >
                  {isMaker && (
                     <span className="text-[10px] font-bold text-black uppercase tracking-tight">
                        {title}
                     </span>
                  )}
                  {isSkipped && (
                     <span className="text-[9px] font-bold text-black flex items-center gap-0.5">
                        DILEWATI
                     </span>
                  )}
                  {!isSkipped && isApprovedStep && (
                     <span className="text-[9px] font-bold text-black flex items-center gap-0.5">
                        <CheckCircle className="w-2.5 h-2.5" /> DISETUJUI
                     </span>
                  )}
                  {!isSkipped && isRejectedStep && (
                     <span className="text-[9px] font-bold text-black flex items-center gap-0.5">
                        <XCircle className="w-2.5 h-2.5" /> DITOLAK
                     </span>
                  )}
                  {!isSkipped && !isApprovedStep && !isRejectedStep && (
                     <span className="text-[9px] font-semibold text-black">
                        MENUNGGU
                     </span>
                  )}
               </div>
               <p className="font-bold text-black text-[10.5px] truncate leading-tight">
                  {name}
               </p>
               <p className="text-[9.5px] text-black/80 truncate leading-tight">
                  {nip ? `NIP. ${nip}` : roleText}
               </p>
            </div>

            {/* Natural Signature Slot */}
            <div className="my-0.5 h-14 w-full flex items-center justify-center bg-transparent relative p-0.5 overflow-hidden">
               {sigUrl ? (
                  <img
                     src={sigUrl}
                     alt={`TTD ${title}`}
                     className="max-h-14 max-w-full h-auto w-auto object-contain mix-blend-multiply select-none filter contrast-125 transition-transform duration-200"
                  />
               ) : isSkipped ? (
                  <span className="text-black font-semibold text-[8.5px] italic">
                     [ DILEWATI ]
                  </span>
               ) : isApprovedStep ? (
                  <div className="text-center">
                     <span className="text-black font-black text-[9.5px] tracking-wider block">
                        [ TTD VALID ]
                     </span>
                     <span className="text-[7.5px] text-black font-mono">
                        Digital Verified
                     </span>
                  </div>
               ) : isRejectedStep ? (
                  <span className="text-black font-bold text-[9px] italic">
                     [ DITOLAK ]
                  </span>
               ) : (
                  <div className="w-full h-full border border-dashed border-black/40 flex items-center justify-center text-[8.5px] text-black/60 italic">
                     [ Belum Ditandatangani ]
                  </div>
               )}
            </div>

            <div className="text-[8.5px] pt-1 border-t border-black/80 text-black">
               <p className="truncate font-mono">Tgl: {dateText}</p>
               {!isMaker && (step?.notes || step?.catatan) && (
                  <p
                     className="text-[8px] italic text-black truncate mt-0.5"
                     title={step.notes || step.catatan}
                  >
                     "{step.notes || step.catatan}"
                  </p>
               )}
            </div>
         </div>
      );
   };

   const isFullyApproved =
      submission &&
      (submission.status === "APPROVED" || submission.status === "approved");
   const submissionAttachments = submission
      ? getSubmissionAttachments(submission)
      : [];
   const hasAttachment = submissionAttachments.length > 0;

   // Totals for Report HTML View
   const reportTotalSppd = reportSubmissions
      .filter((s) => s.type === "sppd")
      .reduce((acc, s) => acc + (Number(s.totalEstimasiBiaya) || 0), 0);
   const reportTotalLemburHours = reportSubmissions
      .filter((s) => s.type === "lembur")
      .reduce((acc, s) => acc + (Number(s.durasiJam) || 0), 0);

   return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto select-none modal-backdrop">
         <style>{`
        @media print {
          body {
            background-color: #ffffff !important;
            color: #000000 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .modal-controls, .no-print {
            display: none !important;
          }
          .printable-a4-document {
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
          }
          .modal-backdrop {
            position: static !important;
            background: none !important;
            padding: 0 !important;
            backdrop-filter: none !important;
          }
          .page-counter::after {
            content: "Halaman " counter(page) " dari " counter(pages);
          }
          .break-before-page {
            break-before: page !important;
            page-break-before: always !important;
          }
          .modal-container {
            max-width: 100% !important;
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
            max-height: none !important;
            background: #ffffff !important;
          }
          .page-break-inside-avoid {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
          @page {
            size: A4 portrait;
            margin: 8mm;
          }
        }
      `}</style>

         <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-300 max-w-5xl w-full overflow-hidden flex flex-col h-[92vh] max-h-[95vh] modal-container"
         >
            {/* Top Control Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between px-4 sm:px-6 py-3 bg-slate-900 text-white border-b border-slate-800 gap-3 flex-shrink-0 modal-controls">
               <div className="flex items-center gap-3">
                  <div className="p-2 bg-sky-500/20 text-sky-400 rounded-xl border border-sky-500/30">
                     <FileText className="w-5 h-5" />
                  </div>
                  <div>
                     <h3 className="text-xs sm:text-sm font-black tracking-tight text-white uppercase flex items-center gap-2">
                        <span>
                           {isReport
                              ? "PRATINJAU DOKUMEN LAPORAN RESUME"
                              : "DOKUMEN FORMAL DIGITAL"}
                        </span>
                        {isReport && (
                           <span
                              className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase ${
                                 !isPeriodCompleted
                                    ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                                    : "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                              }`}
                           >
                              {!isPeriodCompleted
                                 ? "Periode Saat Ini (Draft)"
                                 : "Periode Selesai"}
                           </span>
                        )}
                     </h3>
                     <p className="text-[10px] sm:text-xs text-slate-400 font-mono">
                        {isReport
                           ? `PERIODE: ${reportFilterInfo?.periode || "Semua"} | APPROVED 3`
                           : `ID DOKUMEN: ${finalDocNo}`}
                     </p>
                  </div>
               </div>

               {/* Controls: Tab Mode Switcher + Action Buttons */}
               <div className="flex items-center justify-between sm:justify-end gap-2">
                  {/* View Tab Switcher */}
                  {/*<div className="bg-slate-800 p-1 rounded-xl border border-slate-700/80 flex items-center gap-1">
              <button
                onClick={() => setViewTab("html")}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
                  viewTab === "html"
                    ? "bg-sky-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white hover:bg-slate-700/50"
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Tampilan Formal</span>
              </button>
              <button
                onClick={() => setViewTab("pdf")}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
                  viewTab === "pdf"
                    ? "bg-rose-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white hover:bg-slate-700/50"
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Mode PDF</span>
              </button>
            </div> */}

                  <div className="flex items-center gap-1.5">
                     {/*<button
                onClick={handlePrint}
                className="p-2 min-w-[36px] min-h-[36px] bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 transition cursor-pointer flex items-center justify-center"
                title="Cetak Dokumen (Print)"
              >
                <Printer className="w-4 h-4" />
              </button> */}

                     <button
                        onClick={handleDownloadPDF}
                        disabled={
                           isReport ? !isPeriodCompleted : !isFullyApproved
                        }
                        className={`px-3 py-1.5 min-h-[36px] text-xs font-bold rounded-xl border flex items-center gap-1.5 transition cursor-pointer active:scale-95 shadow-xs ${
                           (isReport ? !isPeriodCompleted : !isFullyApproved)
                              ? "bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed opacity-60"
                              : "bg-rose-600 hover:bg-rose-700 text-white border-rose-500 shadow-rose-600/20"
                        }`}
                        title={
                           isReport
                              ? !isPeriodCompleted
                                 ? "Generate/Download PDF hanya untuk periode yang sudah selesai"
                                 : "Unduh Dokumen PDF Resmi"
                              : !isFullyApproved
                                ? "Unduh PDF belum dapat dilakukan. Menunggu proses approval berjenjang selesai (Approval 3 / Disetujui)"
                                : "Unduh Dokumen PDF Resmi"
                        }
                     >
                        <Download className="w-3.5 h-3.5" />
                        <span>.PDF</span>
                     </button>

                     <button
                        onClick={onClose}
                        className="p-2 min-w-[36px] min-h-[36px] flex items-center justify-center text-slate-400 hover:text-rose-400 rounded-xl hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition cursor-pointer"
                        aria-label="Tutup"
                     >
                        <X className="w-5 h-5" />
                     </button>
                  </div>
               </div>
            </div>

            {/* Modal Main Body */}
            <div className="flex-1 overflow-y-auto bg-slate-200/90 print:bg-white text-black p-2 sm:p-6 flex flex-col gap-3">
               {!isReport && !isFullyApproved && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 flex items-center gap-2 shrink-0 no-print">
                     <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                     <span>
                        <strong>Dokumen Dalam Proses Approval:</strong> Form ini
                        masih dalam tahap proses approval berjenjang. Unduh file
                        PDF resmi baru dapat dilakukan setelah persetujuan
                        selesai sampai Approval 3 (Selesai).
                     </span>
                  </div>
               )}

               {viewTab === "pdf" ? (
                  /* PDF VIEW MODE (Chrome-Safe Base64 Object Preview) */
                  <div className="flex-1 min-h-[500px] flex flex-col gap-3 no-print">
                     {isReport && !isPeriodCompleted && (
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 flex items-center gap-2 shrink-0">
                           <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                           <span>
                              <strong>Mode Pratinjau Periode Saat Ini:</strong>{" "}
                              Ini adalah pratinjau real-time untuk periode yang
                              sedang berlangsung. Dokumen PDF resmi siap diunduh
                              setelah periode berakhir.
                           </span>
                        </div>
                     )}

                     {isGeneratingPdf ? (
                        <div className="flex-1 min-h-[400px] flex flex-col items-center justify-center gap-3 text-slate-500 bg-white rounded-2xl border border-slate-300 shadow-xs">
                           <RefreshCw className="w-8 h-8 animate-spin text-sky-600" />
                           <p className="text-xs font-bold text-slate-700">
                              Mebuat Pratinjau PDF Resmi...
                           </p>
                           <p className="text-[11px] text-slate-400">
                              Harap tunggu sebentar
                           </p>
                        </div>
                     ) : pdfPreviewUrl ? (
                        <div className="w-full flex-1 h-full min-h-[550px] rounded-2xl overflow-hidden border border-slate-300 bg-white shadow-inner flex flex-col">
                           {/* Embedded Object using Base64 Data URL */}
                           <object
                              data={pdfPreviewUrl}
                              type="application/pdf"
                              className="w-full h-full min-h-[550px] border-0"
                           >
                              {/* Fallback rendered automatically if Chrome blocks embedded PDF */}
                              <div className="p-8 bg-slate-50 rounded-2xl text-center flex flex-col items-center justify-center gap-4 h-full min-h-[450px]">
                                 <div className="p-3.5 bg-sky-100 text-sky-600 rounded-2xl border border-sky-200">
                                    <FileText className="w-10 h-10" />
                                 </div>
                                 <div className="max-w-md space-y-1">
                                    <h4 className="font-bold text-slate-800 text-sm">
                                       Dokumen PDF Berhasil Dibuat
                                    </h4>
                                    <p className="text-xs text-slate-500 leading-relaxed">
                                       Keamanan browser Chrome membatasi
                                       tampilan PDF interaktif di dalam frame
                                       sandbox. Anda dapat membuka atau
                                       mengunduh PDF secara langsung di bawah
                                       ini.
                                    </p>
                                 </div>
                                 <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
                                    <a
                                       href={pdfPreviewUrl}
                                       target="_blank"
                                       rel="noopener noreferrer"
                                       className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-md shadow-sky-600/20 flex items-center gap-1.5 transition cursor-pointer"
                                    >
                                       <ExternalLink className="w-4 h-4" />
                                       <span>Buka PDF di Tab Baru</span>
                                    </a>
                                    {!(isReport
                                       ? !isPeriodCompleted
                                       : !isFullyApproved) && (
                                       <button
                                          onClick={handleDownloadPDF}
                                          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition cursor-pointer"
                                       >
                                          <Download className="w-4 h-4 text-sky-400" />
                                          <span>Unduh File .PDF</span>
                                       </button>
                                    )}
                                 </div>
                              </div>
                           </object>
                        </div>
                     ) : (
                        <div className="p-8 text-center text-slate-400 text-xs font-bold bg-white rounded-2xl border border-slate-300">
                           Gagal memuat pratinjau PDF.
                        </div>
                     )}
                  </div>
               ) : isReport ? (
                  /* HTML FORMAL VIEW FOR REPORT DOCUMENT */
                  <div className="printable-a4-document max-w-[210mm] w-full mx-auto bg-white border border-black p-5 sm:p-6 space-y-4 rounded-none text-black">
                     {/* Kop Surat Header */}
                     <DocumentLetterhead
                        label="LAPORAN RESUME"
                        numberLabel={`Periode: ${reportFilterInfo?.periode || "Semua"}`}
                        dateLabel={`Tgl Cetak: ${currentDateStr}`}
                     />

                     {/* Title Banner */}
                     <div className="flex items-center justify-between gap-4 bg-white p-2.5 border border-black page-break-inside-avoid">
                        <div>
                           <h2 className="text-sm sm:text-base font-extrabold text-black uppercase tracking-wide">
                              REKAPITULASI PERMOHONAN
                           </h2>
                           <p className="text-[11px] text-black font-medium">
                              Dokumentasi Rekapitulasi Otorisasi Berjenjang
                              Tingkat Unit
                           </p>
                        </div>
                        <div className="px-3 py-1 border border-black text-xs font-extrabold uppercase text-black bg-white">
                           TOTAL: {reportSubmissions.length} TRANSAKSI
                        </div>
                     </div>

                     {/* Filter Meta Grid */}
                     <div className="p-3 bg-white border border-black text-[11px] grid grid-cols-2 sm:grid-cols-4 gap-2 text-black">
                        <p>
                           <span>Unit UPT:</span>{" "}
                           <strong>
                              {reportFilterInfo?.unitUpt || "Semua"}
                           </strong>
                        </p>
                        <p>
                           <span>ULTG:</span>{" "}
                           <strong>
                              {reportFilterInfo?.unitUltg || "Semua"}
                           </strong>
                        </p>
                        <p>
                           <span>Jenis:</span>{" "}
                           <strong>
                              {reportFilterInfo?.type
                                 ? reportFilterInfo.type.toUpperCase()
                                 : "Semua"}
                           </strong>
                        </p>
                        <p>
                           <span>Status:</span>{" "}
                           <strong className="text-emerald-800">
                              DISETUJUI
                           </strong>
                        </p>
                     </div>

                     {/* Table of Submissions */}
                     <div className="overflow-x-auto border border-black">
                        <table className="w-full text-left text-[10px] border-collapse">
                           <thead>
                              <tr className="bg-slate-100 text-black font-extrabold border-b border-black">
                                 <th className="p-1.5 border-r border-black w-8 text-center">
                                    NO
                                 </th>
                                 <th className="p-1.5 border-r border-black">
                                    NO. DOKUMEN
                                 </th>
                                 <th className="p-1.5 border-r border-black">
                                    NAMA / NIP
                                 </th>
                                 <th className="p-1.5 border-r border-black">
                                    JENIS
                                 </th>
                                 <th className="p-1.5 border-r border-black">
                                    UNIT / ULTG
                                 </th>
                                 <th className="p-1.5 border-r border-black">
                                    TGL PENGAJUAN
                                 </th>
                                 <th className="p-1.5 border-r border-black text-right">
                                    RINCAN / NOMINAL
                                 </th>
                                 <th className="p-1.5 text-center">STATUS</th>
                              </tr>
                           </thead>
                           <tbody>
                              {reportSubmissions.length === 0 ? (
                                 <tr>
                                    <td
                                       colSpan={8}
                                       className="p-4 text-center text-black font-bold"
                                    >
                                       Tidak ada data permohonan Approved 3
                                       untuk periode ini.
                                    </td>
                                 </tr>
                              ) : (
                                 reportSubmissions.map((sub, idx) => (
                                    <tr
                                       key={sub.id || idx}
                                       className="border-b border-black/50"
                                    >
                                       <td className="p-1.5 border-r border-black/50 text-center font-bold">
                                          {idx + 1}
                                       </td>
                                       <td className="p-1.5 border-r border-black/50 font-mono font-bold">
                                          {getFormattedDocNo(sub)}
                                       </td>
                                       <td className="p-1.5 border-r border-black/50 font-bold">
                                          {sub.employeeName} <br />
                                          <span className="font-normal font-mono text-[9px] text-black/80">
                                             {sub.employeeNip}
                                          </span>
                                       </td>
                                       <td className="p-1.5 border-r border-black/50 uppercase font-extrabold">
                                          {sub.type}
                                       </td>
                                       <td className="p-1.5 border-r border-black/50">
                                          {sub.unitUpt} <br />
                                          <span className="text-[9px] text-black/80">
                                             {sub.unitUltg}
                                          </span>
                                       </td>
                                       <td className="p-1.5 border-r border-black/50">
                                          {formatDateIndonesian(
                                             sub.tanggalPengajuan,
                                          )}
                                       </td>
                                       <td className="p-1.5 border-r border-black/50 text-right font-mono font-bold">
                                          {sub.type === "sppd"
                                             ? formatRupiah(
                                                  sub.totalEstimasiBiaya || 0,
                                               )
                                             : sub.type === "lembur"
                                               ? `${sub.durasiJam || 0} Jam`
                                               : `${sub.jumlahHari || 1} Hari`}
                                       </td>
                                       <td className="p-1.5 text-center font-bold text-emerald-800">
                                          APPROVED 3
                                       </td>
                                    </tr>
                                 ))
                              )}
                           </tbody>
                        </table>
                     </div>

                     {/* Report Summary Totals */}
                     <div className="p-3 bg-white border border-black flex flex-wrap items-center justify-between gap-3 text-xs font-bold text-black">
                        <div>
                           Total SPPD:{" "}
                           <strong>{formatRupiah(reportTotalSppd)}</strong>
                        </div>
                        <div>
                           Total Durasi Lembur:{" "}
                           <strong>{reportTotalLemburHours} Jam</strong>
                        </div>
                        <div>
                           Total Transaksi:{" "}
                           <strong>{reportSubmissions.length} Berkas</strong>
                        </div>
                     </div>

                     {/* Report Signatories Section */}
                     {(() => {
                        let displaySigs =
                           Array.isArray(reportSignatories) &&
                           reportSignatories.length > 0
                              ? reportSignatories
                              : DataService.getDefaultReportSignatories(
                                   reportFilterInfo?.unit ||
                                      reportFilterInfo?.unitUpt,
                                );

                        if (
                           displaySigs.length === 3 &&
                           (displaySigs[0].role?.includes("Verifikasi") ||
                              displaySigs[0].title === "DIVERIFIKASI OLEH")
                        ) {
                           displaySigs = [
                              {
                                 ...displaySigs[1],
                                 title: "DIVERIFIKASI OLEH",
                                 role: "Checker",
                              },
                              displaySigs[2],
                           ];
                        }

                        return (
                           <div className="space-y-2 pt-2 page-break-inside-avoid">
                              <div className="border-b border-black pb-1">
                                 <h4 className="text-xs font-black uppercase text-black tracking-wide">
                                    LEMBAR PENGESAHAN
                                 </h4>
                              </div>
                              <div
                                 className={`grid ${displaySigs.length === 2 ? "grid-cols-2" : displaySigs.length === 1 ? "grid-cols-1" : "grid-cols-3"} gap-4 text-black`}
                              >
                                 {displaySigs.map((sig, sIdx) => (
                                    <div
                                       key={sIdx}
                                       className="border border-black p-2 flex flex-col justify-between h-36 bg-white"
                                    >
                                       <div>
                                          <p className="text-[9px] font-bold border-b border-black pb-1 uppercase">
                                             {sig.title ||
                                                sig.positionLabel ||
                                                sig.role ||
                                                `Penandatangan ${sIdx + 1}`}
                                          </p>
                                          <p className="font-bold text-[10.5px] truncate mt-1">
                                             {sig.name || "-"}
                                          </p>
                                          <p className="text-[9px] text-black/80 truncate">
                                             {sig.nip
                                                ? `NIP. ${sig.nip}`
                                                : sig.jabatan || "-"}
                                          </p>
                                       </div>
                                       <div className="my-0.5 h-12 w-full flex items-center justify-center border border-dashed border-black/40 p-0.5 overflow-hidden">
                                          {sig.signatureUrl ? (
                                             <img
                                                src={sig.signatureUrl}
                                                alt="TTD"
                                                className="max-h-12 max-w-full h-auto w-auto object-contain mix-blend-multiply filter contrast-125"
                                             />
                                          ) : (
                                             <span className="text-[8.5px] font-bold text-black uppercase">
                                                [ TTD VALID DIGITAL ]
                                             </span>
                                          )}
                                       </div>
                                       <div className="text-[8px] pt-1 border-t border-black/80 font-mono">
                                          Tgl: {currentDateStr}
                                       </div>
                                    </div>
                                 ))}
                              </div>
                           </div>
                        );
                     })()}

                     {/* Authenticity Verification Footer */}
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
                              <p className="font-bold text-black">
                                 DOKUMEN LAPORAN RESUME ELEKTRONIK
                              </p>
                              <p className="text-[9.5px] text-black">
                                 Otorisasi SEMAR PLN Electricity Services
                              </p>
                              <p className="text-[9.5px] text-black">
                                 Unit Pelaksana 2 Jawa Tengah &amp; DI
                                 Yogyakarta
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
                        </div>
                     </div>
                  </div>
               ) : (
                  /* HTML FORMAL VIEW FOR SINGLE SUBMISSION DOCUMENT */
                  <>
                  <div className="printable-a4-document max-w-[210mm] w-full mx-auto bg-white border border-black p-5 sm:p-6 space-y-4 rounded-none text-black">
                     {/* Header Kop Surat PLN Formal */}
                     <DocumentLetterhead
                        label="FORMULIR PERSETUJUAN RESMI"
                        numberLabel={`No: ${finalDocNo}`}
                        dateLabel={`Tgl Pengajuan: ${formatDateIndonesian(submission.tanggalPengajuan)}`}
                     />

                     {/* Document Title & Status Banner Formal Clean */}
                     <div className="flex items-center justify-between gap-4 bg-white p-2.5 border border-black page-break-inside-avoid">
                        <div>
                           <h2 className="text-sm sm:text-base font-extrabold text-black uppercase tracking-wide">
                              PENGAJUAN {submission.type.toUpperCase()} DIGITAL
                           </h2>
                           <p className="text-[11px] text-black font-medium">
                              Dokumentasi Berjenjang Transparan &amp; Akuntabel
                           </p>
                        </div>
                        <div className="px-3 py-1 border border-black text-xs font-extrabold uppercase text-black bg-white">
                           STATUS:{" "}
                           {getStatusLabel(submission.status).toUpperCase()}
                        </div>
                     </div>

                     {/* Rejection / Cancellation Note Banner */}
                     {(submission.status?.toLowerCase() === "dibatalkan" ||
                        submission.status?.toLowerCase() === "rejected" ||
                        submission.rejectionReason) && (
                        <div className="p-3 bg-white border border-black space-y-1 page-break-inside-avoid">
                           <p className="font-extrabold text-black uppercase tracking-tight text-xs flex items-center gap-1.5">
                              <XCircle className="w-4 h-4 text-black" />
                              {submission.status?.toLowerCase() === "dibatalkan"
                                 ? "KETERANGAN TRANSAKSI DIBATALKAN"
                                 : "KETERANGAN CATATAN PENOLAKAN"}
                           </p>
                           <p className="text-xs text-black font-semibold">
                              {submission.rejectionReason ||
                                 (submission.status?.toLowerCase() ===
                                 "dibatalkan"
                                    ? "Transaksi Dibatalkan oleh Pemohon"
                                    : "Pengajuan tidak disetujui.")}
                           </p>
                        </div>
                     )}

                     {/* Employee & Unit Info Grid */}
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs page-break-inside-avoid">
                        <div className="bg-white p-3 border border-black space-y-1.5">
                           <p className="font-extrabold text-black border-b border-black pb-1 uppercase tracking-tight flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5 text-black" />{" "}
                              BIODATA TENAGA KERJA
                           </p>
                           <div className="grid grid-cols-3 gap-1 text-[11px]">
                              <span className="text-black">Nama Lengkap</span>
                              <span className="col-span-2 font-bold text-black">
                                 : {submission.employeeName}
                              </span>
                              <span className="text-black">NIP</span>
                              <span className="col-span-2 font-mono font-bold text-black">
                                 : {submission.employeeNip}
                              </span>
                              <span className="text-black">Jabatan</span>
                              <span className="col-span-2 text-black">
                                 : {submission.employeeJabatan}
                              </span>
                           </div>
                        </div>

                        <div className="bg-white p-3 border border-black space-y-1.5">
                           <p className="font-extrabold text-black border-b border-black pb-1 uppercase tracking-tight flex items-center gap-1.5">
                              <Building2 className="w-3.5 h-3.5 text-black" />{" "}
                              LOKASI UNIT KERJA
                           </p>
                           <div className="grid grid-cols-3 gap-1 text-[11px]">
                              <span className="text-black">Unit UPT</span>
                              <span className="col-span-2 font-semibold text-black">
                                 : {submission.unitUpt}
                              </span>
                              <span className="text-black">ULTG</span>
                              <span className="col-span-2 text-black">
                                 : {submission.unitUltg}
                              </span>
                              <span className="text-black">Gardu Induk</span>
                              <span className="col-span-2 font-bold text-black">
                                 : {submission.garduInduk}
                              </span>
                           </div>
                        </div>
                     </div>

                     {/* Dynamic Content Details by Submission Type */}
                     <div className="bg-white p-3 border border-black text-xs space-y-3 page-break-inside-avoid">
                        <p className="font-extrabold text-black border-b border-black pb-1 uppercase tracking-tight flex items-center gap-1.5">
                           <Briefcase className="w-3.5 h-3.5 text-black" />{" "}
                           DETAIL DOKUMEN PENGAJUAN
                        </p>

                        {/* LEMBUR */}
                        {submission.type === "lembur" && (
                           <div className="space-y-3 text-black">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                                 <p>
                                    <span className="text-black">
                                       Tanggal Lembur:
                                    </span>{" "}
                                    <strong className="ml-1">
                                       {formatDateIndonesian(
                                          submission.tanggalLembur,
                                       )}
                                    </strong>
                                 </p>
                                 <p>
                                    <span className="text-black">
                                       Jam Operasional:
                                    </span>{" "}
                                    <strong className="ml-1">
                                       {submission.jamMulai} -{" "}
                                       {submission.jamSelesai} (
                                       {submission.durasiJam} Jam)
                                    </strong>
                                 </p>
                                 <p>
                                    <span className="text-black">
                                       Kategori Lembur:
                                    </span>{" "}
                                    <strong className="ml-1">
                                       {submission.kategoriLembur}
                                    </strong>
                                 </p>
                                 {submission.jenisPekerjaan &&
                                    submission.jenisPekerjaan !== "-" && (
                                       <p>
                                          <span className="text-black">
                                             Jenis Pekerjaan:
                                          </span>{" "}
                                          <strong className="ml-1">
                                             {submission.jenisPekerjaan}
                                          </strong>
                                       </p>
                                    )}
                                 <p>
                                    <span className="text-black font-semibold">
                                       Area Group:
                                    </span>{" "}
                                    <strong className="ml-1">
                                       {submission.areaGroup}
                                    </strong>
                                 </p>
                                 {submission.petugasPendampingNama && (
                                    <p>
                                       <span className="text-black">
                                          Ganti Piket An. :
                                       </span>{" "}
                                       <strong className="ml-1">
                                          {submission.petugasPendampingNip} -{" "}
                                          {submission.petugasPendampingNama}
                                       </strong>
                                    </p>
                                 )}
                                 {submission.jumlahJamKoreksi !== undefined &&
                                    submission.jumlahJamKoreksi !== null &&
                                    submission.jumlahJamKoreksi !== "" && (
                                       <p>
                                          <span className="text-black">
                                             Jumlah Lembur Koreksi:
                                          </span>{" "}
                                          <strong className="ml-1 font-bold text-black">
                                             {submission.jumlahJamKoreksi} Jam
                                          </strong>
                                       </p>
                                    )}
                                 {submission.catatanKoreksi && (
                                    <p className="col-span-full">
                                       <span className="text-black font-semibold">
                                          Catatan Koreksi Checker:
                                       </span>{" "}
                                       {submission.catatanKoreksi}
                                    </p>
                                 )}
                                 <p className="col-span-full">
                                    <span className="text-black font-semibold">
                                       Uraian Pekerjaan:
                                    </span>{" "}
                                    {submission.kegiatanDetail}
                                 </p>
                              </div>
                           </div>
                        )}

                        {/* CUTI */}
                        {submission.type === "cuti" && (
                           <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-black">
                              <p>
                                 <span className="text-black">Jenis Cuti:</span>{" "}
                                 <strong className="ml-1 text-black">
                                    {submission.cutiType}
                                 </strong>
                              </p>
                              <p>
                                 <span className="text-black">
                                    Periode Cuti:
                                 </span>{" "}
                                 <strong className="ml-1">
                                    {formatDateIndonesian(
                                       submission.tanggalMulai,
                                    )}{" "}
                                    s/d{" "}
                                    {formatDateIndonesian(
                                       submission.tanggalSelesai,
                                    )}
                                 </strong>
                              </p>
                              <p>
                                 <span className="text-black">
                                    Jumlah Durasi:
                                 </span>{" "}
                                 <strong className="ml-1">
                                    {submission.jumlahHari} Hari Kerja
                                 </strong>
                              </p>
                              <p>
                                 <span className="text-black">
                                    Sisa Cuti Pasca Pengajuan:
                                 </span>{" "}
                                 <strong className="ml-1 text-black">
                                    {submission.sisaCutiSesudahnya} Hari
                                 </strong>{" "}
                                 (Sebelumnya:{" "}
                                 {submission.sisaCutiSebelumnya || "-"} Hari)
                              </p>
                              <p className="col-span-full">
                                 <span className="text-black">
                                    Alamat Selama Cuti &amp; Kontak Darurat:
                                 </span>{" "}
                                 {submission.alamatSelamaCuti} (Telp:{" "}
                                 {submission.nomorTeleponDarurat})
                              </p>
                           </div>
                        )}

                        {/* IJIN */}
                        {submission.type === "ijin" && (
                           <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-black">
                              <p>
                                 <span className="text-black">
                                    Alasan / Jenis Ijin:
                                 </span>{" "}
                                 <strong className="ml-1 text-black">
                                    {submission.ijinReasonType ||
                                       submission.alasanIjin ||
                                       "Ijin Resmi"}
                                 </strong>
                              </p>
                              <p>
                                 <span className="text-black">
                                    Jumlah Hari (Ijin):
                                 </span>{" "}
                                 <strong className="ml-1 text-sky-900 font-bold">
                                    {submission.jumlahHari} Hari
                                 </strong>
                              </p>
                              <p>
                                 <span className="text-black">
                                    Jumlah Hari (di Setujui):
                                 </span>{" "}
                                 <strong className="ml-1 text-emerald-800 font-bold">
                                    {submission.jumlahHariDisetujui
                                       ? `${submission.jumlahHariDisetujui} Hari`
                                       : `${submission.jumlahHari} Hari (Proses)`}
                                 </strong>
                              </p>
                              <p className="col-span-full">
                                 <span className="text-black">
                                    Periode Ijin:
                                 </span>{" "}
                                 <strong className="ml-1">
                                    {formatDateIndonesian(
                                       submission.tanggalMulai,
                                    )}{" "}
                                    s/d{" "}
                                    {formatDateIndonesian(
                                       submission.tanggalSelesai,
                                    )}
                                 </strong>
                              </p>
                              <p className="col-span-full">
                                 <span className="text-black">
                                    Keterangan / Keperluan:
                                 </span>{" "}
                                 {submission.keterangan || "-"}
                              </p>
                           </div>
                        )}

                        {/* SAKIT */}
                        {submission.type === "sakit" && (
                           <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-black">
                              <p>
                                 <span className="text-black">
                                    Instansi / Klinik / RS:
                                 </span>{" "}
                                 <strong className="ml-1 text-black">
                                    {submission.instansiKlinik ||
                                       submission.namaDokterFaskes ||
                                       "-"}
                                 </strong>
                              </p>
                              <p>
                                 <span className="text-black">
                                    Dokter Penanggung Jawab:
                                 </span>{" "}
                                 <strong className="ml-1 text-black">
                                    {submission.namaDokter || "-"}
                                 </strong>
                              </p>
                              <p>
                                 <span className="text-black">
                                    Periode Istirahat Sakit:
                                 </span>{" "}
                                 <strong className="ml-1">
                                    {formatDateIndonesian(
                                       submission.tanggalMulai,
                                    )}{" "}
                                    s/d{" "}
                                    {formatDateIndonesian(
                                       submission.tanggalSelesai,
                                    )}{" "}
                                    ({submission.jumlahHari} Hari)
                                 </strong>
                              </p>
                              <p>
                                 <span className="text-black">
                                    Diagnosa Singkat:
                                 </span>{" "}
                                 <strong className="ml-1 text-black">
                                    {submission.diagnosaSingkat || "-"}
                                 </strong>
                              </p>
                           </div>
                        )}

                        {/* SPPD */}
                        {submission.type === "sppd" && (
                           <div className="space-y-3 text-black">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                                 <p>
                                    <span className="text-black">
                                       No. Surat Tugas PLN:
                                    </span>{" "}
                                    <strong className="ml-1 font-mono text-black">
                                       {submission.nomorSuratTugas}
                                    </strong>
                                 </p>
                                 <p>
                                    <span className="text-black">
                                       Rute Perjalanan Dinas:
                                    </span>{" "}
                                    <strong className="ml-1">
                                       {submission.kotaAsal} &rarr;{" "}
                                       {submission.kotaTujuan} (
                                       {submission.durasiHari} Hari)
                                    </strong>
                                 </p>
                                 <p>
                                    <span className="text-black">
                                       Tanggal Berangkat &amp; Kembali:
                                    </span>{" "}
                                    <strong className="ml-1">
                                       {formatDateIndonesian(
                                          submission.tanggalBerangkat,
                                       )}{" "}
                                       s/d{" "}
                                       {formatDateIndonesian(
                                          submission.tanggalKembali,
                                       )}
                                    </strong>
                                 </p>
                                 <p>
                                    <span className="text-black">
                                       Beban Anggaran Unit:
                                    </span>{" "}
                                    <strong className="ml-1">
                                       {submission.bebanAnggaranUnit || "-"}
                                    </strong>
                                 </p>
                                 <p className="col-span-full">
                                    <span className="text-black">
                                       Maksud Perjalanan:
                                    </span>{" "}
                                    {submission.maksudPerjalanan}
                                 </p>
                              </div>

                              {/* Expenses Table */}
                              <div className="overflow-x-auto mt-1">
                                 <table className="w-full text-left text-[11px] border-collapse border border-black">
                                    <thead>
                                       <tr className="bg-white text-black font-extrabold border-b border-black">
                                          <th className="p-1.5 border-r border-black">
                                             Rincian Komponen Biaya
                                          </th>
                                          <th className="p-1.5 border-r border-black">
                                             Kategori
                                          </th>
                                          <th className="p-1.5 text-right">
                                             Nominal (Rp)
                                          </th>
                                       </tr>
                                    </thead>
                                    <tbody>
                                       {submission.expenses?.map((exp) => (
                                          <tr
                                             key={exp.id}
                                             className="border-b border-black/40"
                                          >
                                             <td className="p-1.5 border-r border-black/40">
                                                {exp.deskripsi}
                                             </td>
                                             <td className="p-1.5 border-r border-black/40">
                                                {exp.kategori}
                                             </td>
                                             <td className="p-1.5 text-right font-mono font-bold">
                                                {showSppdNominal
                                                   ? formatRupiah(
                                                        exp.nominal || 0,
                                                     )
                                                   : "-"}
                                             </td>
                                          </tr>
                                       ))}
                                       <tr className="font-extrabold bg-white border-t border-black">
                                          <td
                                             colSpan={2}
                                             className="p-1.5 text-right border-r border-black"
                                          >
                                             TOTAL SPPD:
                                          </td>
                                          <td className="p-1.5 text-right font-mono text-xs text-black">
                                             {showSppdNominal
                                                ? formatRupiah(
                                                     calculatedTotalSppd,
                                                  )
                                                : "-"}
                                          </td>
                                       </tr>
                                    </tbody>
                                 </table>
                              </div>
                           </div>
                        )}
                     </div>

                     {/* Signature Matrix Section */}
                     <div className="space-y-3 pt-1 page-break-inside-avoid">
                        <div className="flex items-center justify-between border-b-2 border-black pb-1">
                           <h3 className="text-xs font-black text-black flex items-center gap-1.5 uppercase tracking-wide">
                              <ShieldCheck className="w-4 h-4 text-black" />
                              DOKUMENTASI TANDA TANGAN DIGITAL
                           </h3>
                           <span className="text-[8px] text-black font-semibold">
                              Verifikasi Enkripsi Hash Digital #PLNES-UP2
                           </span>
                        </div>

                        {/* Pemohon Group */}
                        <div className="flex justify-center">
                           <div className="w-full sm:w-1/3 max-w-xs">
                              <p className="text-[10px] font-extrabold text-black mb-1 text-center uppercase tracking-wider border border-black py-0.5 bg-white">
                                 1. PEMOHON
                              </p>
                              {renderSignatureBox(
                                 "Maker / Pemohon",
                                 null,
                                 true,
                              )}
                           </div>
                        </div>

                        {/* Middle Left & Middle Right Approvers */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 pt-1">
                           <div className="bg-white p-2 border border-black space-y-1.5">
                              <p className="text-[10px] font-extrabold text-black uppercase tracking-wider border-b border-black pb-1 flex items-center justify-between">
                                 <span>2. PENGGUNA / UNIT PLN</span>
                              </p>
                              <div
                                 className={`grid grid-cols-1 ${hasVerificationAssigned ? "sm:grid-cols-3" : "sm:grid-cols-2"} gap-2`}
                              >
                                 {renderSignatureBox(checkerStep)}
                                 {hasVerificationAssigned &&
                                    renderSignatureBox(verificationStep)}
                                 {renderSignatureBox(approved1Step)}
                              </div>
                           </div>

                           <div className="bg-white p-2 border border-black space-y-1.5">
                              <p className="text-[10px] font-extrabold text-black uppercase tracking-wider border-b border-black pb-1 flex items-center justify-between">
                                 <span>3. PLN ES UP 2</span>
                              </p>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                 {renderSignatureBox(approved2Step)}
                                 {renderSignatureBox(approved3Step)}
                              </div>
                           </div>
                        </div>
                     </div>

                     {/* Authenticity Verification Footer */}
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
                              <p className="font-bold text-black">
                                 DOKUMEN ELEKTRONIK
                              </p>
                              <p className="text-[9.5px] text-black">
                                 Otorisasi SEMAR PLN Electricity Services
                              </p>
                              <p className="text-[9.5px] text-black">
                                 Unit Pelaksana 2 Jawa Tengah &amp; DI
                                 Yogyakarta
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
                           <p className="text-black font-bold">
                              <span className="print:hidden">
                                 Halaman 1 dari {1 + submissionAttachments.length}
                              </span>
                              <span className="hidden print:inline-block page-counter"></span>
                           </p>
                        </div>
                     </div>
                  </div>

                  {submissionAttachments.map((attachment, index) => {
                     const isPdfAttachment = /\.pdf(?:$|\?)/i.test(attachment.url) ||
                        /\.pdf$/i.test(attachment.fileName || "");
                     return (
                        <div
                           key={`${attachment.url}-${index}`}
                           className="printable-a4-document max-w-[210mm] min-h-[297mm] w-full mx-auto mt-4 bg-white border border-black p-5 sm:p-6 rounded-none text-black flex flex-col print:break-before-page"
                        >
                           <DocumentLetterhead
                              label="LAMPIRAN DOKUMEN PENGAJUAN"
                              numberLabel={`No: ${finalDocNo}`}
                              dateLabel={`Tgl Pengajuan: ${formatDateIndonesian(submission.tanggalPengajuan)}`}
                           />

                           <div className="my-4 border border-black p-3 flex-1 flex flex-col min-h-0">
                              <div className="mb-3 pb-2 border-b border-black">
                                 <h3 className="text-sm font-extrabold uppercase tracking-wide">
                                    {attachment.label}
                                 </h3>
                                 <p className="text-[10px] text-slate-700 mt-1 font-mono break-all">
                                    Berkas: {attachment.fileName}
                                 </p>
                              </div>
                              {isPdfAttachment ? (
                                 <object
                                    data={attachment.url}
                                    type="application/pdf"
                                    className="w-full flex-1 min-h-[215mm] border border-slate-300"
                                 >
                                    <a href={attachment.url} target="_blank" rel="noreferrer" className="text-sky-700 underline">
                                       Buka lampiran PDF {attachment.label}
                                    </a>
                                 </object>
                              ) : (
                                 <img
                                    src={attachment.url}
                                    alt={attachment.label}
                                    className="w-full flex-1 min-h-0 object-contain"
                                    referrerPolicy="no-referrer"
                                 />
                              )}
                           </div>

                           <div className="pt-3 border-t border-black flex flex-col sm:flex-row items-center justify-between text-[10px] text-black gap-2 page-break-inside-avoid">
                              <div className="flex items-center gap-2.5">
                                 {qrCodeDataUrl ? (
                                    <img src={qrCodeDataUrl} alt="QR Code Pengesahan" className="w-10 h-10 object-contain" />
                                 ) : (
                                    <div className="p-1.5 bg-white border border-black"><QrCode className="w-7 h-7 text-black" /></div>
                                 )}
                                 <div>
                                    <p className="font-bold text-black">DOKUMEN ELEKTRONIK</p>
                                    <p className="text-[9.5px] text-black">Otorisasi SEMAR PLN Electricity Services</p>
                                    <p className="text-[9.5px] text-black">Unit Pelaksana 2 Jawa Tengah &amp; DI Yogyakarta</p>
                                 </div>
                              </div>
                              <div className="text-right font-mono text-[9.5px] flex flex-col items-end">
                                 <img src={semarLogo} alt="SEMAR Logo" className="h-6 sm:h-7 w-auto object-contain mb-0.5" referrerPolicy="no-referrer" />
                                 <p>Waktu Cetak: {new Date().toLocaleString("id-ID")}</p>
                                 <p className="font-bold">Halaman {index + 2} dari {submissionAttachments.length + 1}</p>
                              </div>
                           </div>
                        </div>
                     );
                  })}
                  </>
               )}
            </div>

            {/* Modal Footer (Hidden on print) */}
            <div className="bg-slate-900 px-4 sm:px-6 py-3 border-t border-slate-800 flex items-center justify-between gap-3 text-white text-xs shrink-0 modal-controls">
               <div className="text-slate-400 font-medium hidden sm:block">
                  {isReport ? (
                     <span>
                        Total Submissions Approved:{" "}
                        <strong className="text-sky-400">
                           {reportSubmissions.length} Transaksi
                        </strong>
                     </span>
                  ) : (
                     <span>Otorisasi Digital Berjenjang #PLNES-UP2</span>
                  )}
               </div>
               <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  {pdfPreviewUrl && (
                     <a
                        href={pdfPreviewUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3.5 py-2 font-bold text-xs bg-slate-800 hover:bg-slate-700 text-sky-300 rounded-xl border border-slate-700 transition cursor-pointer flex items-center gap-1.5"
                     >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Buka Tab Baru</span>
                     </a>
                  )}
                  <button
                     onClick={onClose}
                     className="px-5 py-2 font-bold text-xs bg-white hover:bg-slate-100 text-slate-900 rounded-xl transition cursor-pointer"
                  >
                     Tutup
                  </button>
               </div>
            </div>
         </motion.div>
      </div>
   );
};
