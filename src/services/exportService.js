import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import { formatRupiah, formatDateIndonesian, getStatusLabel, getFormattedDocNo } from "../utils/formatters";
import { PdfService } from "./pdfService";
export class ExportService {
  /**
   * Export Submissions Summary to Excel (.xlsx)
   */
  static exportSubmissionsToExcel(submissions = [], filename = "Laporan_SemarPLNES.xlsx") {
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
   * Export Approved 3 Report Resume to Excel (.xlsx) matching ReportPdfDocument.jsx columns
   */
  static exportReportToExcel(submissions = [], filterInfo = {}, signatories = [], filename = null) {
    const defaultFilename = filterInfo.type
      ? `Laporan_Resume_${filterInfo.type.replace(/[\s/]+/g, "_")}_PLN.xlsx`
      : "Laporan_Resume_Semar.xlsx";
    const targetFilename = filename || defaultFilename;

    const exportDateTimeStr = new Date().toLocaleString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    }) + " WIB";

    const reportHeaderTitle = filterInfo.reportTitle || "LAPORAN REKAPITULASI PERMOHONAN - SEMAR PLN ES";

    const rows = [
      [reportHeaderTitle],
      [`Periode Laporan: ${filterInfo.periode || "Semua Periode"}`],
      [`Unit Kerja / UPT: ${filterInfo.unit || "Semua Unit"}`],
      [`Filter Jenis: ${filterInfo.type || "Semua Jenis"}`],
      [`Waktu Export: ${exportDateTimeStr}`],
      [], // Row Kosong
      [
        "No",
        "No. Dokumen",
        "Tgl Pengajuan",
        "Nama Pegawai",
        "NIP Pegawai",
        "Jabatan",
        "Jenis",
        "Unit / Lokasi",
        "Keterangan",
        "Estimasi Biaya",
        "Status"
      ]
    ];

    (submissions || []).forEach((sub, index) => {
      let nominal = 0;
      if (sub.type === "lembur") nominal = sub.estimasiBiayaRupiah || 0;
      if (sub.type === "sppd") nominal = sub.totalEstimasiBiaya || 0;

      let rincian = sub.keterangan || sub.maksudSppd || sub.alasan || "-";
      if (sub.type === "lembur") {
        const cat = sub.kategoriLembur ? `${sub.kategoriLembur} - ` : "";
        const job = sub.jenisPekerjaan ? `${sub.jenisPekerjaan} ` : "";
        const dur = `(${sub.durasiJam || 0} Jam)`;
        const ket = sub.keterangan ? `: ${sub.keterangan}` : "";
        rincian = `${cat}${job}${dur}${ket}`;
      } else if (sub.type === "cuti") {
        const cType = sub.cutiType || "Cuti";
        const dur = `(${sub.jumlahHari || 0} Hari)`;
        const ket = (sub.keterangan || sub.alasan) ? `: ${sub.keterangan || sub.alasan}` : "";
        rincian = `${cType} ${dur}${ket}`;
      } else if (sub.type === "ijin") {
        const dur = `(${sub.jumlahHari || 1} Hari)`;
        const ket = (sub.keterangan || sub.alasan) ? `: ${sub.keterangan || sub.alasan}` : "";
        rincian = `Ijin ${dur}${ket}`;
      } else if (sub.type === "sakit") {
        const dur = `(${sub.jumlahHari || 1} Hari)`;
        const ket = (sub.keterangan || sub.alasan) ? `: ${sub.keterangan || sub.alasan}` : "";
        rincian = `Sakit ${dur}${ket}`;
      } else if (sub.type === "sppd") {
        const mksd = sub.maksudSppd || "SPPD";
        const rute = sub.kotaTujuan ? ` (Rute: ${sub.kotaTujuan})` : "";
        const ket = sub.keterangan ? `: ${sub.keterangan}` : "";
        rincian = `${mksd}${rute}${ket}`;
      }

      const isNonBillableLembur =
        sub.type === "lembur" &&
        (sub.jenisPekerjaan === "Pengganti Piket (Operator sedang cuti)" ||
          (typeof sub.jenisPekerjaan === "string" && (
            sub.jenisPekerjaan.toLowerCase().includes("pengganti piket") ||
            sub.jenisPekerjaan.toLowerCase().includes("operator sedang cuti")
          )));

      const displayType = isNonBillableLembur
        ? "LEMBUR (TIDAK DITAGIHKAN)"
        : (sub.type || sub.jenisPermohonan || "").toUpperCase();

      rows.push([
        index + 1,
        getFormattedDocNo(sub),
        sub.tanggalPengajuan ? formatDateIndonesian(sub.tanggalPengajuan) : "-",
        sub.employeeName || sub.namaPegawai || "-",
        sub.employeeNip || sub.nip || "-",
        sub.employeeJabatan || "-",
        displayType,
        sub.unitKerja || sub.unitUltg || sub.unitUpt || sub.unit || "-",
        rincian,
        nominal ? formatRupiah(nominal) : "-",
        getStatusLabel(sub.status) || "DISETUJUI"
      ]);
    });

    if (Array.isArray(signatories) && signatories.length > 0) {
      rows.push([]);
      rows.push(["--- LEMBAR PENGESAHAN LAPORAN (PEJABAT PENANDATANGAN) ---"]);
      signatories.forEach((sig, idx) => {
        const posText = sig.positionLabel || `Posisi ${idx + 1}`;
        rows.push([
          `[${posText}] ${sig.title || "PENANDATANGAN"}`,
          sig.role || sig.jabatan || "-",
          sig.name || "-",
          sig.nip ? `NIP. ${sig.nip}` : "-",
          sig.jabatan || "-"
        ]);
      });
    }

    const worksheet = XLSX.utils.aoa_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Resume Laporan");
    const cols = [
      { wch: 6 },  // No
      { wch: 22 }, // No Dokumen
      { wch: 18 }, // Tgl Pengajuan
      { wch: 24 }, // Nama Pegawai
      { wch: 20 }, // NIP Pegawai
      { wch: 26 }, // Jabatan
      { wch: 25 }, // Jenis
      { wch: 22 }, // Unit/Lokasi
      { wch: 38 }, // Keterangan
      { wch: 20 }, // Estimasi Biaya
      { wch: 22 }  // Status
    ];
    worksheet["!cols"] = cols;
    XLSX.writeFile(workbook, targetFilename);
  }
  /**
   * Export Attendance Summary to Excel
   */
  static exportAttendanceToExcel(records = [], filename = "Rekap_Semar_PLNES.xlsx") {
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
    XLSX.utils.book_append_sheet(workbook, worksheet, "Semar Harian");
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
  static exportSummaryPresentationPPT(submissions, stats, title = "LAPORAN REKAPITULASI PERMOHONAN - SEMAR PLN ES") {
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
