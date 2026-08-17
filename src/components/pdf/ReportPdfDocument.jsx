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
   formatDateIndonesianLong,
   getFormattedDocNo,
} from "../../utils/formatters";
import { DataService } from "../../services/dataService";
import { PLN_LOGO_PNG_BASE64 } from "../../assets/plnLogoBase64";
import semarLogoDefault from "../../assets/logo_semar_trns.png";
import { DOCUMENT_LETTERHEAD } from "./documentLetterhead";

const plnLogo = PLN_LOGO_PNG_BASE64;
const pdfSafeText = (value) => String(value ?? "-").replace(/([\/-])/g, "$1\u200B");

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

const MONTH_NAMES_CAP = [
   "I",
   "II",
   "III",
   "IV",
   "V",
   "VI",
   "VII",
   "VIII",
   "IX",
   "X",
   "XI",
   "XII",
];

const getSingkatanUpt = (unitStr) => {
   if (!unitStr) return "UPT-SMG";
   const u = unitStr.toUpperCase().trim();
   if (u.includes("SEMARANG") || u.includes("SMG")) return "UPT-SMG";
   if (u.includes("PURWOKERTO") || u.includes("PWT")) return "UPT-PWT";
   if (u.includes("SURAKARTA") || u.includes("SOLO") || u.includes("SKT"))
      return "UPT-SKT";
   if (u.includes("SALATIGA") || u.includes("SLG")) return "UPT-SLG";

   const clean = u
      .replace(/^UPT\s*/i, "")
      .replace(/UNIT|KERJA|SELURUH/g, "")
      .trim();
   const abbr = clean.substring(0, 3) || "SMG";
   return `UPT-${abbr}`;
};

const styles = StyleSheet.create({
   page: {
      paddingTop: 82,
      paddingBottom: 62,
      paddingLeft: 30,
      paddingRight: 30,
      fontFamily: "Helvetica",
      backgroundColor: "#FFFFFF",
      fontSize: 8,
      color: "#000000",
   },

   // Header Kop Surat Formal
   headerContainer: {
      position: "absolute",
      top: 18,
      left: 30,
      right: 30,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingBottom: 9,
      borderBottomWidth: 2,
      borderBottomColor: DOCUMENT_LETTERHEAD.colors.primary,
   },
   headerLeft: {
      flexDirection: "row",
      alignItems: "center",
      width: "58%",
   },
   plnLogo: {
      width: 142,
      height: 31,
      objectFit: "contain",
      marginRight: 10,
   },
   headerIdentity: {
      borderLeftWidth: 1,
      borderLeftColor: "#CBD5E1",
      paddingLeft: 10,
      flexShrink: 1,
   },
   headerUnitText: {
      fontSize: 7.5,
      fontFamily: "Helvetica-Bold",
      color: DOCUMENT_LETTERHEAD.colors.primary,
      textTransform: "uppercase",
   },
   headerSubUnitText: {
      fontSize: 7,
      fontFamily: "Helvetica",
      color: DOCUMENT_LETTERHEAD.colors.muted,
      marginTop: 2,
   },
   headerRight: {
      flexDirection: "column",
      alignItems: "flex-end",
      width: "40%",
   },
   headerTitle: {
      fontSize: 11,
      fontFamily: "Helvetica-Bold",
      color: DOCUMENT_LETTERHEAD.colors.primary,
      textTransform: "uppercase",
      letterSpacing: -0.2,
   },
   headerDocNo: {
      fontSize: 8.5,
      fontFamily: "Helvetica-Bold",
      color: "#000000",
      marginTop: 2,
   },

   // Filter Info Bar
   filterContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 12,
      marginBottom: 8,
      paddingBottom: 4,
      borderBottomWidth: 1,
      borderBottomColor: DOCUMENT_LETTERHEAD.colors.primary,
   },
   filterText: {
      fontSize: 7.5,
      fontFamily: "Helvetica",
      color: "#000000",
   },

   // Data Table
   table: {
      width: "100%",
      borderWidth: 1,
      borderColor: "#000000",
      marginBottom: 12,
   },
   tableHeader: {
      flexDirection: "row",
      backgroundColor: DOCUMENT_LETTERHEAD.colors.soft,
      borderBottomWidth: 1,
      borderBottomColor: "#000000",
      alignItems: "stretch",
      minHeight: 24,
   },
   tableRow: {
      flexDirection: "row",
      borderBottomWidth: 0.5,
      borderBottomColor: "#000000",
      alignItems: "stretch",
      minHeight: 24,
   },
   th: {
      fontSize: 6.6,
      fontFamily: "Helvetica-Bold",
      color: "#000000",
      paddingVertical: 5,
      paddingHorizontal: 3,
      lineHeight: 1.2,
      borderRightWidth: 0.5,
      borderRightColor: "#000000",
   },
   td: {
      fontSize: 6.5,
      fontFamily: "Helvetica",
      color: "#000000",
      paddingVertical: 4,
      paddingHorizontal: 3,
      lineHeight: 1.28,
      borderRightWidth: 0.5,
      borderRightColor: "#000000",
   },
   tdLast: {
      fontSize: 6.5,
      fontFamily: "Helvetica",
      color: "#000000",
      paddingVertical: 4,
      paddingHorizontal: 3,
      lineHeight: 1.28,
   },

   // Signatures Section
   sigContainer: {
      flexDirection: "row",
      marginTop: 15,
      marginBottom: 10,
      width: "100%",
   },
   sigBox2Col: {
      width: "44%",
      borderWidth: 1,
      borderColor: "#000000",
      padding: 6,
      minHeight: 80,
      alignItems: "center",
      justifyContent: "space-between",
   },
   sigBox3Col: {
      width: "31%",
      borderWidth: 1,
      borderColor: "#000000",
      padding: 6,
      minHeight: 80,
      alignItems: "center",
      justifyContent: "space-between",
   },
   sigTitle: {
      fontSize: 7.5,
      fontFamily: "Helvetica-Bold",
      color: "#000000",
      textTransform: "uppercase",
      textAlign: "center",
   },
   sigDivider: {
      borderBottomWidth: 0.5,
      borderBottomColor: "#000000",
      width: 80,
      marginVertical: 3,
   },
   sigSpace: {
      height: 36,
      width: "100%",
      justifyContent: "center",
      alignItems: "center",
   },
   sigImage: {
      maxHeight: 34,
      maxWidth: "85%",
      objectFit: "contain",
   },
   sigName: {
      fontSize: 8,
      fontFamily: "Helvetica-Bold",
      color: "#000000",
      textDecoration: "underline",
      textAlign: "center",
   },
   sigNip: {
      fontSize: 6.5,
      fontFamily: "Helvetica",
      color: "#000000",
      textAlign: "center",
      marginTop: 1,
   },

   // Footer Statis
   footer: {
      position: "absolute",
      bottom: 12,
      left: 30,
      right: 30,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      borderTopWidth: 0.5,
      borderTopColor: "#000000",
      paddingTop: 4,
   },
   footerLeft: {
      flexDirection: "row",
      alignItems: "center",
   },
   qrCodeImage: {
      width: 36,
      height: 36,
      marginRight: 8,
   },
   textBlock: {
      flexDirection: "column",
      justifyContent: "center",
   },
   footerTitle: {
      fontSize: 8,
      fontFamily: "Helvetica-Bold",
      color: "#000000",
      marginBottom: 1,
   },
   footerSubText: {
      fontSize: 7,
      fontFamily: "Helvetica",
      color: "#000000",
   },
   footerRight: {
      flexDirection: "column",
      alignItems: "flex-end",
   },
   logo: {
      height: 20,
      width: "auto",
      marginBottom: 2,
   },
   metaText: {
      fontSize: 7,
      fontFamily: "Helvetica",
      color: "#000000",
      marginTop: 1,
   },
});

export const ReportPdfDocument = ({
   submissions = [],
   data = [],
   filterInfo = {},
   signatories = [],
   currentDateStr: currentDateStrProp,
   docNoStr: docNoStrProp,
   title: titleProp,
   semarLogo: semarLogoProp,
   qrCodeDataUrl: qrCodeDataUrlProp,
}) => {
   const currentDateStr =
      currentDateStrProp || new Date().toLocaleDateString("id-ID");

   const unitRaw = filterInfo.unit || filterInfo.unitUpt || "UPT Semarang";
   const unitUptClean = unitRaw.toUpperCase().includes("UPT")
      ? unitRaw.toUpperCase()
      : `UPT ${unitRaw.toUpperCase()}`;

   const seqNumStr = String(filterInfo.docSeq || filterInfo.seq || 1).padStart(
      3,
      "0",
   );
   const singkatanUpt = getSingkatanUpt(unitRaw);

   let bulanKapital = "";
   if (filterInfo.selectedMonth && filterInfo.selectedMonth !== "all") {
      const mIdx = parseInt(filterInfo.selectedMonth, 10) - 1;
      if (mIdx >= 0 && mIdx < 12) {
         bulanKapital = MONTH_NAMES_CAP[mIdx];
      }
   }
   if (!bulanKapital && filterInfo.month) {
      const mUpper = filterInfo.month.toUpperCase();
      const foundMonth = MONTH_NAMES_CAP.find((m) => mUpper.includes(m));
      if (foundMonth) bulanKapital = foundMonth;
   }
   if (!bulanKapital && filterInfo.periode) {
      const pUpper = filterInfo.periode.toUpperCase();
      const foundMonth = MONTH_NAMES_CAP.find((m) => pUpper.includes(m));
      if (foundMonth) bulanKapital = foundMonth;
   }
   if (!bulanKapital) {
      bulanKapital = MONTH_NAMES_CAP[new Date().getMonth()];
   }

   const yearStr =
      filterInfo.selectedYear && filterInfo.selectedYear !== "all"
         ? filterInfo.selectedYear
         : filterInfo.year || new Date().getFullYear();

   const defaultDocNoStr = filterInfo.nomorDokumen || `${seqNumStr}/REKAP-${singkatanUpt}/PLN-ES/${bulanKapital}/${yearStr}`;
   const docNoStr = docNoStrProp || defaultDocNoStr;

   const title = titleProp || "LAPORAN DOKUMEN ELEKTRONIK";

   const reportItems =
      submissions && submissions.length > 0 ? submissions : data;

   const hasVerificationAssigned = DataService.isVerificationAssigned();
   const defaultSignatories = DataService.getDefaultReportSignatories(
      unitUptClean || filterInfo.unit || filterInfo.unitUpt,
   );

   let rawSigs = filterInfo.hideSignatories
      ? []
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
         { ...rawSigs[1], title: "DIVERIFIKASI OLEH", role: "Checker" },
         rawSigs[2],
      ];
   }

   const hasAnyData = rawSigs.some(
      (s) => s && (s.name || s.nip || s.title || s.role),
   );
   if (!hasAnyData && !filterInfo.hideSignatories) {
      rawSigs = defaultSignatories;
   }

   const validSignatories = rawSigs.filter((sig) => {
      if (!sig) return false;
      return Boolean(sig.name || sig.nip || sig.title || sig.role);
   });

   const qrPayload = `TANGGAL CETAK: ${currentDateStr}\nNO: ${docNoStr}`;
   const computedQrUrl = generateQrCodeDataUrlSync(qrPayload);
   const finalQrUrl = qrCodeDataUrlProp || computedQrUrl;
   const finalSemarLogo = semarLogoProp || semarLogoDefault;
   const printDateTimeStr = new Date().toLocaleString("id-ID");

   return (
      <Document>
         <Page size="A4" orientation="landscape" style={styles.page}>
            {/* HEADER DOKUMEN (Fixed) */}
            <View style={styles.headerContainer} fixed>
               <View style={styles.headerLeft}>
                  <Image src={plnLogo} style={styles.plnLogo} />
                  <View style={styles.headerIdentity}>
                     <Text style={styles.headerUnitText}>
                        {DOCUMENT_LETTERHEAD.unitName}
                     </Text>
                     <Text style={styles.headerSubUnitText}>
                        {DOCUMENT_LETTERHEAD.territoryName}
                     </Text>
                  </View>
               </View>
               <View style={styles.headerRight}>
                  <Text style={styles.headerTitle}>{title}</Text>
                  <Text style={styles.headerDocNo}>{docNoStr}</Text>
               </View>
            </View>

            {/* FILTER INFO BAR */}
            {filterInfo &&
            (filterInfo.month ||
               filterInfo.periode ||
               filterInfo.type ||
               filterInfo.unit) ? (
               <View style={styles.filterContainer}>
                  {filterInfo.month || filterInfo.periode ? (
                     <Text style={styles.filterText}>
                        <Text style={{ fontFamily: "Helvetica-Bold" }}>
                           Periode:{" "}
                        </Text>
                        {filterInfo.periode ||
                           `${filterInfo.month} ${filterInfo.year || ""}`}
                     </Text>
                  ) : null}
                  {filterInfo.type ? (
                     <Text style={styles.filterText}>
                        <Text style={{ fontFamily: "Helvetica-Bold" }}>
                           Jenis:{" "}
                        </Text>
                        {filterInfo.type.toUpperCase()}
                     </Text>
                  ) : null}
                  {filterInfo.unit ? (
                     <Text style={styles.filterText}>
                        <Text style={{ fontFamily: "Helvetica-Bold" }}>
                           Unit:{" "}
                        </Text>
                        {filterInfo.unit}
                     </Text>
                  ) : null}
               </View>
            ) : null}

            {/* DATA TABLE */}
            <View style={styles.table}>
               <View style={styles.tableHeader} fixed>
                  <Text
                     style={[styles.th, { width: "4%", textAlign: "center" }]}
                  >
                     No
                  </Text>
                  <Text style={[styles.th, { width: "16%" }]}>No. Dokumen</Text>
                  <Text style={[styles.th, { width: "11%" }]}>
                     Tgl Pengajuan
                  </Text>
                  <Text style={[styles.th, { width: "18%" }]}>Pegawai</Text>
                  <Text style={[styles.th, { width: "8%" }]}>Jenis</Text>
                  <Text style={[styles.th, { width: "14%" }]}>Unit/Lokasi</Text>
                  <Text style={[styles.th, { width: "17%" }]}>Keterangan</Text>
                  <Text
                     style={[
                        styles.th,
                        {
                           width: "12%",
                           textAlign: "right",
                           borderRightWidth: 0,
                        },
                     ]}
                  >
                     Estimasi Biaya
                  </Text>
               </View>

               {reportItems && reportItems.length > 0 ? (
                  reportItems.map((item, idx) => {
                     let nominal = "-";
                     if (item.type === "lembur")
                        nominal = formatRupiah(item.estimasiBiayaRupiah || 0);
                     if (item.type === "sppd")
                        nominal = formatRupiah(item.totalEstimasiBiaya || 0);

                     return (
                        <View key={item.id || idx} style={styles.tableRow} wrap={false}>
                           <Text
                              style={[
                                 styles.td,
                                 { width: "4%", textAlign: "center" },
                              ]}
                           >
                              {idx + 1}
                           </Text>
                           <Text
                              style={[
                                 styles.td,
                                 { width: "16%", fontFamily: "Helvetica-Bold" },
                              ]}
                           >
                              {pdfSafeText(getFormattedDocNo(item))}
                           </Text>
                           <Text style={[styles.td, { width: "11%" }]}>
                              {item.tanggalPengajuan
                                 ? formatDateIndonesianLong(item.tanggalPengajuan)
                                 : "-"}
                           </Text>
                           <View style={[styles.td, { width: "18%" }]}>
                              <Text
                                 style={{
                                    fontFamily: "Helvetica-Bold",
                                    fontSize: 7,
                                 }}
                              >
                                 {pdfSafeText(item.employeeName || item.namaPegawai || "-")}
                              </Text>
                              {item.employeeNip || item.nip ? (
                                 <Text
                                    style={{
                                       fontSize: 6,
                                       color: "#475569",
                                       marginTop: 1,
                                    }}
                                 >
                                    {pdfSafeText(item.employeeNip || item.nip)}
                                 </Text>
                              ) : null}
                           </View>
                           <Text
                              style={[
                                 styles.td,
                                 {
                                    width: "8%",
                                    fontFamily: "Helvetica-Bold",
                                    textTransform: "uppercase",
                                 },
                              ]}
                           >
                              {item.type || item.jenisPermohonan || "-"}
                           </Text>
                           <Text style={[styles.td, { width: "14%" }]}>
                              {pdfSafeText(item.unitKerja ||
                                 item.unitUltg ||
                                 item.unitUpt ||
                                 item.unit ||
                                 "-")}
                           </Text>
                           <Text style={[styles.td, { width: "17%" }]}>
                              {pdfSafeText(item.keterangan || item.kegiatanDetail ||
                                 item.maksudPerjalanan || item.maksudSppd ||
                                 item.diagnosaSingkat || item.ijinReasonType || item.cutiType || item.alasan ||
                                 "-")}
                           </Text>
                           <Text
                              style={[
                                 styles.tdLast,
                                 {
                                    width: "12%",
                                    textAlign: "right",
                                    fontFamily: "Helvetica-Bold",
                                 },
                              ]}
                           >
                              {nominal}
                           </Text>
                        </View>
                     );
                  })
               ) : (
                  <View style={styles.tableRow}>
                     <Text
                        style={[
                           styles.tdLast,
                           {
                              width: "100%",
                              textAlign: "center",
                              fontStyle: "italic",
                              color: "#64748B",
                              padding: 8,
                           },
                        ]}
                     >
                        Tidak ada data transaksi.
                     </Text>
                  </View>
               )}
            </View>

            {/* SIGNATURE BLOCK */}
            {validSignatories && validSignatories.length > 0 ? (
               <View
                  style={[
                     styles.sigContainer,
                     validSignatories.length === 2
                        ? { justifyContent: "space-around" }
                        : { justifyContent: "space-between" },
                  ]}
                  wrap={false}
               >
                  {validSignatories.map((sig, idx) => {
                     const boxStyle =
                        validSignatories.length === 2
                           ? styles.sigBox2Col
                           : styles.sigBox3Col;
                     const titleText =
                        sig.title ||
                        sig.positionLabel ||
                        `Penandatangan ${idx + 1}`;
                     return (
                        <View key={idx} style={boxStyle}>
                           <Text style={styles.sigTitle}>{titleText}</Text>
                           <View style={styles.sigDivider} />

                           <View style={styles.sigSpace}>
                              {sig.signatureUrl ? (
                                 <Image
                                    src={sig.signatureUrl}
                                    style={styles.sigImage}
                                 />
                              ) : null}
                           </View>

                           <Text style={styles.sigName}>
                              {sig.name || "(.........................)"}
                           </Text>
                           <Text style={styles.sigNip}>
                              {sig.nip ? `NIP. ${sig.nip}` : "NIP. -"}
                           </Text>
                           {sig.jabatan ? <Text style={styles.sigNip}>{sig.jabatan}</Text> : null}
                        </View>
                     );
                  })}
               </View>
            ) : null}

            {/* FOOTER DOKUMEN (Fixed) */}
            <View style={styles.footer} fixed>
               <View style={styles.footerLeft}>
                  {finalQrUrl ? (
                     <Image src={finalQrUrl} style={styles.qrCodeImage} />
                  ) : null}
                  <View style={styles.textBlock}>
                     <Text style={styles.footerTitle}>DOKUMEN ELEKTRONIK</Text>
                     <Text style={styles.footerSubText}>
                        Otorisasi SEMAR PLN Electricity Services
                     </Text>
                     <Text style={styles.footerSubText}>
                        Unit Pelaksana 2 Jawa Tengah &amp; DI Yogyakarta
                     </Text>
                  </View>
               </View>

               <View style={styles.footerRight}>
                  {finalSemarLogo ? (
                     <Image src={finalSemarLogo} style={styles.logo} />
                  ) : null}
                  <Text style={styles.metaText}>
                     Waktu Cetak: {printDateTimeStr}
                  </Text>
                  <Text
                     style={styles.metaText}
                     render={({ pageNumber, totalPages }) =>
                        `Hal ${pageNumber} - ${totalPages}`
                     }
                     fixed
                  />
               </View>
            </View>
         </Page>
      </Document>
   );
};
