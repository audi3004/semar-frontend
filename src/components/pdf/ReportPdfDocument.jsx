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
import { formatRupiah, formatDateIndonesian, getFormattedDocNo } from "../../utils/formatters";
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
    paddingTop: 55,
    paddingBottom: 55,
    paddingLeft: 22,
    paddingRight: 22,
    fontFamily: "Helvetica",
    backgroundColor: "#FFFFFF",
    fontSize: 8.5,
    color: "#000000"
  },
  // Header Kop Surat Formal
  headerContainer: {
    position: "absolute",
    top: 15,
    left: 22,
    right: 22,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 6,
    borderBottomWidth: 1.5,
    borderBottomColor: "#000000"
  },
  headerLeft: {
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 2
  },
  plnLogo: {
    height: 20,
    width: "auto",
    marginBottom: 1
  },
  headerUnitText: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#000000",
    textTransform: "uppercase"
  },
  headerSubUnitText: {
    fontSize: 7,
    color: "#000000"
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

  // Document Title Banner
  bannerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 6,
    borderWidth: 1,
    borderColor: "#000000",
    marginBottom: 8
  },
  bannerTitle: {
    fontSize: 9.5,
    fontFamily: "Helvetica-Bold",
    color: "#000000",
    textTransform: "uppercase"
  },
  bannerSubtitle: {
    fontSize: 7,
    color: "#000000",
    marginTop: 2
  },

  // Filter Info Box
  infoGrid: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#000000",
    marginBottom: 8
  },
  infoCol: {
    flex: 1,
    padding: 5,
    borderRightWidth: 1,
    borderRightColor: "#000000"
  },
  infoColLast: {
    flex: 1,
    padding: 5
  },
  infoLabel: {
    fontSize: 6.5,
    fontFamily: "Helvetica-Bold",
    color: "#000000",
    textTransform: "uppercase"
  },
  infoVal: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#000000",
    marginTop: 1
  },

  // Summary Metrics Bar
  metricsContainer: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#000000",
    marginBottom: 10,
    backgroundColor: "#F8FAFC"
  },
  metricBox: {
    flex: 1,
    padding: 5,
    borderRightWidth: 1,
    borderRightColor: "#000000",
    alignItems: "center"
  },
  metricBoxLast: {
    flex: 1,
    padding: 5,
    alignItems: "center"
  },
  metricTitle: {
    fontSize: 6,
    fontFamily: "Helvetica-Bold",
    color: "#000000",
    textTransform: "uppercase"
  },
  metricVal: {
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    color: "#000000",
    marginTop: 2
  },

  // Data Table
  table: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#000000",
    marginBottom: 10
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#E2E8F0",
    borderBottomWidth: 1,
    borderBottomColor: "#000000",
    alignItems: "center",
    minHeight: 18
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#000000",
    alignItems: "center",
    minHeight: 18
  },
  th: {
    fontSize: 6.5,
    fontFamily: "Helvetica-Bold",
    color: "#000000",
    padding: 3,
    borderRightWidth: 0.5,
    borderRightColor: "#000000",
    textAlign: "center"
  },
  td: {
    fontSize: 6.5,
    color: "#000000",
    padding: 3,
    borderRightWidth: 0.5,
    borderRightColor: "#000000"
  },
  tdLast: {
    fontSize: 6.5,
    color: "#000000",
    padding: 3
  },

  // Signatures Section
  sigContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#000000",
    padding: 6
  },
  sigBox: {
    flex: 1,
    alignItems: "center",
    padding: 4
  },
  sigTitle: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: "#000000",
    textTransform: "uppercase"
  },
  sigRole: {
    fontSize: 6.5,
    color: "#000000",
    marginTop: 1
  },
  sigSpace: {
    height: 32,
    justifyContent: "center",
    alignItems: "center"
  },
  sigName: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: "#000000",
    borderTopWidth: 0.5,
    borderTopColor: "#000000",
    paddingTop: 2,
    width: "80%",
    textAlign: "center"
  },
  footer: {
    position: "absolute",
    bottom: 12,
    left: 22,
    right: 22,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 0.5,
    borderTopColor: "#000000",
    paddingTop: 4
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
  textBlock: {
    flexDirection: "column",
    justifyContent: "center"
  },
  titleText: {
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    color: "#000000",
    marginBottom: 1
  },
  subText: {
    fontSize: 7.5,
    color: "#000000",
    marginBottom: 1
  },
  footerRight: {
    flexDirection: "column",
    alignItems: "flex-end"
  },
  logo: {
    height: 22,
    width: "auto",
    marginBottom: 2
  },
  metaText: {
    fontSize: 7.5,
    fontFamily: "Helvetica",
    color: "#000000",
    marginTop: 1
  }
});

const MONTH_NAMES_CAP = [
  "I", "II", "III", "IV", "V", "VI",
  "VII", "VIII", "IX", "X", "XI", "XII"
];

// Helper to extract UPT abbreviation (e.g. UPT Semarang -> UPT-SMG)
const getSingkatanUpt = (unitStr) => {
  if (!unitStr) return "UPT-SMG";
  const u = unitStr.toUpperCase().trim();
  if (u.includes("SEMARANG") || u.includes("SMG")) return "UPT-SMG";
  if (u.includes("PURWOKERTO") || u.includes("PWT")) return "UPT-PWT";
  if (u.includes("SURAKARTA") || u.includes("SOLO") || u.includes("SKT")) return "UPT-SKT";
  if (u.includes("SALATIGA") || u.includes("SLG")) return "UPT-SLG";
  
  const clean = u.replace(/^UPT\s*/i, "").replace(/UNIT|KERJA|SELURUH/g, "").trim();
  const abbr = clean.substring(0, 3) || "SMG";
  return `UPT-${abbr}`;
};

export const ReportPdfDocument = ({ submissions = [], filterInfo = {}, signatories = [] }) => {
  const currentDateStr = new Date().toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });

  // 1. Dynamic Unit and SubTitle for Header Kop Surat
  const unitRaw = filterInfo.unit || filterInfo.unitUpt || "UPT Semarang";
  const unitUptClean = unitRaw.toUpperCase().includes("UPT") ? unitRaw.toUpperCase() : `UPT ${unitRaw.toUpperCase()}`;
  const subTitleText = `PT PLN (PERSERO) UNIT PELAKSANA TRANSMISI (${unitUptClean})`;

  // Auto Increment Document Number Format:
  // 001(auto increment)/REKAP-(singkatan UPT)/PLN-ES/JULI(periode terpilih)/{new Date().getFullYear()}
  const seqNumStr = String(filterInfo.docSeq || 1).padStart(3, "0");
  const singkatanUpt = getSingkatanUpt(unitRaw);

  let bulanKapital = "";
  if (filterInfo.selectedMonth && filterInfo.selectedMonth !== "all") {
    const mIdx = parseInt(filterInfo.selectedMonth, 10) - 1;
    if (mIdx >= 0 && mIdx < 12) {
      bulanKapital = MONTH_NAMES_CAP[mIdx];
    }
  }
  if (!bulanKapital && filterInfo.periode) {
    const pUpper = filterInfo.periode.toUpperCase();
    const foundMonth = MONTH_NAMES_CAP.find((m) => pUpper.includes(m));
    if (foundMonth) bulanKapital = foundMonth;
  }
  if (!bulanKapital) {
    bulanKapital = MONTH_NAMES_CAP[new Date().getMonth()];
  }

  const yearStr = filterInfo.selectedYear && filterInfo.selectedYear !== "all" 
    ? filterInfo.selectedYear 
    : new Date().getFullYear();

  const docNoStr = `${seqNumStr}/REKAP-${singkatanUpt}/PLN-ES/${bulanKapital}/${yearStr}`;

  // 2. Dynamic Title Banner
  let jenisText = "";
  const selectedTypeLower = (filterInfo.type || "all").toLowerCase();

  if (selectedTypeLower !== "all" && selectedTypeLower !== "semua jenis" && selectedTypeLower !== "semua jenis pengajuan") {
    const typeMapSingle = {
      lembur: "LEMBUR",
      cuti: "CUTI",
      ijin: "IJIN",
      sakit: "SAKIT",
      sppd: "SPPD"
    };
    jenisText = typeMapSingle[selectedTypeLower] || selectedTypeLower.toUpperCase();
  } else {
    const typeMapDisplay = {
      lembur: "Lembur",
      cuti: "Cuti",
      ijin: "Ijin",
      sakit: "Sakit",
      sppd: "SPPD"
    };
    const presentTypes = Array.from(
      new Set(submissions.map((s) => (s.type || "").toLowerCase()).filter(Boolean))
    );
    const order = ["lembur", "cuti", "ijin", "sakit", "sppd"];
    const matched = order.filter((t) => presentTypes.includes(t));
    const displayList = matched.map((t) => typeMapDisplay[t] || t.toUpperCase());

    if (displayList.length > 0) {
      jenisText = displayList.join(", ");
    } else {
      jenisText = "Lembur, Cuti, Ijin, Sakit, SPPD";
    }
  }

  const bannerTitleText = `LAPORAN REKAPITULASI PERMOHONAN ${jenisText.toUpperCase()}`;

  const hasVerificationAssigned = DataService.isVerificationAssigned();
  const defaultSignatories = [
    {
      title: "DIVERIFIKASI OLEH",
      role: "AMN PLN (Verifikasi)",
      name: "BAMBANG SUBAGYO",
      nip: "197809122002121001",
      jabatan: `AMN PLN ${unitUptClean}`
    },
    {
      title: "DISETUJUI OLEH",
      role: "TL ES (Approved 2)",
      name: "EKO NUGROHO",
      nip: "198204152006041002",
      jabatan: `TL ES ${unitUptClean}`
    },
    {
      title: "MENGETAHUI / PENGESAHAN",
      role: "AMN ES (Approved 3)",
      name: "AGUS SETIAWAN",
      nip: "198001102005011003",
      jabatan: `AMN ES ${unitUptClean}`
    }
  ];

  let rawSigs = Array.isArray(signatories) && signatories.length > 0 ? signatories : defaultSignatories;
  const hasAnyData = rawSigs.some(s => s.name || s.nip || s.title);
  if (!hasAnyData) {
    rawSigs = defaultSignatories;
  }

  const sigsToRender = rawSigs.filter((sig, idx) => {
    const titleLower = (sig.title || "").toLowerCase();
    const roleLower = (sig.role || "").toLowerCase();
    const posLower = (sig.positionLabel || "").toLowerCase();
    const isVerif = titleLower.includes("verifikas") || roleLower.includes("verifikas") || posLower.includes("verifikas") || (rawSigs.length === 3 && idx === 0);

    if (isVerif) {
      if (!hasVerificationAssigned) return false;
      if (!sig.name && !sig.nip) return false;
    }
    return true;
  });

  // Calculate metrics
  const totalSubmissions = submissions.length;
  let totalLemburHours = 0;
  let totalLemburCost = 0;
  let totalSppdCost = 0;
  let totalCutiDays = 0;
  let totalIjinSakitDays = 0;

  submissions.forEach((s) => {
    if (s.type === "lembur") {
      totalLemburHours += Number(s.durasiJam || 0);
      totalLemburCost += Number(s.estimasiBiayaRupiah || 0);
    } else if (s.type === "sppd") {
      totalSppdCost += Number(s.totalEstimasiBiaya || 0);
    } else if (s.type === "cuti") {
      totalCutiDays += Number(s.jumlahHari || 0);
    } else if (s.type === "ijin" || s.type === "sakit") {
      totalIjinSakitDays += Number(s.jumlahHari || 1);
    }
  });

  const qrPayload = `TANGGAL CETAK: ${currentDateStr}\nNO: ${docNoStr}`;
  const qrCodeDataUrl = generateQrCodeDataUrlSync(qrPayload);

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        {/* Header Kop Surat Formal PLN (fixed = muncul di setiap halaman) */}
        <View style={styles.headerContainer} fixed>
          <View style={styles.headerLeft}>
            <Image src={plnLogo} style={styles.plnLogo} />
            <View>
              <Text style={styles.headerUnitText}>Unit Pelaksana 2 Jawa Tengah dan DI Yogyakarta</Text>
              <Text style={styles.headerSubUnitText}>{subTitleText}</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.docLabel}>DOKUMEN REKAPITULASI</Text>
            <Text style={styles.docNo}>NO: {docNoStr}</Text>
            <Text style={styles.docDate}>TANGGAL CETAK: {currentDateStr}</Text>
          </View>
        </View>

        {/* Title Banner */}
        <View style={styles.bannerContainer}>
          <View>
            <Text style={styles.bannerTitle}>
              {bannerTitleText}
            </Text>
            <Text style={styles.bannerSubtitle}>
              Seluruh Transaksi Pengajuan Tenaga Kerja Yang telah Disetujui Sepenuhnya
            </Text>
          </View>
        </View>

        {/* Filter Information Box */}
        <View style={styles.infoGrid}>
          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>Periode Laporan</Text>
            <Text style={styles.infoVal}>{filterInfo.periode || "Semua Periode"}</Text>
          </View>
          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>Jenis Pengajuan</Text>
            <Text style={styles.infoVal}>{(filterInfo.type || "Semua Jenis Pengajuan").toUpperCase()}</Text>
          </View>
          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>Unit Kerja / UPT</Text>
            <Text style={styles.infoVal}>{unitUptClean}</Text>
          </View>
          <View style={styles.infoColLast}>
            <Text style={styles.infoLabel}>Total Dokumen Approved</Text>
            <Text style={styles.infoVal}>{totalSubmissions} Dokumen Selesai</Text>
          </View>
        </View>

        {/* Summary Metrics Bar */}
        <View style={styles.metricsContainer}>
          <View style={styles.metricBox}>
            <Text style={styles.metricTitle}>TOTAL JAM LEMBUR</Text>
            <Text style={styles.metricVal}>{totalLemburHours} Jam</Text>
          </View>
          <View style={styles.metricBox}>
            <Text style={styles.metricTitle}>ESTIMASI BIAYA LEMBUR</Text>
            <Text style={styles.metricVal}>{formatRupiah(totalLemburCost)}</Text>
          </View>
          <View style={styles.metricBox}>
            <Text style={styles.metricTitle}>ESTIMASI BIAYA SPPD</Text>
            <Text style={styles.metricVal}>{formatRupiah(totalSppdCost)}</Text>
          </View>
          <View style={styles.metricBox}>
            <Text style={styles.metricTitle}>TOTAL HARI CUTI</Text>
            <Text style={styles.metricVal}>{totalCutiDays} Hari</Text>
          </View>
          <View style={styles.metricBoxLast}>
            <Text style={styles.metricTitle}>TOTAL IJIN / SAKIT</Text>
            <Text style={styles.metricVal}>{totalIjinSakitDays} Hari</Text>
          </View>
        </View>

        {/* Data Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.th, { width: "4%" }]}>NO</Text>
            <Text style={[styles.th, { width: "16%" }]}>NO. DOKUMEN</Text>
            <Text style={[styles.th, { width: "8%" }]}>JENIS</Text>
            <Text style={[styles.th, { width: "18%" }]}>NAMA PEMOHON / NIP</Text>
            <Text style={[styles.th, { width: "14%" }]}>UNIT / ULTG</Text>
            <Text style={[styles.th, { width: "11%" }]}>TGL PENGAJUAN</Text>
            <Text style={[styles.th, { width: "17%" }]}>RINGKASAN DETAIL</Text>
            <Text style={[styles.th, { width: "12%", borderRightWidth: 0 }]}>NOMINAL (RP)</Text>
          </View>

          {submissions.length === 0 ? (
            <View style={styles.tableRow}>
              <Text style={[styles.tdLast, { width: "100%", textAlign: "center" }]}>
                Tidak ada data permohonan dengan status Approved pada periode ini.
              </Text>
            </View>
          ) : (
            submissions.slice(0, 25).map((sub, idx) => {
              let nominal = "-";
              if (sub.type === "lembur") nominal = formatRupiah(sub.estimasiBiayaRupiah || 0);
              if (sub.type === "sppd") nominal = formatRupiah(sub.totalEstimasiBiaya || 0);

              return (
                <View key={sub.id || idx} style={styles.tableRow}>
                  <Text style={[styles.td, { width: "4%", textAlign: "center" }]}>{idx + 1}</Text>
                  <Text style={[styles.td, { width: "16%", fontFamily: "Helvetica-Bold" }]}>{getFormattedDocNo(sub)}</Text>
                  <Text style={[styles.td, { width: "8%", textAlign: "center", textTransform: "uppercase" }]}>{sub.type}</Text>
                  <Text style={[styles.td, { width: "18%" }]}>
                    {sub.employeeName} ({sub.employeeNip})
                  </Text>
                  <Text style={[styles.td, { width: "14%" }]}>{sub.unitUltg || sub.unitUpt || unitUptClean}</Text>
                  <Text style={[styles.td, { width: "11%", textAlign: "center" }]}>
                    {formatDateIndonesian(sub.tanggalPengajuan || sub.tanggalLembur || sub.tanggalMulai)}
                  </Text>
                  <Text style={[styles.td, { width: "17%" }]}>
                    {sub.keterangan || sub.maksudSppd || sub.kategoriLembur || "-"}
                  </Text>
                  <Text style={[styles.tdLast, { width: "12%", textAlign: "right", fontFamily: "Helvetica-Bold" }]}>
                    {nominal}
                  </Text>
                </View>
              );
            })
          )}
        </View>

        {/* Signature Block */}
        <View style={styles.sigContainer}>
          {sigsToRender.map((sig, idx) => (
            <View key={idx} style={styles.sigBox}>
              <Text style={styles.sigTitle}>{sig.title || "PENANDATANGAN"}</Text>
              {/*<Text style={styles.sigRole}>{sig.role || sig.jabatan || "-"}</Text>*/}
              
              {/* Area kosong untuk tanda tangan manual (setara 7-8 enter) */}
              <View style={{ height: 65 }} />

              <Text style={styles.sigName}>{sig.name || "-"}</Text>
              {sig.nip && <Text style={{ fontSize: 5.5, color: "#000000", marginTop: 1 }}>NIP. {sig.nip}</Text>}
              {sig.jabatan && <Text style={{ fontSize: 5.5, color: "#334155", marginTop: 1 }}>{sig.jabatan}</Text>}
            </View>
          ))}
        </View>

        {/* FOOTER STATIS - CLEAN STYLE (fixed = muncul di setiap halaman) */}
        <View style={styles.footer} fixed>
          <View style={styles.footerLeft}>
            {qrCodeDataUrl ? (
              <Image src={qrCodeDataUrl} style={styles.qrCodeImage} />
            ) : null}
            <View style={styles.textBlock}>
              <Text style={styles.titleText}>DOKUMEN ELEKTRONIK</Text>
              <Text style={styles.subText}>Otorisasi SEMAR PLN Electricity Services</Text>
              <Text style={styles.subText}>Unit Pelaksana 2 Jawa Tengah &amp; DI Yogyakarta</Text>
            </View>
          </View>

          <View style={styles.footerRight}>
            {semarLogo && <Image src={semarLogo} style={styles.logo} />}
            <Text style={styles.metaText}>Waktu Cetak: {new Date().toLocaleString("id-ID")}</Text>
            <Text 
              style={styles.metaText} 
              render={({ pageNumber, totalPages }) => `Hal ${pageNumber} - ${totalPages}`} 
              fixed 
            />
          </View>
        </View>
      </Page>
    </Document>
  );
};
