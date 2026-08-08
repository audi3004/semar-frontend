import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image
} from "@react-pdf/renderer";
import QRCode from "qrcode";
import { formatRupiah, formatDateIndonesian, getStatusLabel, getFormattedDocNo } from "../../utils/formatters";
import { DataService } from "../../services/dataService";
import { PLN_LOGO_PNG_BASE64 } from "../../assets/plnLogoBase64";
import semarLogo from "../../assets/logo_semar_trns.png";

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
        color: { dark: '#000000', light: '#ffffff' },
        errorCorrectionLevel: "M"
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
    color: "#000000"
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
    paddingBottom: 6,
    borderBottomWidth: 1.5,
    borderBottomColor: "#000000"
  },
  headerLeft: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 2,
  },
  plnLogo: {
    height: 20, // 2x lebih kecil
    width: 'auto',
    marginBottom: 1,
  },
  headerUnitText: {
    fontSize: 6,
    fontFamily: 'Helvetica-Bold',
    color: '#000000',
    textTransform: 'uppercase',
  },
  headerSubUnitText: {
    fontSize: 5,
    color: '#000000',
  },
  headerTitleGroup: {
    flexDirection: "column"
  },
  companyName: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#000000",
    letterSpacing: -0.2,
    textTransform: "uppercase"
  },
  subTitle: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: "#000000",
    marginTop: 1,
    textTransform: "uppercase"
  },
  unitTitle: {
    fontSize: 6.5,
    color: "#000000",
    marginTop: 1
  },
  headerRight: {
    flexDirection: "column",
    alignItems: "flex-end"
  },
  docLabel: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: "#000000",
    textTransform: "uppercase"
  },
  docNo: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: "#000000",
    marginTop: 1
  },
  docDate: {
    fontSize: 6.5,
    color: "#000000",
    marginTop: 1
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
    marginBottom: 6
  },
  bannerTitle: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#000000",
    textTransform: "uppercase"
  },
  bannerSubtitle: {
    fontSize: 6.5,
    color: "#000000",
    marginTop: 1
  },
  statusBadge: {
    paddingVertical: 3,
    paddingHorizontal: 7,
    borderWidth: 1,
    borderColor: "#000000",
    backgroundColor: "#FFFFFF"
  },
  statusBadgeText: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: "#000000",
    textTransform: "uppercase"
  },

  // Grid info box (2 columns)
  gridRow: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 6
  },
  infoBox: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    padding: 6,
    borderWidth: 1,
    borderColor: "#000000"
  },
  boxTitle: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: "#000000",
    borderBottomWidth: 1,
    borderBottomColor: "#000000",
    paddingBottom: 2,
    marginBottom: 4,
    textTransform: "uppercase"
  },
  kvRow: {
    flexDirection: "row",
    marginBottom: 2.5
  },
  kvLabel: {
    width: 65,
    fontSize: 6.5,
    color: "#000000"
  },
  kvValue: {
    flex: 1,
    fontSize: 6.5,
    fontFamily: "Helvetica-Bold",
    color: "#000000"
  },

  // Detail section
  detailBox: {
    backgroundColor: "#FFFFFF",
    padding: 6,
    borderWidth: 1,
    borderColor: "#000000",
    marginBottom: 6
  },
  detailGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4
  },
  detailItem: {
    width: "48%",
    marginBottom: 3
  },
  detailFull: {
    width: "100%",
    marginBottom: 3
  },
  detailLabel: {
    fontSize: 6.5,
    color: "#000000"
  },
  detailValue: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: "#000000",
    marginTop: 1
  },

  sectionSubHeader: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: "#000000",
    textTransform: "uppercase",
    marginTop: 4,
    marginBottom: 3
  },

  // Photo Grid for Lembur
  photoGrid: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 6
  },
  photoBox: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#000000",
    padding: 4
  },
  photoTitle: {
    fontSize: 6.5,
    fontFamily: "Helvetica-Bold",
    color: "#000000",
    marginBottom: 3,
    textTransform: "uppercase"
  },
  photoImage: {
    width: "100%",
    height: 65,
    objectFit: "cover",
    borderWidth: 0.5,
    borderColor: "#000000"
  },
  emptyAttachmentBox: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#888888",
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2
  },
  emptyAttachmentText: {
    fontSize: 6.5,
    fontStyle: "italic",
    color: "#666666"
  },

  // Dasar Perintah Lembur Full Box
  dasarPerintahFullBox: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#000000",
    padding: 5
  },
  dasarPerintahHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#000000",
    paddingBottom: 2,
    marginBottom: 4
  },
  dasarPerintahTitle: {
    fontSize: 6.5,
    fontFamily: "Helvetica-Bold",
    color: "#000000",
    textTransform: "uppercase"
  },
  dasarPerintahFileName: {
    fontSize: 6,
    fontFamily: "Helvetica-Bold",
    color: "#000000"
  },
  dasarPerintahContentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  dasarPerintahImage: {
    height: 55,
    maxWidth: 160,
    objectFit: "contain",
    borderWidth: 0.5,
    borderColor: "#000000"
  },

  // Table SPPD Expenses
  table: {
    width: "100%",
    marginTop: 4,
    borderWidth: 1,
    borderColor: "#000000"
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#000000",
    padding: 3
  },
  tableHeaderCell: {
    fontSize: 6.5,
    fontFamily: "Helvetica-Bold",
    color: "#000000",
    textTransform: "uppercase"
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#000000",
    padding: 3
  },
  tableRowTotal: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    padding: 3,
    borderTopWidth: 1,
    borderTopColor: "#000000"
  },
  tableCellDesc: { flex: 2, fontSize: 6.5, color: "#000000" },
  tableCellCat: { flex: 1, fontSize: 6.5, color: "#000000" },
  tableCellNominal: { flex: 1, fontSize: 6.5, fontFamily: "Helvetica-Bold", textAlign: "right", color: "#000000" },

  // Signatures Section
  signatureSection: {
    marginTop: 4,
    marginBottom: 6
  },
  signatureHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1.5,
    borderBottomColor: "#000000",
    paddingBottom: 3,
    marginBottom: 4
  },
  signatureSectionTitle: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: "#000000",
    textTransform: "uppercase"
  },
  signatureSubText: {
    fontSize: 6,
    color: "#000000"
  },

  // Groups Layout
  topGroupContainer: {
    alignItems: "center",
    marginBottom: 6
  },
  topGroupWidth: {
    width: 170
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
    textTransform: "uppercase"
  },
  middleGroupRow: {
    flexDirection: "row",
    gap: 5
  },
  leftGroupContainer: {
    flex: 3,
    backgroundColor: "#FFFFFF",
    padding: 3,
    borderWidth: 1,
    borderColor: "#000000"
  },
  rightGroupContainer: {
    flex: 2,
    backgroundColor: "#FFFFFF",
    padding: 3,
    borderWidth: 1,
    borderColor: "#000000"
  },
  groupHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#000000",
    paddingBottom: 2,
    marginBottom: 3
  },
  groupTitleInline: {
    fontSize: 6.5,
    fontFamily: "Helvetica-Bold",
    color: "#000000",
    textTransform: "uppercase"
  },
  groupSubtitleInline: {
    fontSize: 5.5,
    color: "#000000"
  },
  innerGroupGrid3: {
    flexDirection: "row",
    gap: 3
  },
  innerGroupGrid2: {
    flexDirection: "row",
    gap: 3
  },

  // Individual Sig Box
  sigBox: {
    borderWidth: 1,
    borderColor: "#000000",
    padding: 3,
    backgroundColor: "#FFFFFF",
    flexDirection: "column",
    justifyContent: "space-between",
    minHeight: 70
  },
  sigHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 0.5,
    borderBottomColor: "#000000",
    paddingBottom: 2,
    marginBottom: 2
  },
  stepTag: {
    fontSize: 6,
    fontFamily: "Helvetica-Bold",
    color: "#000000",
    textTransform: "uppercase"
  },
  statusTagSuccess: {
    fontSize: 5.5,
    fontFamily: "Helvetica-Bold",
    color: "#000000"
  },
  statusTagDanger: {
    fontSize: 5.5,
    fontFamily: "Helvetica-Bold",
    color: "#000000"
  },
  statusTagMuted: {
    fontSize: 5.5,
    color: "#000000"
  },
  stepName: {
    fontSize: 6.5,
    fontFamily: "Helvetica-Bold",
    color: "#000000"
  },
  stepRole: {
    fontSize: 5.5,
    color: "#000000",
    marginTop: 0.5
  },
  sigImageContainer: {
    height: 28,
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 1
  },
  sigImage: {
    maxHeight: 26,
    maxWidth: 55,
    objectFit: "contain"
  },
  sigStatusTextApproved: {
    fontSize: 6,
    fontFamily: "Helvetica-Bold",
    color: "#000000",
    textAlign: "center"
  },
  sigDigitalVerified: {
    fontSize: 4.5,
    color: "#000000",
    textAlign: "center",
    marginTop: 1
  },
  sigTextPending: {
    fontSize: 5.5,
    fontStyle: "italic",
    color: "#000000",
    textAlign: "center"
  },
  sigFooter: {
    borderTopWidth: 0.5,
    borderTopColor: "#000000",
    paddingTop: 1.5,
    marginTop: 1
  },
  sigDateText: {
    fontSize: 5.5,
    color: "#000000"
  },
  sigNotesText: {
    fontSize: 5,
    fontStyle: "italic",
    color: "#000000",
    marginTop: 1
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
    alignItems: "center"
  },
  footerLeft: {
    flexDirection: "row",
    alignItems: "center"
  },
  qrCodeImage: {
    width: 38,
    height: 38,
    marginRight: 8
  },
  qrPlaceholder: {
    width: 38,
    height: 38,
    marginRight: 8,
    justifyContent: "center",
    alignItems: "center"
  },
  qrText: {
    color: "#000000",
    fontSize: 5.5,
    fontFamily: "Helvetica-Bold"
  },
  footerTextTitle: {
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    color: "#000000",
    marginBottom: 1
  },
  footerTextSub: {
    fontSize: 7.5,
    color: "#000000",
    marginBottom: 1
  },
  footerRight: {
    alignItems: "flex-end"
  },
  footerLogo: {
    height: 18,
    width: 60,
    objectFit: "contain",
    marginBottom: 2
  },
  hashText: {
    fontSize: 6,
    fontFamily: "Helvetica-Bold",
    color: "#000000"
  },
  printTimeText: {
    fontSize: 5.5,
    color: "#000000",
    marginTop: 1
  }
});

export const SubmissionPdfDocument = ({ submission, qrCodeDataUrl: propQrCodeDataUrl }) => {
  const finalDocNo = getFormattedDocNo(submission);
  const currentDateStr = new Date().toLocaleDateString("id-ID");
  const qrPayload = `TANGGAL CETAK: ${currentDateStr}\nNO: ${finalDocNo}`;
  const qrCodeDataUrl = propQrCodeDataUrl || generateQrCodeDataUrlSync(qrPayload);
  const hasAttachment = (submission.type === "lembur" && !!(submission.fotoDokumentasi1Url || submission.fotoDokumentasi2Url || submission.dasarPerintahLemburUrl)) ||
                        (submission.type === "sakit" && !!submission.suratKeteranganDokterUrl);

  const hasVerificationAssigned = DataService.isVerificationAssigned();
  const steps = submission.approvalSteps || [];
  const checkerStep = steps.find((s) => s.role === "checker") || steps[0] || { role: "checker", roleLabel: "TL PLN (Checker)", status: "pending" };
  const verificationStep = steps.find((s) => s.role === "verification") || steps[1] || { role: "verification", roleLabel: "AMN PLN (Verifikasi)", status: "pending" };
  const approved1Step = steps.find((s) => s.role === "approved1") || steps[2] || { role: "approved1", roleLabel: "MAN PLN (Approved 1)", status: "pending" };
  const approved2Step = steps.find((s) => s.role === "approved2") || steps[3] || { role: "approved2", roleLabel: "TL ES (Approved 2)", status: "pending" };
  const approved3Step = steps.find((s) => s.role === "approved3") || steps[4] || { role: "approved3", roleLabel: "AMN ES (Approved 3)", status: "pending" };

  const renderPdfSigBox = (titleOrStep, stepParam, isMaker = false) => {
    const isFirstParamStep = typeof titleOrStep === "object" && titleOrStep !== null;
    const step = isFirstParamStep ? titleOrStep : stepParam;
    const title = isFirstParamStep ? (step?.roleLabel || "Tanda Tangan") : titleOrStep;
    const role = step?.role || (isMaker ? "maker" : (title?.toLowerCase().includes("checker") ? "checker" : title?.toLowerCase().includes("verif") ? "verification" : title?.toLowerCase().includes("1") ? "approved1" : title?.toLowerCase().includes("2") ? "approved2" : title?.toLowerCase().includes("3") ? "approved3" : ""));

    const roleSigKey = role ? `${role}SignatureUrl` : null;
    const roleNameKey = role ? `${role}Name` : null;
    const roleNipKey = role ? `${role}Nip` : null;
    const roleDateKey = role ? `${role}Date` : null;
    const roleStatusKey = role ? `${role}Status` : null;

    const stepStatus = step?.status || (roleStatusKey ? submission[roleStatusKey] : null) || (role && submission[`${role}SignatureUrl`] ? "approved" : "pending");
    const isSkipped = !isMaker && (stepStatus === "skipped" || stepStatus === "DILEWATI");
    const isApproved = isMaker ? true : (stepStatus === "approved" || stepStatus === "DISETUJUI" || Boolean(step?.signatureUrl) || Boolean(roleSigKey && submission[roleSigKey]));
    const isRejected = !isMaker && (stepStatus === "rejected" || stepStatus === "DITOLAK");

    const name = isMaker 
      ? (submission.employeeName || submission.makerName || "-") 
      : isSkipped 
        ? "(Role Kosong)" 
        : (step?.actionByName || (roleNameKey ? submission[roleNameKey] : null) || step?.name || "-");

    const nip = isMaker 
      ? (submission.employeeNip || submission.makerNip || null) 
      : isSkipped 
        ? null 
        : (step?.actionByNip || (roleNipKey ? submission[roleNipKey] : null) || step?.nip || null);

    const roleText = isMaker 
      ? (submission.employeeJabatan || submission.makerJabatan || "Tenaga Kerja / Pemohon") 
      : isSkipped 
        ? "Dilewati Otomatis" 
        : (step?.roleLabel || step?.name || title);

    const sigUrl = isMaker 
      ? (submission.makerSignatureUrl || submission.signatureUrl || "") 
      : (step?.signatureUrl || (roleSigKey ? submission[roleSigKey] : "") || "");

    const dateText = isMaker
      ? (submission.tanggalPengajuan ? formatDateIndonesian(submission.tanggalPengajuan) : "-")
      : (step?.actionDate || (roleDateKey ? submission[roleDateKey] : null) || "-");
    const notesText = !isMaker && (step?.notes || step?.catatan || (role ? submission[`${role}Notes`] : null)) ? (step?.notes || step?.catatan || submission[`${role}Notes`]) : null;

    return (
      <View style={styles.sigBox}>
        <View style={[styles.sigHeaderRow, !isMaker && { justifyContent: "flex-end" }]}>
          {isMaker && <Text style={styles.stepTag}>{title}</Text>}
          {isApproved && <Text style={styles.statusTagSuccess}>DISETUJUI</Text>}
          {isRejected && <Text style={styles.statusTagDanger}>DITOLAK</Text>}
          {!isApproved && !isRejected && <Text style={styles.statusTagMuted}>MENUNGGU</Text>}
        </View>

        <View style={{ marginTop: 1 }}>
          <Text style={styles.stepName}>{name}</Text>
          <Text style={styles.stepRole}>{nip ? `NIP. ${nip}` : roleText}</Text>
        </View>

        <View style={styles.sigImageContainer}>
          {sigUrl ? (
            <Image src={sigUrl} style={styles.sigImage} />
          ) : isApproved ? (
            <View style={{ alignItems: "center" }}>
              <Text style={styles.sigStatusTextApproved}>[ TTD VALID ]</Text>
              <Text style={styles.sigDigitalVerified}>Digital Verified</Text>
            </View>
          ) : isRejected ? (
            <Text style={styles.statusTagDanger}>[ DITOLAK ]</Text>
          ) : (
            <Text style={styles.sigTextPending}>[ Belum Ditandatangani ]</Text>
          )}
        </View>

        <View style={styles.sigFooter}>
          <Text style={styles.sigDateText}>Tgl: {dateText}</Text>
          {notesText && (
            <Text style={styles.sigNotesText}>"{notesText}"</Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <Document title={`Dokumen_${finalDocNo}`} author="E-Presensi PLN UP2 Jateng DIY">
      <Page size="A4" style={styles.page}>
        {/* 1. KOP SURAT HEADER */}
        <View style={styles.headerContainer} fixed>
          <View style={styles.headerLeft}>
            <Image src={plnLogo} style={styles.plnLogo} />
            <View>
              <Text style={styles.headerUnitText}>
                Unit Pelaksana 2 - Jawa Tengah &amp; DI Yogyakarta
              </Text>
              <Text style={styles.headerSubUnitText}>
                Wilayah Kerja Unit Transmisi Jawa Bagian Tengah
              </Text>
            </View>
          </View>

          <View style={styles.headerRight}>
            <Text style={styles.docLabel}>FORMULIR PERSETUJUAN RESMI</Text>
            <Text style={styles.docNo}>No: {finalDocNo}</Text>
            <Text style={styles.docDate}>
              Tgl Pengajuan: {formatDateIndonesian(submission.tanggalPengajuan)}
            </Text>
          </View>
        </View>

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
              STATUS: {getStatusLabel(submission.status).toUpperCase()}
            </Text>
          </View>
        </View>

        {/* 3. BIODATA & LOKASI GRID */}
        <View style={styles.gridRow}>
          {/* Left: Biodata Maker */}
          <View style={styles.infoBox}>
            <Text style={styles.boxTitle}>BIODATA TENAGA KERJA</Text>
            <View style={styles.kvRow}>
              <Text style={styles.kvLabel}>Nama Lengkap</Text>
              <Text style={styles.kvValue}>: {submission.employeeName}</Text>
            </View>
            <View style={styles.kvRow}>
              <Text style={styles.kvLabel}>NIP</Text>
              <Text style={styles.kvValue}>: {submission.employeeNip}</Text>
            </View>
            <View style={styles.kvRow}>
              <Text style={styles.kvLabel}>Jabatan</Text>
              <Text style={styles.kvValue}>: {submission.employeeJabatan}</Text>
            </View>
          </View>

          {/* Right: Lokasi Unit */}
          <View style={styles.infoBox}>
            <Text style={styles.boxTitle}>LOKASI UNIT KERJA</Text>
            <View style={styles.kvRow}>
              <Text style={styles.kvLabel}>Unit UPT</Text>
              <Text style={styles.kvValue}>: {submission.unitUpt}</Text>
            </View>
            <View style={styles.kvRow}>
              <Text style={styles.kvLabel}>ULTG</Text>
              <Text style={styles.kvValue}>: {submission.unitUltg}</Text>
            </View>
            <View style={styles.kvRow}>
              <Text style={styles.kvLabel}>Gardu Induk</Text>
              <Text style={styles.kvValue}>: {submission.garduInduk}</Text>
            </View>
          </View>
        </View>

        {/* 4. DETAIL PENGAJUAN */}
        <View style={styles.detailBox}>
          <Text style={styles.boxTitle}>DETAIL DOKUMEN PENGAJUAN</Text>

          {submission.type === "lembur" && (
            <View>
              <View style={styles.detailGrid}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Tanggal Lembur:</Text>
                  <Text style={styles.detailValue}>{formatDateIndonesian(submission.tanggalLembur)}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Jam Operasional:</Text>
                  <Text style={styles.detailValue}>
                    {submission.jamMulai} - {submission.jamSelesai} ({submission.durasiJam} Jam)
                  </Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Kategori Lembur:</Text>
                  <Text style={styles.detailValue}>{submission.kategoriLembur}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Area Group:</Text>
                  <Text style={styles.detailValue}>{submission.areaGroup}</Text>
                </View>
                {submission.jenisPekerjaan && submission.jenisPekerjaan !== "-" && (
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Jenis Pekerjaan:</Text>
                    <Text style={styles.detailValue}>{submission.jenisPekerjaan}</Text>
                  </View>
                )}
                {submission.petugasPendampingNama && (
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Ganti Piket An. :</Text>
                    <Text style={styles.detailValue}>
                      {submission.petugasPendampingNip} - {submission.petugasPendampingNama}
                    </Text>
                  </View>
                )}
                {submission.jumlahJamKoreksi !== undefined && submission.jumlahJamKoreksi !== null && submission.jumlahJamKoreksi !== "" && (
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Jumlah Lembur Koreksi:</Text>
                    <Text style={styles.detailValue}>{submission.jumlahJamKoreksi} Jam</Text>
                  </View>
                )}
                {submission.catatanKoreksi && (
                  <View style={styles.detailFull}>
                    <Text style={styles.detailLabel}>Catatan Koreksi Checker:</Text>
                    <Text style={styles.detailValue}>{submission.catatanKoreksi}</Text>
                  </View>
                )}
                <View style={styles.detailFull}>
                  <Text style={styles.detailLabel}>Uraian Pekerjaan:</Text>
                  <Text style={styles.detailValue}>{submission.kegiatanDetail}</Text>
                </View>
              </View>
            </View>
          )}

          {submission.type === "cuti" && (
            <View style={styles.detailGrid}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Jenis Cuti:</Text>
                <Text style={styles.detailValue}>{submission.cutiType}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Jumlah Durasi:</Text>
                <Text style={styles.detailValue}>{submission.jumlahHari} Hari Kerja</Text>
              </View>
              <View style={styles.detailFull}>
                <Text style={styles.detailLabel}>Periode Cuti:</Text>
                <Text style={styles.detailValue}>
                  {formatDateIndonesian(submission.tanggalMulai)} s/d {formatDateIndonesian(submission.tanggalSelesai)}
                </Text>
              </View>
              <View style={styles.detailFull}>
                <Text style={styles.detailLabel}>Sisa Cuti Pasca Pengajuan:</Text>
                <Text style={styles.detailValue}>
                  {submission.sisaCutiSesudahnya} Hari (Sebelumnya: {submission.sisaCutiSebelumnya || "-"} Hari)
                </Text>
              </View>
              <View style={styles.detailFull}>
                <Text style={styles.detailLabel}>Alamat Selama Cuti &amp; Telepon Darurat:</Text>
                <Text style={styles.detailValue}>
                  {submission.alamatSelamaCuti} (Telp: {submission.nomorTeleponDarurat})
                </Text>
              </View>
              {submission.checkerEdited && (
                <View style={styles.detailFull}>
                  <Text style={styles.detailLabel}>Koreksi Checker:</Text>
                  <Text style={styles.detailValue}>Ya (Dokumen telah dikoreksi &amp; diverifikasi oleh Checker)</Text>
                </View>
              )}
              {submission.catatanKoreksi && (
                <View style={styles.detailFull}>
                  <Text style={styles.detailLabel}>Catatan Koreksi Checker:</Text>
                  <Text style={styles.detailValue}>{submission.catatanKoreksi}</Text>
                </View>
              )}
            </View>
          )}

          {submission.type === "ijin" && (
            <View style={styles.detailGrid}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Alasan / Jenis Ijin:</Text>
                <Text style={styles.detailValue}>{submission.ijinReasonType || submission.alasanIjin || "Ijin Resmi"}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Jumlah Hari (Ijin):</Text>
                <Text style={styles.detailValue}>{submission.jumlahHari} Hari</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Jumlah Hari (di Setujui):</Text>
                <Text style={styles.detailValue}>
                  {submission.jumlahHariDisetujui ? `${submission.jumlahHariDisetujui} Hari` : `${submission.jumlahHari} Hari (Proses)`}
                </Text>
              </View>
              <View style={styles.detailFull}>
                <Text style={styles.detailLabel}>Periode Ijin:</Text>
                <Text style={styles.detailValue}>
                  {formatDateIndonesian(submission.tanggalMulai)} s/d {formatDateIndonesian(submission.tanggalSelesai)}
                </Text>
              </View>
              <View style={styles.detailFull}>
                <Text style={styles.detailLabel}>Keterangan / Keperluan:</Text>
                <Text style={styles.detailValue}>{submission.keterangan || "-"}</Text>
              </View>
              {submission.checkerEdited && (
                <View style={styles.detailFull}>
                  <Text style={styles.detailLabel}>Koreksi Checker:</Text>
                  <Text style={styles.detailValue}>Ya (Dokumen telah dikoreksi &amp; diverifikasi oleh Checker)</Text>
                </View>
              )}
              {submission.catatanKoreksi && (
                <View style={styles.detailFull}>
                  <Text style={styles.detailLabel}>Catatan Koreksi Checker:</Text>
                  <Text style={styles.detailValue}>{submission.catatanKoreksi}</Text>
                </View>
              )}
            </View>
          )}

          {submission.type === "sakit" && (
            <View>
              <View style={styles.detailGrid}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Instansi / Klinik / RS:</Text>
                  <Text style={styles.detailValue}>{submission.instansiKlinik || submission.namaDokterFaskes || "-"}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Dokter Penanggung Jawab:</Text>
                  <Text style={styles.detailValue}>{submission.namaDokter || "-"}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Durasi Sakit:</Text>
                  <Text style={styles.detailValue}>{submission.jumlahHari} Hari Kerja</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Periode Istirahat Sakit:</Text>
                  <Text style={styles.detailValue}>
                    {formatDateIndonesian(submission.tanggalMulai)} s/d {formatDateIndonesian(submission.tanggalSelesai)}
                  </Text>
                </View>
                <View style={styles.detailFull}>
                  <Text style={styles.detailLabel}>Diagnosa Singkat:</Text>
                  <Text style={styles.detailValue}>{submission.diagnosaSingkat || "-"}</Text>
                </View>
                {submission.checkerEdited && (
                  <View style={styles.detailFull}>
                    <Text style={styles.detailLabel}>Koreksi Checker:</Text>
                    <Text style={styles.detailValue}>Ya (Dokumen telah dikoreksi &amp; diverifikasi oleh Checker)</Text>
                  </View>
                )}
                {submission.catatanKoreksi && (
                  <View style={styles.detailFull}>
                    <Text style={styles.detailLabel}>Catatan Koreksi Checker:</Text>
                    <Text style={styles.detailValue}>{submission.catatanKoreksi}</Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {submission.type === "sppd" && (
            <View style={{ gap: 3 }}>
              <View style={styles.detailGrid}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>No. Surat Tugas PLN:</Text>
                  <Text style={styles.detailValue}>{submission.nomorSuratTugas}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Rute Perjalanan Dinas:</Text>
                  <Text style={styles.detailValue}>
                    {submission.kotaAsal} ke {submission.kotaTujuan} ({submission.durasiHari} Hari)
                  </Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Tanggal Berangkat &amp; Kembali:</Text>
                  <Text style={styles.detailValue}>
                    {formatDateIndonesian(submission.tanggalBerangkat)} s/d {formatDateIndonesian(submission.tanggalKembali)}
                  </Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Beban Anggaran Unit:</Text>
                  <Text style={styles.detailValue}>{submission.bebanAnggaranUnit || "-"}</Text>
                </View>
                <View style={styles.detailFull}>
                  <Text style={styles.detailLabel}>Maksud Perjalanan Dinas:</Text>
                  <Text style={styles.detailValue}>{submission.maksudPerjalanan}</Text>
                </View>
                {submission.checkerEdited && (
                  <View style={styles.detailFull}>
                    <Text style={styles.detailLabel}>Koreksi Checker:</Text>
                    <Text style={styles.detailValue}>Ya (Dokumen telah dikoreksi &amp; diverifikasi oleh Checker)</Text>
                  </View>
                )}
                {submission.catatanKoreksi && (
                  <View style={styles.detailFull}>
                    <Text style={styles.detailLabel}>Catatan Koreksi Checker:</Text>
                    <Text style={styles.detailValue}>{submission.catatanKoreksi}</Text>
                  </View>
                )}
              </View>

              {/* Rincian Expenses Table */}
              <View style={styles.table}>
                <View style={styles.tableHeader}>
                  <Text style={[styles.tableHeaderCell, styles.tableCellDesc]}>Rincian Komponen Biaya</Text>
                  <Text style={[styles.tableHeaderCell, styles.tableCellCat]}>Kategori</Text>
                  <Text style={[styles.tableHeaderCell, styles.tableCellNominal]}>Nominal (Rp)</Text>
                </View>

                {submission.expenses?.map((exp) => (
                  <View key={exp.id} style={styles.tableRow}>
                    <Text style={styles.tableCellDesc}>{exp.deskripsi}</Text>
                    <Text style={styles.tableCellCat}>{exp.kategori}</Text>
                    <Text style={styles.tableCellNominal}>{formatRupiah(exp.nominal || 0)}</Text>
                  </View>
                ))}

                <View style={styles.tableRowTotal}>
                  <Text style={[styles.tableCellDesc, { fontFamily: "Helvetica-Bold" }]}>TOTAL ESTIMASI SPPD:</Text>
                  <Text style={styles.tableCellCat} />
                  <Text style={[styles.tableCellNominal, { fontSize: 7.5 }]}>
                    {formatRupiah(
                      submission.totalEstimasiBiaya && Number(submission.totalEstimasiBiaya) > 0
                        ? submission.totalEstimasiBiaya
                        : (submission.expenses || []).reduce((acc, e) => acc + (Number(e.nominal) || 0), 0)
                    )}
                  </Text>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* 5. MATRIKS TANDATANGAN DIGITAL */}
        <View style={styles.signatureSection}>
          <View style={styles.signatureHeader}>
            <Text style={styles.signatureSectionTitle}>
              DOKUMENTASI TANDA TANGAN DIGITAL
            </Text>
            <Text style={styles.signatureSubText}>Verifikasi Enkripsi Hash Digital #PLNES-UP2</Text>
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
            <View style={[styles.leftGroupContainer, { flex: hasVerificationAssigned ? 3 : 2 }]}>
              <View style={styles.groupHeaderRow}>
                <Text style={styles.groupTitleInline}>2. PENGGUNA / UNIT PLN</Text>
              </View>
              <View style={hasVerificationAssigned ? styles.innerGroupGrid3 : styles.innerGroupGrid2}>
                <View style={{ flex: 1 }}>{renderPdfSigBox(checkerStep)}</View>
                {hasVerificationAssigned && <View style={{ flex: 1 }}>{renderPdfSigBox(verificationStep)}</View>}
                <View style={{ flex: 1 }}>{renderPdfSigBox(approved1Step)}</View>
              </View>
            </View>

            {/* Group 3: PLN ES UP 2 */}
            <View style={styles.rightGroupContainer}>
              <View style={styles.groupHeaderRow}>
                <Text style={styles.groupTitleInline}>3. PLN ES UP 2</Text>
              </View>
              <View style={styles.innerGroupGrid2}>
                <View style={{ flex: 1 }}>{renderPdfSigBox(approved2Step)}</View>
                <View style={{ flex: 1 }}>{renderPdfSigBox(approved3Step)}</View>
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
              <Text style={styles.footerTextTitle}>DOKUMEN ELEKTRONIK</Text>
              <Text style={styles.footerTextSub}>Otorisasi SEMAR PLN Electricity Services</Text>
              <Text style={styles.footerTextSub}>Unit Pelaksana 2 Jawa Tengah &amp; DI Yogyakarta</Text>
            </View>
          </View>

          <View style={styles.footerRight}>
            <Image src={semarLogo} style={styles.footerLogo} />
            <Text style={styles.printTimeText}>Waktu Cetak: {new Date().toLocaleString("id-ID")}</Text>
            <Text 
              style={styles.printTimeText} 
              render={({ pageNumber, totalPages }) => `Halaman ${pageNumber} dari ${totalPages}`} 
              fixed 
            />
          </View>
        </View>
      </Page>

      {/* Page 2 (Lampiran) */}
      {hasAttachment && (
        <Page size="A4" style={styles.page}>
          {/* 1. KOP SURAT HEADER */}
          <View style={styles.headerContainer}>
            <View style={styles.headerLeft}>
              <Image src={plnLogo} style={styles.plnLogo} />
              <View>
                <Text style={styles.headerUnitText}>
                  Unit Pelaksana 2 - Jawa Tengah &amp; DI Yogyakarta
                </Text>
                <Text style={styles.headerSubUnitText}>
                  Wilayah Kerja Unit Transmisi Jawa Bagian Tengah
                </Text>
              </View>
            </View>

            <View style={styles.headerRight}>
              <Text style={styles.docLabel}>FORMULIR PERSETUJUAN RESMI</Text>
              <Text style={styles.docNo}>No: {finalDocNo}</Text>
              <Text style={styles.docDate}>
                Tgl Pengajuan: {formatDateIndonesian(submission.tanggalPengajuan)}
              </Text>
            </View>
          </View>

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
                STATUS: {getStatusLabel(submission.status).toUpperCase()}
              </Text>
            </View>
          </View>

          {/* 3. ATTACHMENT DETAILS */}
          <View style={styles.detailBox}>
            {submission.type === "lembur" && (
              <View>
                <Text style={styles.sectionSubHeader}>Foto Bukti Kegiatan:</Text>
                <View style={styles.photoGrid}>
                  <View style={styles.photoBox}>
                    <Text style={styles.photoTitle}>Foto Kegiatan 1:</Text>
                    {submission.fotoDokumentasi1Url ? (
                      <Image src={submission.fotoDokumentasi1Url} style={styles.photoImage} />
                    ) : (
                      <View style={styles.emptyAttachmentBox}>
                        <Text style={styles.emptyAttachmentText}>[ Belum diupload ]</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.photoBox}>
                    <Text style={styles.photoTitle}>Foto Kegiatan 2:</Text>
                    {submission.fotoDokumentasi2Url ? (
                      <Image src={submission.fotoDokumentasi2Url} style={styles.photoImage} />
                    ) : (
                      <View style={styles.emptyAttachmentBox}>
                        <Text style={styles.emptyAttachmentText}>[ Belum diupload ]</Text>
                      </View>
                    )}
                  </View>
                </View>

                {submission.dasarPerintahLemburUrl && (
                  <View style={[styles.dasarPerintahFullBox, { marginTop: 10 }]}>
                    <View style={styles.dasarPerintahHeader}>
                      <Text style={styles.dasarPerintahTitle}>Dasar Perintah Lembur (File Lampiran / Surat Tugas):</Text>
                      {submission.dasarPerintahLemburName && (
                        <Text style={styles.dasarPerintahFileName}>{submission.dasarPerintahLemburName}</Text>
                      )}
                    </View>

                    {submission.dasarPerintahLemburUrl.startsWith("data:image/") || submission.dasarPerintahLemburUrl.match(/\.(jpeg|jpg|png|gif|webp)$/i) ? (
                      <View style={styles.dasarPerintahContentRow}>
                        <Image src={submission.dasarPerintahLemburUrl} style={[styles.dasarPerintahImage, { height: 120 }]} />
                        <View style={{ marginLeft: 6, flex: 1 }}>
                          <Text style={{ fontSize: 7, fontFamily: "Helvetica-Bold" }}>
                            {submission.dasarPerintahLemburName || "Surat_Tugas.png"}
                          </Text>
                          <Text style={{ fontSize: 6, color: "#000000", marginTop: 2 }}>
                            Gambar bukti dasar perintah lembur terlampir &amp; terverifikasi.
                          </Text>
                        </View>
                      </View>
                    ) : (
                      <View style={{ padding: 4 }}>
                        <Text style={{ fontSize: 7, fontFamily: "Helvetica-Bold" }}>
                          FILE: {submission.dasarPerintahLemburName || "Dasar_Perintah_Lembur.pdf"}
                        </Text>
                        <Text style={{ fontSize: 6, color: "#000000", marginTop: 1 }}>
                          Status: Dokumen digital terlampir pada sistem.
                        </Text>
                      </View>
                    )}
                  </View>
                )}
              </View>
            )}

            {submission.type === "sakit" && (
              <View>
                <Text style={styles.sectionSubHeader}>Surat Keterangan Dokter (SKD):</Text>
                {submission.suratKeteranganDokterUrl && (
                  <View style={styles.dasarPerintahFullBox}>
                    <View style={styles.dasarPerintahHeader}>
                      <Text style={styles.dasarPerintahTitle}>Lampiran Surat Keterangan Dokter (SKD)</Text>
                      {submission.suratKeteranganDokterFileName && (
                        <Text style={styles.dasarPerintahFileName}>{submission.suratKeteranganDokterFileName}</Text>
                      )}
                    </View>

                    {submission.suratKeteranganDokterFileType === "pdf" || (submission.suratKeteranganDokterFileName && submission.suratKeteranganDokterFileName.endsWith(".pdf")) ? (
                      <View style={{ padding: 4 }}>
                        <Text style={{ fontSize: 7, fontFamily: "Helvetica-Bold" }}>
                          FILE PDF: {submission.suratKeteranganDokterFileName || "Surat_Keterangan_Dokter.pdf"}
                        </Text>
                        <Text style={{ fontSize: 6, color: "#000000", marginTop: 1 }}>
                          Dokumen Resmi Surat Keterangan Dokter (SKD) PDF Terlampir.
                        </Text>
                      </View>
                    ) : (
                      <View style={styles.dasarPerintahContentRow}>
                        <Image src={submission.suratKeteranganDokterUrl} style={{ height: 220, maxWidth: "100%", objectFit: "contain", borderWidth: 1, borderColor: "#000000" }} />
                        <View style={{ marginLeft: 6, flex: 1 }}>
                          <Text style={{ fontSize: 7, fontFamily: "Helvetica-Bold" }}>
                            {submission.suratKeteranganDokterFileName || "Dokumen_SKD.jpg"}
                          </Text>
                          <Text style={{ fontSize: 6, color: "#000000", marginTop: 2 }}>
                            Foto Surat Keterangan Dokter Terlampir.
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
                <Text style={styles.footerTextTitle}>DOKUMEN ELEKTRONIK</Text>
                <Text style={styles.footerTextSub}>Otorisasi SEMAR PLN Electricity Services</Text>
                <Text style={styles.footerTextSub}>Unit Pelaksana 2 Jawa Tengah &amp; DI Yogyakarta</Text>
              </View>
            </View>

            <View style={styles.footerRight}>
              <Image src={semarLogo} style={styles.footerLogo} />
              <Text style={styles.printTimeText}>Waktu Cetak: {new Date().toLocaleString("id-ID")}</Text>
              <Text 
                style={styles.printTimeText} 
                render={({ pageNumber, totalPages }) => `Halaman ${pageNumber} dari ${totalPages}`} 
              />
            </View>
          </View>
        </Page>
      )}
    </Document>
  );
};
