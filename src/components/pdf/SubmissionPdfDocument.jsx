import React from "react";
import {
   Document,
   Page,
   Text,
   View,
   StyleSheet,
   Image,
} from "@react-pdf/renderer";
import QRCode from "qrcode";
import {
   formatRupiah,
   formatDateIndonesianLong as formatDateIndonesian,
   getStatusLabel,
   getFormattedDocNo,
} from "../../utils/formatters";
import { DataService } from "../../services/dataService";
import { AuthService } from "../../services/authService";
import { PLN_LOGO_PNG_BASE64 } from "../../assets/plnLogoBase64";
import semarLogo from "../../assets/logo_semar_trns.png";
import { DOCUMENT_LETTERHEAD } from "./documentLetterhead";
import { resolveSubmissionStatus } from "../../utils/submissionStatus";
import { resolveSubmissionWorkUnits } from "../../utils/submissionWorkUnits";
import { getStaticSppdExpenses } from "../../utils/sppdExpenses";

const plnLogo = PLN_LOGO_PNG_BASE64;

function generateQrCodeDataUrlSync(text) {
   try {
      if (typeof document !== "undefined") {
         const canvas = document.createElement("canvas");
         canvas.width = 150;
         canvas.height = 150;
         QRCode.toCanvas(canvas, text, {
            width: 150,
            margin: 1,
            color: { dark: "#000000", light: "#ffffff" },
            errorCorrectionLevel: "M",
         });
         return canvas.toDataURL("image/png");
      }
   } catch (err) {
      console.error("Error generating QR code PNG:", err);
   }
   return "";
}

const styles = StyleSheet.create({
   page: {
      size: "A4",
      paddingTop: 80,
      paddingBottom: 70,
      paddingLeft: 30,
      paddingRight: 30,
      fontFamily: "Helvetica",
      backgroundColor: "#FFFFFF",
      fontSize: 8.5,
      color: "#000000",
   },
   // Header Kop Surat Formal
   headerContainer: {
      position: "absolute",
      top: 20,
      left: 30,
      right: 30,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      minHeight: 48,
      paddingBottom: 7,
      borderBottomWidth: 2,
      borderBottomColor: DOCUMENT_LETTERHEAD.colors.line,
   },
   headerLeft: {
      flexDirection: "row",
      alignItems: "center",
   },
   plnLogo: {
      height: 32,
      width: "auto",
      marginRight: 9,
   },
   headerUnitText: {
      fontSize: 7.5,
      fontFamily: "Helvetica-Bold",
      color: DOCUMENT_LETTERHEAD.colors.primary,
      textTransform: "uppercase",
   },
   headerSubUnitText: {
      fontSize: 6.2,
      color: DOCUMENT_LETTERHEAD.colors.muted,
      marginTop: 2,
   },
   headerTitleGroup: {
      flexDirection: "column",
   },
   companyName: {
      fontSize: 11,
      fontFamily: "Helvetica-Bold",
      color: "#000000",
      letterSpacing: -0.2,
      textTransform: "uppercase",
   },
   subTitle: {
      fontSize: 7.5,
      fontFamily: "Helvetica-Bold",
      color: "#000000",
      marginTop: 1,
      textTransform: "uppercase",
   },
   unitTitle: {
      fontSize: 6.5,
      color: "#000000",
      marginTop: 1,
   },
   headerRight: {
      flexDirection: "column",
      alignItems: "flex-end",
      paddingLeft: 10,
      borderLeftWidth: 1,
      borderLeftColor: DOCUMENT_LETTERHEAD.colors.accent,
   },
   docLabel: {
      fontSize: 7.5,
      fontFamily: "Helvetica-Bold",
      color: DOCUMENT_LETTERHEAD.colors.primary,
      textTransform: "uppercase",
   },
   docNo: {
      fontSize: 7.5,
      fontFamily: "Helvetica-Bold",
      color: DOCUMENT_LETTERHEAD.colors.ink,
      marginTop: 1,
   },
   docDate: {
      fontSize: 6.5,
      color: DOCUMENT_LETTERHEAD.colors.muted,
      marginTop: 1,
   },

   // Document Title & Status Banner
   bannerContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      backgroundColor: "#FFFFFF",
      padding: 5,
      borderWidth: 1,
      borderColor: "#000000",
      marginBottom: 6,
   },
   bannerTitle: {
      fontSize: 9,
      fontFamily: "Helvetica-Bold",
      color: "#000000",
      textTransform: "uppercase",
   },
   bannerSubtitle: {
      fontSize: 6.5,
      color: "#000000",
      marginTop: 1,
   },
   statusBadge: {
      paddingVertical: 3,
      paddingHorizontal: 7,
      borderWidth: 1,
      borderColor: "#000000",
      backgroundColor: "#FFFFFF",
   },
   statusBadgeText: {
      fontSize: 7,
      fontFamily: "Helvetica-Bold",
      color: "#000000",
      textTransform: "uppercase",
   },

   // Rejection / Cancellation Banner
   rejectionBanner: {
      backgroundColor: "#FFFFFF",
      padding: 5,
      borderWidth: 1,
      borderColor: "#000000",
      marginBottom: 6,
   },
   rejectionTitle: {
      fontSize: 7.5,
      fontFamily: "Helvetica-Bold",
      color: "#000000",
      textTransform: "uppercase",
   },
   rejectionText: {
      fontSize: 7,
      fontFamily: "Helvetica-Bold",
      color: "#000000",
      marginTop: 2,
   },

   // Grid info box (2 columns)
   gridRow: {
      flexDirection: "row",
      gap: 6,
      marginBottom: 6,
   },
   infoBox: {
      flex: 1,
      backgroundColor: "#FFFFFF",
      padding: 6,
      borderWidth: 1,
      borderColor: "#000000",
   },
   boxTitle: {
      fontSize: 7,
      fontFamily: "Helvetica-Bold",
      color: "#000000",
      borderBottomWidth: 1,
      borderBottomColor: "#000000",
      paddingBottom: 2,
      marginBottom: 4,
      textTransform: "uppercase",
   },
   kvRow: {
      flexDirection: "row",
      marginBottom: 2.5,
   },
   kvLabel: {
      width: 65,
      fontSize: 6.5,
      color: "#000000",
   },
   kvValue: {
      flex: 1,
      fontSize: 6.5,
      fontFamily: "Helvetica-Bold",
      color: "#000000",
   },

   // Detail section
   detailBox: {
      backgroundColor: "#FFFFFF",
      padding: 6,
      borderWidth: 1,
      borderColor: "#000000",
      marginBottom: 6,
   },
   detailGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 4,
   },
   detailItem: {
      width: "48%",
      marginBottom: 3,
   },
   detailFull: {
      width: "100%",
      marginBottom: 3,
   },
   detailLabel: {
      fontSize: 6.5,
      color: "#000000",
   },
   detailValue: {
      fontSize: 7,
      fontFamily: "Helvetica-Bold",
      color: "#000000",
      marginTop: 1,
   },

   sectionSubHeader: {
      fontSize: 7,
      fontFamily: "Helvetica-Bold",
      color: "#000000",
      textTransform: "uppercase",
      marginTop: 4,
      marginBottom: 3,
   },

   // Photo Grid for Lembur
   photoGrid: {
      flexDirection: "row",
      gap: 6,
      marginBottom: 6,
   },
   photoBox: {
      flex: 1,
      backgroundColor: "#FFFFFF",
      borderWidth: 1,
      borderColor: "#000000",
      padding: 4,
   },
   photoTitle: {
      fontSize: 6.5,
      fontFamily: "Helvetica-Bold",
      color: "#000000",
      marginBottom: 3,
      textTransform: "uppercase",
   },
   photoImage: {
      width: "100%",
      height: 65,
      objectFit: "cover",
      borderWidth: 0.5,
      borderColor: "#000000",
   },
   emptyAttachmentBox: {
      borderWidth: 1,
      borderStyle: "dashed",
      borderColor: "#888888",
      paddingVertical: 14,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 2,
   },
   emptyAttachmentText: {
      fontSize: 6.5,
      fontStyle: "italic",
      color: "#666666",
   },

   // Dasar Perintah Lembur Full Box
   dasarPerintahFullBox: {
      width: "100%",
      backgroundColor: "#FFFFFF",
      borderWidth: 1,
      borderColor: "#000000",
      padding: 5,
   },
   dasarPerintahHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      borderBottomWidth: 1,
      borderBottomColor: "#000000",
      paddingBottom: 2,
      marginBottom: 4,
   },
   dasarPerintahTitle: {
      fontSize: 6.5,
      fontFamily: "Helvetica-Bold",
      color: "#000000",
      textTransform: "uppercase",
   },
   dasarPerintahFileName: {
      fontSize: 6,
      fontFamily: "Helvetica-Bold",
      color: "#000000",
   },
   dasarPerintahContentRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
   },
   dasarPerintahImage: {
      height: 55,
      maxWidth: 160,
      objectFit: "contain",
      borderWidth: 0.5,
      borderColor: "#000000",
   },

   // Table SPPD Expenses
   table: {
      width: "100%",
      marginTop: 4,
      borderWidth: 1,
      borderColor: "#000000",
   },
   tableHeader: {
      flexDirection: "row",
      backgroundColor: "#FFFFFF",
      borderBottomWidth: 1,
      borderBottomColor: "#000000",
      padding: 3,
   },
   tableHeaderCell: {
      fontSize: 6.5,
      fontFamily: "Helvetica-Bold",
      color: "#000000",
      textTransform: "uppercase",
   },
   tableRow: {
      flexDirection: "row",
      borderBottomWidth: 0.5,
      borderBottomColor: "#000000",
      padding: 3,
   },
   tableRowTotal: {
      flexDirection: "row",
      backgroundColor: "#FFFFFF",
      padding: 3,
      borderTopWidth: 1,
      borderTopColor: "#000000",
   },
   tableCellDesc: { flex: 2, fontSize: 6.5, color: "#000000" },
   tableCellCat: { flex: 1, fontSize: 6.5, color: "#000000" },
   tableCellNominal: {
      flex: 1,
      fontSize: 6.5,
      fontFamily: "Helvetica-Bold",
      textAlign: "right",
      color: "#000000",
   },

   // Signatures Section
   signatureSection: {
      marginTop: 4,
      marginBottom: 6,
   },
   signatureHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      borderBottomWidth: 1.5,
      borderBottomColor: "#000000",
      paddingBottom: 3,
      marginBottom: 4,
   },
   signatureSectionTitle: {
      fontSize: 7.5,
      fontFamily: "Helvetica-Bold",
      color: "#000000",
      textTransform: "uppercase",
   },
   signatureSubText: {
      fontSize: 6,
      color: "#000000",
   },

   // Groups Layout
   topGroupContainer: {
      alignItems: "center",
      marginBottom: 6,
   },
   topGroupWidth: {
      width: 170,
   },
   groupTitleTop: {
      fontSize: 6.5,
      fontFamily: "Helvetica-Bold",
      color: "#000000",
      backgroundColor: "#FFFFFF",
      borderWidth: 1,
      borderColor: "#000000",
      paddingVertical: 1.5,
      paddingHorizontal: 4,
      marginBottom: 3,
      textAlign: "center",
      textTransform: "uppercase",
   },
   middleGroupRow: {
      flexDirection: "row",
      gap: 5,
   },
   leftGroupContainer: {
      flex: 3,
      backgroundColor: "#FFFFFF",
      padding: 3,
      borderWidth: 1,
      borderColor: "#000000",
   },
   rightGroupContainer: {
      flex: 2,
      backgroundColor: "#FFFFFF",
      padding: 3,
      borderWidth: 1,
      borderColor: "#000000",
   },
   groupHeaderRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      borderBottomWidth: 1,
      borderBottomColor: "#000000",
      paddingBottom: 2,
      marginBottom: 3,
   },
   groupTitleInline: {
      fontSize: 6.5,
      fontFamily: "Helvetica-Bold",
      color: "#000000",
      textTransform: "uppercase",
   },
   groupSubtitleInline: {
      fontSize: 5.5,
      color: "#000000",
   },
   innerGroupGrid3: {
      flexDirection: "row",
      gap: 3,
   },
   innerGroupGrid2: {
      flexDirection: "row",
      gap: 3,
   },

   // Individual Sig Box
   sigBox: {
      borderWidth: 1,
      borderColor: "#000000",
      padding: 3,
      backgroundColor: "#FFFFFF",
      flexDirection: "column",
      justifyContent: "space-between",
      minHeight: 70,
   },
   sigHeaderRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      borderBottomWidth: 0.5,
      borderBottomColor: "#000000",
      paddingBottom: 2,
      marginBottom: 2,
   },
   stepTag: {
      fontSize: 6,
      fontFamily: "Helvetica-Bold",
      color: "#000000",
      textTransform: "uppercase",
   },
   statusTagSuccess: {
      fontSize: 5.5,
      fontFamily: "Helvetica-Bold",
      color: "#000000",
   },
   statusTagDanger: {
      fontSize: 5.5,
      fontFamily: "Helvetica-Bold",
      color: "#000000",
   },
   statusTagMuted: {
      fontSize: 5.5,
      color: "#000000",
   },
   stepName: {
      fontSize: 6.5,
      fontFamily: "Helvetica-Bold",
      color: "#000000",
   },
   stepRole: {
      fontSize: 5.5,
      color: "#000000",
      marginTop: 0.5,
   },
   sigImageContainer: {
      height: 38,
      width: "100%",
      justifyContent: "center",
      alignItems: "center",
      marginVertical: 1,
      paddingHorizontal: 2,
   },
   sigImage: {
      maxHeight: 36,
      maxWidth: "96%",
      objectFit: "contain",
   },
   sigStatusTextApproved: {
      fontSize: 6,
      fontFamily: "Helvetica-Bold",
      color: "#000000",
      textAlign: "center",
   },
   sigDigitalVerified: {
      fontSize: 4.5,
      color: "#000000",
      textAlign: "center",
      marginTop: 1,
   },
   sigTextPending: {
      fontSize: 5.5,
      fontStyle: "italic",
      color: "#000000",
      textAlign: "center",
   },
   sigFooter: {
      borderTopWidth: 0.5,
      borderTopColor: "#000000",
      paddingTop: 1.5,
      marginTop: 1,
   },
   sigDateText: {
      fontSize: 5.5,
      color: "#000000",
   },
   sigNotesText: {
      fontSize: 5,
      fontStyle: "italic",
      color: "#000000",
      marginTop: 1,
   },

   // Verification Footer Formal
   footer: {
      position: "absolute",
      bottom: 20,
      left: 30,
      right: 30,
      borderTopWidth: 1,
      borderTopColor: "#000000",
      paddingTop: 4,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
   },
   footerLeft: {
      flexDirection: "row",
      alignItems: "center",
   },
   qrCodeImage: {
      width: 38,
      height: 38,
      marginRight: 8,
   },
   qrPlaceholder: {
      width: 38,
      height: 38,
      marginRight: 8,
      justifyContent: "center",
      alignItems: "center",
   },
   qrText: {
      color: "#000000",
      fontSize: 5.5,
      fontFamily: "Helvetica-Bold",
   },
   footerTextTitle: {
      fontSize: 8.5,
      fontFamily: "Helvetica-Bold",
      color: "#000000",
      marginBottom: 1,
   },
   footerTextSub: {
      fontSize: 7.5,
      color: "#000000",
      marginBottom: 1,
   },
   footerRight: {
      alignItems: "flex-end",
   },
   footerLogo: {
      height: 18,
      width: 60,
      objectFit: "contain",
      marginBottom: 2,
   },
   hashText: {
      fontSize: 6,
      fontFamily: "Helvetica-Bold",
      color: "#000000",
   },
   printTimeText: {
      fontSize: 5.5,
      color: "#000000",
      marginTop: 1,
   },
});

const PdfDocumentLetterhead = ({ documentLabel, documentNumber, documentDate, fixed = false }) => (
   <View style={styles.headerContainer} fixed={fixed}>
      <View style={styles.headerLeft}>
         <Image src={plnLogo} style={styles.plnLogo} />
         <View style={styles.headerTitleGroup}>
            <Text style={styles.headerUnitText}>{DOCUMENT_LETTERHEAD.unitName}</Text>
            <Text style={styles.headerSubUnitText}>{DOCUMENT_LETTERHEAD.territoryName}</Text>
         </View>
      </View>
      <View style={styles.headerRight}>
         <Text style={styles.docLabel}>{documentLabel}</Text>
         <Text style={styles.docNo} wrap={false}>No: {documentNumber}</Text>
         <Text style={styles.docDate}>Tgl Pengajuan: {documentDate}</Text>
      </View>
   </View>
);

export const SubmissionPdfDocument = ({
   submission,
   qrCodeDataUrl: propQrCodeDataUrl,
}) => {
   const resolvedStatus = resolveSubmissionStatus(submission);
   const workUnits = resolveSubmissionWorkUnits(submission);
   const finalDocNo = getFormattedDocNo(submission);
   const currentDateStr = new Date().toLocaleDateString("id-ID");
   const qrPayload = `TANGGAL CETAK: ${currentDateStr}\nNO: ${finalDocNo}`;
   const qrCodeDataUrl =
      propQrCodeDataUrl || generateQrCodeDataUrlSync(qrPayload);
   // Lampiran asli ditambahkan sesudah PDF formulir selesai dibuat oleh PdfService.
   const hasAttachment = false;

   const hasVerificationAssigned = DataService.isVerificationAssigned();
   const steps = submission.approvalSteps || [];
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

   const statusLower = resolvedStatus.toLowerCase();
   const currentRoleLower = (
      submission.currentApproverRole || ""
   ).toLowerCase();
   const isApproved = statusLower === "approved";
   const isStageApproval3 =
      statusLower === "pending_approved3" ||
      statusLower === "pending_approver3" ||
      statusLower === "pending_app_3" ||
      currentRoleLower === "approved3" ||
      currentRoleLower === "approver3";

   const currentUser = AuthService.getCurrentUser();
   const userRole = (currentUser?.role || "").toLowerCase();
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

   const sppdExpenses = getStaticSppdExpenses(submission);
   const calculatedTotalSppd =
      submission.totalEstimasiBiaya && Number(submission.totalEstimasiBiaya) > 0
         ? Number(submission.totalEstimasiBiaya)
          : sppdExpenses.reduce(
              (acc, e) => acc + (Number(e.nominal) || 0),
              0,
           );

   const renderPdfSigBox = (titleOrStep, stepParam, isMaker = false) => {
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
      const isApproved = isMaker
         ? true
         : stepStatus === "approved" ||
           stepStatus === "DISETUJUI" ||
           Boolean(step?.signatureUrl) ||
           Boolean(roleSigKey && submission[roleSigKey]);
      const isRejected =
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

      const rawDate = isMaker
         ? submission.tanggalPengajuan
         : step?.actionDate ||
           (roleDateKey ? submission[roleDateKey] : null);
      const dateText = rawDate ? formatDateIndonesian(rawDate) : "-";
      return (
         <View style={styles.sigBox}>
            <View
               style={[
                  styles.sigHeaderRow,
                  !isMaker && { justifyContent: "flex-end" },
               ]}
            >
               {isMaker && <Text style={styles.stepTag}>{title}</Text>}
               {isApproved && (
                  <Text style={styles.statusTagSuccess}>DISETUJUI</Text>
               )}
               {isRejected && (
                  <Text style={styles.statusTagDanger}>DITOLAK</Text>
               )}
               {!isApproved && !isRejected && (
                  <Text style={styles.statusTagMuted}>MENUNGGU</Text>
               )}
            </View>

            <View style={{ marginTop: 1 }}>
               <Text style={styles.stepName}>{name}</Text>
               <Text style={styles.stepRole}>
                  {nip ? `NIP. ${nip}` : roleText}
               </Text>
            </View>

            <View style={styles.sigImageContainer}>
               {sigUrl ? (
                  <Image src={sigUrl} style={styles.sigImage} />
               ) : isApproved ? (
                  <View style={{ alignItems: "center" }}>
                     <Text style={styles.sigStatusTextApproved}>
                        [ TTD VALID ]
                     </Text>
                     <Text style={styles.sigDigitalVerified}>
                        Digital Verified
                     </Text>
                  </View>
               ) : isRejected ? (
                  <Text style={styles.statusTagDanger}>[ DITOLAK ]</Text>
               ) : (
                  <Text style={styles.sigTextPending}>
                     [ Belum Ditandatangani ]
                  </Text>
               )}
            </View>

            <View style={styles.sigFooter}>
               <Text style={styles.sigDateText}>Tgl: {dateText}</Text>
               {!isMaker && isApproved && (
                  <Text style={styles.sigNotesText}>APPROVED</Text>
               )}
            </View>
         </View>
      );
   };

   return (
      <Document
         title={`Dokumen_${finalDocNo}`}
         author="E-Presensi PLN UP2 Jateng DIY"
      >
         <Page size="A4" style={styles.page}>
            {/* 1. KOP SURAT HEADER */}
            <PdfDocumentLetterhead
               fixed
               documentLabel="FORMULIR PERSETUJUAN RESMI"
               documentNumber={finalDocNo}
               documentDate={formatDateIndonesian(submission.tanggalPengajuan)}
            />

            {/* 2. BANNER TITLE & STATUS */}
            <View style={styles.bannerContainer}>
               <View>
                  <Text style={styles.bannerTitle}>
                     PENGAJUAN {submission.type.toUpperCase()} DIGITAL
                  </Text>
                  <Text style={styles.bannerSubtitle}>
                     Dokumentasi Berjenjang Transparan &amp; Akuntabel
                  </Text>
               </View>
               <View style={styles.statusBadge}>
                  <Text style={styles.statusBadgeText}>
                     STATUS: {getStatusLabel(resolvedStatus).toUpperCase()}
                  </Text>
               </View>
            </View>

            {/* Rejection / Cancellation Note Banner */}
            {(submission.status?.toLowerCase() === "dibatalkan" ||
               submission.status?.toLowerCase() === "rejected" ||
               submission.rejectionReason) && (
               <View style={styles.rejectionBanner}>
                  <Text style={styles.rejectionTitle}>
                     {submission.status?.toLowerCase() === "dibatalkan"
                        ? "KETERANGAN TRANSAKSI DIBATALKAN"
                        : "KETERANGAN CATATAN PENOLAKAN"}
                  </Text>
                  <Text style={styles.rejectionText}>
                     {submission.rejectionReason ||
                        (submission.status?.toLowerCase() === "dibatalkan"
                           ? "Transaksi Dibatalkan oleh Pemohon"
                           : "Pengajuan tidak disetujui.")}
                  </Text>
               </View>
            )}

            {/* 3. BIODATA & LOKASI GRID */}
            <View style={styles.gridRow}>
               {/* Left: Biodata Maker */}
               <View style={styles.infoBox}>
                  <Text style={styles.boxTitle}>BIODATA TENAGA KERJA</Text>
                  <View style={styles.kvRow}>
                     <Text style={styles.kvLabel}>Nama Lengkap</Text>
                     <Text style={styles.kvValue}>
                        : {submission.employeeName}
                     </Text>
                  </View>
                  <View style={styles.kvRow}>
                     <Text style={styles.kvLabel}>NIP</Text>
                     <Text style={styles.kvValue}>
                        : {submission.employeeNip}
                     </Text>
                  </View>
                  <View style={styles.kvRow}>
                     <Text style={styles.kvLabel}>Jabatan</Text>
                     <Text style={styles.kvValue}>
                        : {submission.employeeJabatan}
                     </Text>
                  </View>
               </View>

               {/* Right: Lokasi Unit */}
               <View style={styles.infoBox}>
                  <Text style={styles.boxTitle}>LOKASI UNIT KERJA</Text>
                  <View style={styles.kvRow}>
                     <Text style={styles.kvLabel}>Unit UPT</Text>
                     <Text style={styles.kvValue}>: {workUnits.unitUpt}</Text>
                  </View>
                  <View style={styles.kvRow}>
                     <Text style={styles.kvLabel}>Unit ULTG</Text>
                     <Text style={styles.kvValue}>: {workUnits.unitUltg}</Text>
                  </View>
                  <View style={styles.kvRow}>
                     <Text style={styles.kvLabel}>Unit GI</Text>
                     <Text style={styles.kvValue}>
                        : {workUnits.unitGi}
                     </Text>
                  </View>
               </View>
            </View>

            {submission.type === "lembur" && (
               <View style={styles.detailBox}>
                  <Text style={styles.boxTitle}>DASAR LEMBUR</Text>
                  <View style={styles.detailGrid}>
                     <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Nomor SPKL:</Text>
                        <Text style={styles.detailValue}>{submission.nomorSpkl || "-"}</Text>
                     </View>
                     <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Pemberi Perintah (Checker):</Text>
                        <Text style={styles.detailValue}>
                           {submission.pembuatSpklNip ? `${submission.pembuatSpklNip} - ` : ""}
                           {submission.pembuatSpklNama || "-"}
                        </Text>
                     </View>
                  </View>
               </View>
            )}

            {/* 4. DETAIL PENGAJUAN */}
            <View style={styles.detailBox}>
               <Text style={styles.boxTitle}>DETAIL DOKUMEN PENGAJUAN</Text>

               {submission.type === "lembur" && (
                  <View>
                     <View style={styles.detailGrid}>
                        <View style={styles.detailItem}>
                           <Text style={styles.detailLabel}>
                              Tanggal Lembur:
                           </Text>
                           <Text style={styles.detailValue}>
                              {formatDateIndonesian(submission.tanggalLembur)}
                           </Text>
                        </View>
                        <View style={styles.detailItem}>
                           <Text style={styles.detailLabel}>
                              Jam Operasional:
                           </Text>
                           <Text style={styles.detailValue}>
                              {submission.jamMulai} - {submission.jamSelesai} (
                              {submission.durasiJam} Jam)
                           </Text>
                        </View>
                        <View style={styles.detailItem}>
                           <Text style={styles.detailLabel}>
                              Kategori Lembur:
                           </Text>
                           <Text style={styles.detailValue}>
                              {submission.kategoriLembur}
                           </Text>
                        </View>
                        <View style={styles.detailItem}>
                           <Text style={styles.detailLabel}>Area Group:</Text>
                           <Text style={styles.detailValue}>
                              {submission.areaGroup}
                           </Text>
                        </View>
                        {submission.jenisPekerjaan &&
                           submission.jenisPekerjaan !== "-" && (
                              <View style={styles.detailItem}>
                                 <Text style={styles.detailLabel}>
                                    Jenis Pekerjaan:
                                 </Text>
                                 <Text style={styles.detailValue}>
                                    {submission.jenisPekerjaan}
                                 </Text>
                              </View>
                           )}
                        {submission.petugasPendampingNama && (
                           <View style={styles.detailItem}>
                              <Text style={styles.detailLabel}>
                                 Ganti Piket An. :
                              </Text>
                              <Text style={styles.detailValue}>
                                 {submission.petugasPendampingNip} -{" "}
                                 {submission.petugasPendampingNama}
                              </Text>
                           </View>
                        )}
                        {submission.jumlahJamKoreksi !== undefined &&
                           submission.jumlahJamKoreksi !== null &&
                           submission.jumlahJamKoreksi !== "" && (
                              <View style={styles.detailItem}>
                                 <Text style={styles.detailLabel}>
                                    Jumlah Lembur Koreksi:
                                 </Text>
                                 <Text style={styles.detailValue}>
                                    {submission.jumlahJamKoreksi} Jam
                                 </Text>
                              </View>
                           )}
                        {submission.catatanKoreksi && (
                           <View style={styles.detailFull}>
                              <Text style={styles.detailLabel}>
                                 Catatan Koreksi Checker:
                              </Text>
                              <Text style={styles.detailValue}>
                                 {submission.catatanKoreksi}
                              </Text>
                           </View>
                        )}
                        <View style={styles.detailFull}>
                           <Text style={styles.detailLabel}>
                              Uraian Pekerjaan:
                           </Text>
                           <Text style={styles.detailValue}>
                              {submission.kegiatanDetail}
                           </Text>
                        </View>
                     </View>
                  </View>
               )}

               {submission.type === "cuti" && (
                  <View style={styles.detailGrid}>
                     <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Jenis Cuti:</Text>
                        <Text style={styles.detailValue}>
                           {submission.cutiType}
                        </Text>
                     </View>
                     <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Jumlah Durasi:</Text>
                        <Text style={styles.detailValue}>
                           {submission.jumlahHari} Hari Kerja
                        </Text>
                     </View>
                     <View style={styles.detailFull}>
                        <Text style={styles.detailLabel}>Periode Cuti:</Text>
                        <Text style={styles.detailValue}>
                           {formatDateIndonesian(submission.tanggalMulai)} s/d{" "}
                           {formatDateIndonesian(submission.tanggalSelesai)}
                        </Text>
                     </View>
                     <View style={styles.detailFull}>
                        <Text style={styles.detailLabel}>
                           Sisa Cuti Pasca Pengajuan:
                        </Text>
                        <Text style={styles.detailValue}>
                           {submission.sisaCutiSesudahnya ?? "-"} Hari (Sebelumnya:{" "}
                           {submission.sisaCutiSebelumnya ?? "-"} Hari)
                        </Text>
                     </View>
                     <View style={styles.detailFull}>
                        <Text style={styles.detailLabel}>
                           Alamat Selama Cuti &amp; Telepon Darurat:
                        </Text>
                        <Text style={styles.detailValue}>
                           {submission.alamatSelamaCuti} (Telp:{" "}
                           {submission.nomorTeleponDarurat})
                        </Text>
                     </View>
                     {submission.checkerEdited && (
                        <View style={styles.detailFull}>
                           <Text style={styles.detailLabel}>
                              Koreksi Checker:
                           </Text>
                           <Text style={styles.detailValue}>
                              Ya (Dokumen telah dikoreksi &amp; diverifikasi
                              oleh Checker)
                           </Text>
                        </View>
                     )}
                     {submission.catatanKoreksi && (
                        <View style={styles.detailFull}>
                           <Text style={styles.detailLabel}>
                              Catatan Koreksi Checker:
                           </Text>
                           <Text style={styles.detailValue}>
                              {submission.catatanKoreksi}
                           </Text>
                        </View>
                     )}
                  </View>
               )}

               {submission.type === "ijin" && (
                  <View style={styles.detailGrid}>
                     <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>
                           Alasan / Jenis Ijin:
                        </Text>
                        <Text style={styles.detailValue}>
                           {submission.ijinReasonType ||
                              submission.alasanIjin ||
                              "Ijin Resmi"}
                        </Text>
                     </View>
                     <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>
                           Jumlah Hari (Ijin):
                        </Text>
                        <Text style={styles.detailValue}>
                           {submission.jumlahHari} Hari
                        </Text>
                     </View>
                     <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>
                           Jumlah Hari (di Setujui):
                        </Text>
                        <Text style={styles.detailValue}>
                           {submission.jumlahHariDisetujui
                              ? `${submission.jumlahHariDisetujui} Hari`
                              : `${submission.jumlahHari} Hari (Proses)`}
                        </Text>
                     </View>
                     <View style={styles.detailFull}>
                        <Text style={styles.detailLabel}>Periode Ijin:</Text>
                        <Text style={styles.detailValue}>
                           {formatDateIndonesian(submission.tanggalMulai)} s/d{" "}
                           {formatDateIndonesian(submission.tanggalSelesai)}
                        </Text>
                     </View>
                     <View style={styles.detailFull}>
                        <Text style={styles.detailLabel}>
                           Keterangan / Keperluan:
                        </Text>
                        <Text style={styles.detailValue}>
                           {submission.keterangan || "-"}
                        </Text>
                     </View>
                     {submission.checkerEdited && (
                        <View style={styles.detailFull}>
                           <Text style={styles.detailLabel}>
                              Koreksi Checker:
                           </Text>
                           <Text style={styles.detailValue}>
                              Ya (Dokumen telah dikoreksi &amp; diverifikasi
                              oleh Checker)
                           </Text>
                        </View>
                     )}
                     {submission.catatanKoreksi && (
                        <View style={styles.detailFull}>
                           <Text style={styles.detailLabel}>
                              Catatan Koreksi Checker:
                           </Text>
                           <Text style={styles.detailValue}>
                              {submission.catatanKoreksi}
                           </Text>
                        </View>
                     )}
                  </View>
               )}

               {submission.type === "sakit" && (
                  <View>
                     <View style={styles.detailGrid}>
                        <View style={styles.detailItem}>
                           <Text style={styles.detailLabel}>
                              Instansi / Klinik / RS:
                           </Text>
                           <Text style={styles.detailValue}>
                              {submission.instansiKlinik ||
                                 submission.namaDokterFaskes ||
                                 "-"}
                           </Text>
                        </View>
                        <View style={styles.detailItem}>
                           <Text style={styles.detailLabel}>
                              Dokter Penanggung Jawab:
                           </Text>
                           <Text style={styles.detailValue}>
                              {submission.namaDokter || "-"}
                           </Text>
                        </View>
                        <View style={styles.detailItem}>
                           <Text style={styles.detailLabel}>Durasi Sakit:</Text>
                           <Text style={styles.detailValue}>
                              {submission.jumlahHari} Hari Kerja
                           </Text>
                        </View>
                        <View style={styles.detailItem}>
                           <Text style={styles.detailLabel}>
                              Periode Istirahat Sakit:
                           </Text>
                           <Text style={styles.detailValue}>
                              {formatDateIndonesian(submission.tanggalMulai)}{" "}
                              s/d{" "}
                              {formatDateIndonesian(submission.tanggalSelesai)}
                           </Text>
                        </View>
                        <View style={styles.detailFull}>
                           <Text style={styles.detailLabel}>
                              Diagnosa Singkat:
                           </Text>
                           <Text style={styles.detailValue}>
                              {submission.diagnosaSingkat || "-"}
                           </Text>
                        </View>
                        {submission.checkerEdited && (
                           <View style={styles.detailFull}>
                              <Text style={styles.detailLabel}>
                                 Koreksi Checker:
                              </Text>
                              <Text style={styles.detailValue}>
                                 Ya (Dokumen telah dikoreksi &amp; diverifikasi
                                 oleh Checker)
                              </Text>
                           </View>
                        )}
                        {submission.catatanKoreksi && (
                           <View style={styles.detailFull}>
                              <Text style={styles.detailLabel}>
                                 Catatan Koreksi Checker:
                              </Text>
                              <Text style={styles.detailValue}>
                                 {submission.catatanKoreksi}
                              </Text>
                           </View>
                        )}
                     </View>
                  </View>
               )}

               {submission.type === "sppd" && (
                  <View style={{ gap: 3 }}>
                     <View style={styles.detailGrid}>
                        <View style={styles.detailItem}>
                           <Text style={styles.detailLabel}>
                              No. Surat Tugas PLN:
                           </Text>
                           <Text style={styles.detailValue}>
                              {submission.nomorSuratTugas}
                           </Text>
                        </View>
                        <View style={styles.detailItem}>
                           <Text style={styles.detailLabel}>
                              Rute Perjalanan Dinas:
                           </Text>
                           <Text style={styles.detailValue}>
                              {submission.kotaAsal} ke {submission.kotaTujuan} (
                              {submission.durasiHari} Hari)
                           </Text>
                        </View>
                        <View style={styles.detailItem}>
                           <Text style={styles.detailLabel}>
                              Tanggal Berangkat &amp; Kembali:
                           </Text>
                           <Text style={styles.detailValue}>
                              {formatDateIndonesian(
                                 submission.tanggalBerangkat,
                              )}{" "}
                              s/d{" "}
                              {formatDateIndonesian(submission.tanggalKembali)}
                           </Text>
                        </View>
                        <View style={styles.detailFull}>
                           <Text style={styles.detailLabel}>
                              Maksud Perjalanan Dinas:
                           </Text>
                           <Text style={styles.detailValue}>
                              {submission.maksudPerjalanan}
                           </Text>
                        </View>
                        {submission.checkerEdited && (
                           <View style={styles.detailFull}>
                              <Text style={styles.detailLabel}>
                                 Koreksi Checker:
                              </Text>
                              <Text style={styles.detailValue}>
                                 Ya (Dokumen telah dikoreksi &amp; diverifikasi
                                 oleh Checker)
                              </Text>
                           </View>
                        )}
                        {submission.catatanKoreksi && (
                           <View style={styles.detailFull}>
                              <Text style={styles.detailLabel}>
                                 Catatan Koreksi Checker:
                              </Text>
                              <Text style={styles.detailValue}>
                                 {submission.catatanKoreksi}
                              </Text>
                           </View>
                        )}
                     </View>

                     {/* Rincian Expenses Table */}
                     <View style={styles.table}>
                        <View style={styles.tableHeader}>
                           <Text
                              style={[
                                 styles.tableHeaderCell,
                                 styles.tableCellDesc,
                              ]}
                           >
                               Komponen Biaya
                           </Text>
                           <Text
                              style={[
                                 styles.tableHeaderCell,
                                 styles.tableCellNominal,
                              ]}
                           >
                              Nominal (Rp)
                           </Text>
                        </View>

                         {sppdExpenses.map((exp) => (
                           <View key={exp.id} style={styles.tableRow}>
                              <Text style={styles.tableCellDesc}>
                                 {exp.deskripsi}
                              </Text>
                              <Text style={styles.tableCellNominal}>
                                 {showSppdNominal
                                    ? formatRupiah(exp.nominal || 0)
                                    : "-"}
                              </Text>
                           </View>
                        ))}

                        <View style={styles.tableRowTotal}>
                           <Text
                              style={[
                                 styles.tableCellDesc,
                                 { fontFamily: "Helvetica-Bold" },
                              ]}
                           >
                              TOTAL ESTIMASI SPPD:
                           </Text>
                           <Text
                              style={[
                                 styles.tableCellNominal,
                                 { fontSize: 7.5 },
                              ]}
                           >
                              {showSppdNominal
                                 ? formatRupiah(calculatedTotalSppd)
                                 : "-"}
                           </Text>
                        </View>
                     </View>
                  </View>
               )}
            </View>

            {/* 5. MATRIKS TANDATANGAN DIGITAL */}
            <View style={styles.signatureSection} wrap={false}>
               <View style={styles.signatureHeader}>
                  <Text style={styles.signatureSectionTitle}>
                     DOKUMENTASI TANDA TANGAN DIGITAL
                  </Text>
                  <Text style={styles.signatureSubText}>
                     Verifikasi Enkripsi Hash Digital #PLNES-UP2
                  </Text>
               </View>

               {/* Group 1: Top Center - Pemohon */}
               <View style={styles.topGroupContainer}>
                  <View style={styles.topGroupWidth}>
                     <Text style={styles.groupTitleTop}>1. PEMOHON</Text>
                     {renderPdfSigBox("Maker / Pemohon", null, true)}
                  </View>
               </View>

               {/* Group 2 & 3: Middle Row - Left (Pengguna / Unit PLN) & Right (PLN ES UP 2) */}
               <View style={styles.middleGroupRow}>
                  {/* Group 2: Pengguna / Unit PLN */}
                  <View
                     style={[
                        styles.leftGroupContainer,
                        { flex: hasVerificationAssigned ? 3 : 2 },
                     ]}
                  >
                     <View style={styles.groupHeaderRow}>
                        <Text style={styles.groupTitleInline}>
                           2. PENGGUNA / UNIT PLN
                        </Text>
                     </View>
                     <View
                        style={
                           hasVerificationAssigned
                              ? styles.innerGroupGrid3
                              : styles.innerGroupGrid2
                        }
                     >
                        <View style={{ flex: 1 }}>
                           {renderPdfSigBox(checkerStep)}
                        </View>
                        {hasVerificationAssigned && (
                           <View style={{ flex: 1 }}>
                              {renderPdfSigBox(verificationStep)}
                           </View>
                        )}
                        <View style={{ flex: 1 }}>
                           {renderPdfSigBox(approved1Step)}
                        </View>
                     </View>
                  </View>

                  {/* Group 3: PLN ES UP 2 */}
                  <View style={styles.rightGroupContainer}>
                     <View style={styles.groupHeaderRow}>
                        <Text style={styles.groupTitleInline}>
                           3. PLN ES UP 2
                        </Text>
                     </View>
                     <View style={styles.innerGroupGrid2}>
                        <View style={{ flex: 1 }}>
                           {renderPdfSigBox(approved2Step)}
                        </View>
                        <View style={{ flex: 1 }}>
                           {renderPdfSigBox(approved3Step)}
                        </View>
                     </View>
                  </View>
               </View>
            </View>

            {/* 6. VERIFICATION FOOTER */}
            <View style={styles.footer} fixed>
               <View style={styles.footerLeft}>
                  {qrCodeDataUrl ? (
                     <Image src={qrCodeDataUrl} style={styles.qrCodeImage} />
                  ) : (
                     <View style={styles.qrPlaceholder}>
                        <Text style={styles.qrText}>PLN</Text>
                     </View>
                  )}
                  <View>
                     <Text style={styles.footerTextTitle}>
                        DOKUMEN ELEKTRONIK
                     </Text>
                     <Text style={styles.footerTextSub}>
                        Otorisasi SEMAR PLN Electricity Services
                     </Text>
                     <Text style={styles.footerTextSub}>
                        Unit Pelaksana 2 Jawa Tengah &amp; DI Yogyakarta
                     </Text>
                  </View>
               </View>

               <View style={styles.footerRight}>
                  <Image src={semarLogo} style={styles.footerLogo} />
                  <Text style={styles.printTimeText}>
                     Waktu Cetak: {new Date().toLocaleString("id-ID")}
                  </Text>
                  <Text
                     style={styles.printTimeText}
                     render={({ pageNumber, totalPages }) =>
                        `Halaman ${pageNumber} dari ${totalPages}`
                     }
                     fixed
                  />
               </View>
            </View>
         </Page>

         {/* Page 2 (Lampiran) */}
         {hasAttachment && (
            <Page size="A4" style={styles.page}>
               {/* 1. KOP SURAT HEADER */}
               <PdfDocumentLetterhead
                  documentLabel="FORMULIR PERSETUJUAN RESMI"
                  documentNumber={finalDocNo}
                  documentDate={formatDateIndonesian(submission.tanggalPengajuan)}
               />

               {/* 2. BANNER TITLE & STATUS */}
               <View style={styles.bannerContainer}>
                  <View>
                     <Text style={styles.bannerTitle}>
                        LAMPIRAN DOKUMEN PENGAJUAN
                     </Text>
                     <Text style={styles.bannerSubtitle}>
                        Dokumen Pendukung, Foto Kegiatan &amp; Berkas Unggahan
                     </Text>
                  </View>
                  <View style={styles.statusBadge}>
                     <Text style={styles.statusBadgeText}>
                        STATUS:{" "}
                        {getStatusLabel(resolvedStatus).toUpperCase()}
                     </Text>
                  </View>
               </View>

               {/* 3. ATTACHMENT DETAILS */}
               <View style={styles.detailBox}>
                  {submission.type === "lembur" && (
                     <View>
                        <Text style={styles.sectionSubHeader}>
                           Foto Bukti Kegiatan:
                        </Text>
                        <View style={styles.photoGrid}>
                           <View style={styles.photoBox}>
                              <Text style={styles.photoTitle}>
                                 Foto Kegiatan 1:
                              </Text>
                              {submission.fotoDokumentasi1Url ? (
                                 <Image
                                    src={submission.fotoDokumentasi1Url}
                                    style={styles.photoImage}
                                 />
                              ) : (
                                 <View style={styles.emptyAttachmentBox}>
                                    <Text style={styles.emptyAttachmentText}>
                                       [ Belum diupload ]
                                    </Text>
                                 </View>
                              )}
                           </View>

                           <View style={styles.photoBox}>
                              <Text style={styles.photoTitle}>
                                 Foto Kegiatan 2:
                              </Text>
                              {submission.fotoDokumentasi2Url ? (
                                 <Image
                                    src={submission.fotoDokumentasi2Url}
                                    style={styles.photoImage}
                                 />
                              ) : (
                                 <View style={styles.emptyAttachmentBox}>
                                    <Text style={styles.emptyAttachmentText}>
                                       [ Belum diupload ]
                                    </Text>
                                 </View>
                              )}
                           </View>
                        </View>

                        {submission.dasarPerintahLemburUrl && (
                           <View
                              style={[
                                 styles.dasarPerintahFullBox,
                                 { marginTop: 10 },
                              ]}
                           >
                              <View style={styles.dasarPerintahHeader}>
                                 <Text style={styles.dasarPerintahTitle}>
                                    Dasar Perintah Lembur (File Lampiran / Surat
                                    Tugas):
                                 </Text>
                                 {submission.dasarPerintahLemburName && (
                                    <Text style={styles.dasarPerintahFileName}>
                                       {submission.dasarPerintahLemburName}
                                    </Text>
                                 )}
                              </View>

                              {submission.dasarPerintahLemburUrl.startsWith(
                                 "data:image/",
                              ) ||
                              submission.dasarPerintahLemburUrl.match(
                                 /\.(jpeg|jpg|png|gif|webp)$/i,
                              ) ? (
                                 <View style={styles.dasarPerintahContentRow}>
                                    <Image
                                       src={submission.dasarPerintahLemburUrl}
                                       style={[
                                          styles.dasarPerintahImage,
                                          { height: 120 },
                                       ]}
                                    />
                                    <View style={{ marginLeft: 6, flex: 1 }}>
                                       <Text
                                          style={{
                                             fontSize: 7,
                                             fontFamily: "Helvetica-Bold",
                                          }}
                                       >
                                          {submission.dasarPerintahLemburName ||
                                             "Surat_Tugas.png"}
                                       </Text>
                                       <Text
                                          style={{
                                             fontSize: 6,
                                             color: "#000000",
                                             marginTop: 2,
                                          }}
                                       >
                                          Gambar bukti dasar perintah lembur
                                          terlampir &amp; terverifikasi.
                                       </Text>
                                    </View>
                                 </View>
                              ) : (
                                 <View style={{ padding: 4 }}>
                                    <Text
                                       style={{
                                          fontSize: 7,
                                          fontFamily: "Helvetica-Bold",
                                       }}
                                    >
                                       FILE:{" "}
                                       {submission.dasarPerintahLemburName ||
                                          "Dasar_Perintah_Lembur.pdf"}
                                    </Text>
                                    <Text
                                       style={{
                                          fontSize: 6,
                                          color: "#000000",
                                          marginTop: 1,
                                       }}
                                    >
                                       Status: Dokumen digital terlampir pada
                                       sistem.
                                    </Text>
                                 </View>
                              )}
                           </View>
                        )}
                     </View>
                  )}

                  {submission.type === "sakit" && (
                     <View>
                        <Text style={styles.sectionSubHeader}>
                           Surat Keterangan Dokter (SKD):
                        </Text>
                        {submission.suratKeteranganDokterUrl && (
                           <View style={styles.dasarPerintahFullBox}>
                              <View style={styles.dasarPerintahHeader}>
                                 <Text style={styles.dasarPerintahTitle}>
                                    Lampiran Surat Keterangan Dokter (SKD)
                                 </Text>
                                 {submission.suratKeteranganDokterFileName && (
                                    <Text style={styles.dasarPerintahFileName}>
                                       {
                                          submission.suratKeteranganDokterFileName
                                       }
                                    </Text>
                                 )}
                              </View>

                              {submission.suratKeteranganDokterFileType ===
                                 "pdf" ||
                              (submission.suratKeteranganDokterFileName &&
                                 submission.suratKeteranganDokterFileName.endsWith(
                                    ".pdf",
                                 )) ? (
                                 <View style={{ padding: 4 }}>
                                    <Text
                                       style={{
                                          fontSize: 7,
                                          fontFamily: "Helvetica-Bold",
                                       }}
                                    >
                                       FILE PDF:{" "}
                                       {submission.suratKeteranganDokterFileName ||
                                          "Surat_Keterangan_Dokter.pdf"}
                                    </Text>
                                    <Text
                                       style={{
                                          fontSize: 6,
                                          color: "#000000",
                                          marginTop: 1,
                                       }}
                                    >
                                       Dokumen Resmi Surat Keterangan Dokter
                                       (SKD) PDF Terlampir.
                                    </Text>
                                 </View>
                              ) : (
                                 <View style={styles.dasarPerintahContentRow}>
                                    <Image
                                       src={submission.suratKeteranganDokterUrl}
                                       style={{
                                          height: 220,
                                          maxWidth: "100%",
                                          objectFit: "contain",
                                          borderWidth: 1,
                                          borderColor: "#000000",
                                       }}
                                    />
                                    <View style={{ marginLeft: 6, flex: 1 }}>
                                       <Text
                                          style={{
                                             fontSize: 7,
                                             fontFamily: "Helvetica-Bold",
                                          }}
                                       >
                                          {submission.suratKeteranganDokterFileName ||
                                             "Dokumen_SKD.jpg"}
                                       </Text>
                                       <Text
                                          style={{
                                             fontSize: 6,
                                             color: "#000000",
                                             marginTop: 2,
                                          }}
                                       >
                                          Foto Surat Keterangan Dokter
                                          Terlampir.
                                       </Text>
                                    </View>
                                 </View>
                              )}
                           </View>
                        )}
                     </View>
                  )}
               </View>

               {/* 4. VERIFICATION FOOTER */}
               <View style={styles.footer}>
                  <View style={styles.footerLeft}>
                     {qrCodeDataUrl ? (
                        <Image src={qrCodeDataUrl} style={styles.qrCodeImage} />
                     ) : (
                        <View style={styles.qrPlaceholder}>
                           <Text style={styles.qrText}>PLN</Text>
                        </View>
                     )}
                     <View>
                        <Text style={styles.footerTextTitle}>
                           DOKUMEN ELEKTRONIK
                        </Text>
                        <Text style={styles.footerTextSub}>
                           Otorisasi SEMAR PLN Electricity Services
                        </Text>
                        <Text style={styles.footerTextSub}>
                           Unit Pelaksana 2 Jawa Tengah &amp; DI Yogyakarta
                        </Text>
                     </View>
                  </View>

                  <View style={styles.footerRight}>
                     <Image src={semarLogo} style={styles.footerLogo} />
                     <Text style={styles.printTimeText}>
                        Waktu Cetak: {new Date().toLocaleString("id-ID")}
                     </Text>
                     <Text
                        style={styles.printTimeText}
                        render={({ pageNumber, totalPages }) =>
                           `Halaman ${pageNumber} dari ${totalPages}`
                        }
                     />
                  </View>
               </View>
            </Page>
         )}
      </Document>
   );
};
