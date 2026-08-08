import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import { formatRupiah, formatDateIndonesian, getStatusLabel, getFormattedDocNo } from "../utils/formatters";
import { PdfService } from "./pdfService";
export class ExportService {
  /**
   * Export Submissions Summary to Excel (.xlsx)
   */
  static exportSubmissionsToExcel(submissions = [], filename = "Laporan_E-Presensi_PLN.xlsx") {
    const formattedData = (submissions || []).map((sub, index) => {
      let nominal = 0;
      if (sub.type === "lembur") nominal = sub.estimasiBiayaRupiah;
      if (sub.type === "sppd") nominal = sub.totalEstimasiBiaya;
      return {
        "No": index + 1,
        "Nomor Dokumen": getFormattedDocNo(sub),
        "Jenis Pengajuan": sub.type.toUpperCase(),
        "NIP": sub.employeeNip,
        "Nama Pegawai": sub.employeeName,
        "Jabatan": sub.employeeJabatan,
        "Unit (UPT)": sub.unitUpt,
        "ULTG": sub.unitUltg,
        "Gardu Induk": sub.garduInduk,
        "Tanggal Pengajuan": formatDateIndonesian(sub.tanggalPengajuan),
        "Keterangan / Deskripsi": sub.keterangan || "-",
        "Nominal / Estimasi Biaya (Rp)": nominal ? formatRupiah(nominal) : "-",
        "Status Akhir": getStatusLabel(sub.status)
      };
    });
    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Rekapitulasi Presensi");
    const cols = Object.keys(formattedData[0] || {}).map(() => ({ wch: 20 }));
    worksheet["!cols"] = cols;
    XLSX.writeFile(workbook, filename);
  }

  /**
   * Export Approved 3 Report Resume to Excel (.xlsx)
   */
  static exportReportToExcel(submissions = [], filterInfo = {}, signatories = [], filename = "Laporan_Resume_Approved3_PLN.xlsx") {
    const formattedData = (submissions || []).map((sub, index) => {
      let nominal = 0;
      if (sub.type === "lembur") nominal = sub.estimasiBiayaRupiah || 0;
      if (sub.type === "sppd") nominal = sub.totalEstimasiBiaya || 0;

      let rincian = sub.keterangan || "-";
      if (sub.type === "lembur") rincian = `${sub.kategoriLembur || ""} - ${sub.jenisPekerjaan || ""} (${sub.durasiJam || 0} Jam)`;
      if (sub.type === "cuti") rincian = `${sub.cutiType || "Cuti"} (${sub.jumlahHari || 0} Hari)`;
      if (sub.type === "sppd") rincian = `${sub.maksudSppd || ""} - Rute: ${sub.kotaTujuan || "-"}`;

      return {
        "No": index + 1,
        "Nomor Dokumen": getFormattedDocNo(sub),
        "Jenis Pengajuan": (sub.type || "").toUpperCase(),
        "NIP Pemohon": sub.employeeNip,
        "Nama Pemohon": sub.employeeName,
        "Jabatan": sub.employeeJabatan,
        "Unit Kerja": sub.unitUpt || "UPT Semarang",
        "ULTG": sub.unitUltg || "-",
        "Tanggal Pengajuan": formatDateIndonesian(sub.tanggalPengajuan),
        "Ringkasan / Detail": rincian,
        "Nominal / Estimasi Biaya (Rp)": nominal ? formatRupiah(nominal) : "-",
        "Status Verifikasi": "APPROVED 3 (SELESAI SEPENUHNYA)"
      };
    });

    if (Array.isArray(signatories) && signatories.length === 3) {
      formattedData.push({});
      formattedData.push({ "No": "--- PEJABAT PENANDATANGAN LAPORAN (KIRI KE KANAN) ---" });
      signatories.forEach((sig, idx) => {
        formattedData.push({
          "No": `[Posisi ${idx + 1}] ${sig.title || "PENANDATANGAN"}`,
          "Nomor Dokumen": sig.role || sig.jabatan || "-",
          "Jenis Pengajuan": sig.name || "-",
          "NIP Pemohon": sig.nip ? `NIP. ${sig.nip}` : "-",
          "Nama Pemohon": sig.jabatan || "-"
        });
      });
    }

    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Resume Approved 3");
    const cols = Object.keys(formattedData[0] || {}).map(() => ({ wch: 25 }));
    worksheet["!cols"] = cols;
    XLSX.writeFile(workbook, filename);
  }
  /**
   * Export Attendance Summary to Excel
   */
  static exportAttendanceToExcel(records = [], filename = "Rekap_Presensi_Harian_PLN.xlsx") {
    const data = (records || []).map((rec, i) => ({
      "No": i + 1,
      "NIP": rec.employeeNip,
      "Nama Pegawai": rec.employeeName,
      "Unit / GI": rec.unit,
      "Tanggal": formatDateIndonesian(rec.tanggal),
      "Jam Masuk": rec.jamMasuk,
      "Jam Keluar": rec.jamKeluar || "-",
      "Status Presensi": rec.status,
      "Lokasi Checkin": rec.lokasiCheckin
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Presensi Harian");
    XLSX.writeFile(workbook, filename);
  }
  /**
   * Export Printable Official PDF Document for a Submission using @react-pdf/renderer (A4 Format)
   */
  static exportSubmissionToPDF(sub) {
    PdfService.downloadPdf(sub);
  }
  /**
   * Export Presentation Summary (PPT Slide Overview Layout)
   */
  static exportSummaryPresentationPPT(submissions, stats, title = "Laporan Performance Bulanan PLN E-PRESENSI") {
    const doc = new jsPDF("landscape");
    doc.setFillColor(0, 163, 224);
    doc.rect(0, 0, 297, 210, "F");
    doc.setFillColor(255, 229, 0);
    doc.rect(0, 195, 297, 15, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(28);
    doc.setFont("helvetica", "bold");
    doc.text("LAPORAN EXECUTIVE PERFORMANCE BULANAN", 20, 80);
    doc.setFontSize(18);
    doc.text("E-PRESENSI & DOKUMENTASI DIGITAL TENAGA KERJA PLN", 20, 95);
    doc.setFontSize(14);
    doc.setFont("helvetica", "normal");
    doc.text("Unit Pelaksana Transmisi (UPT) Semarang - UP2 JATENG DIY", 20, 110);
    doc.text(`Tanggal Cetak: ${(/* @__PURE__ */ new Date()).toLocaleDateString("id-ID")}`, 20, 125);
    doc.addPage("landscape");
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 297, 30, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("RINGKASAN EKSEKUTIF NOMINAL & JUMLAH DOKUMEN", 15, 20);
    doc.setTextColor(15, 23, 42);
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(15, 45, 80, 50, 4, 4, "F");
    doc.text("TOTAL JAM LEMBUR", 20, 60);
    doc.setFontSize(22);
    doc.setTextColor(2, 132, 199);
    doc.text(`${stats.totalHours.toLocaleString("id-ID")} Jam`, 20, 80);
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(105, 45, 80, 50, 4, 4, "F");
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text("ESTIMASI BIAYA LEMBUR", 110, 60);
    doc.setFontSize(18);
    doc.setTextColor(16, 185, 129);
    doc.text(formatRupiah(stats.totalCost), 110, 80);
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(195, 45, 85, 50, 4, 4, "F");
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text("TOTAL DOKUMEN PROSES", 200, 60);
    doc.setFontSize(22);
    doc.setTextColor(217, 119, 6);
    doc.text(`${submissions.length} Pengajuan`, 200, 80);
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text("Ringkasan Alur Persetujuan 6-Tingkat (Maker s/d AMN ES):", 15, 115);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("1. Maker (Tenaga Kerja): Pengajuan formulir digital & TTD canvas", 20, 128);
    doc.text("2. Checker (TL PLN): Pemeriksaan verifikasi administrasi awal", 20, 138);
    doc.text("3. Verifikasi (AMN PLN): Verifikasi anggaran & kesesuaian operasional", 20, 148);
    doc.text("4. Approved 1 (MAN PLN): Persetujuan manajemen tingkat PLN UPT", 20, 158);
    doc.text("5. Approved 2 (TL ES): Persetujuan penyedia Electricity Services", 20, 168);
    doc.text("6. Approved 3 (AMN ES): Otorisasi final penerbitan hak/biaya", 20, 178);
    doc.save("Slide_Presentasi_Laporan_E-Presensi_PLN.pdf");
  }
}
