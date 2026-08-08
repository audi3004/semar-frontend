import React from "react";
import { pdf } from "@react-pdf/renderer";
import QRCode from "qrcode";
import { SubmissionPdfDocument } from "../components/pdf/SubmissionPdfDocument";
import { ReportPdfDocument } from "../components/pdf/ReportPdfDocument";
import { getFormattedDocNo, formatDateIndonesian } from "../utils/formatters";

export class PdfService {
  /**
   * Generates a Blob URL for A4 PDF Preview
   */
  static async generatePdfBlobUrl(submission) {
    let qrCodeDataUrl = "";
    try {
      const finalDocNo = getFormattedDocNo(submission);
      const currentDateStr = new Date().toLocaleDateString("id-ID");
      const qrPayload = `TANGGAL CETAK: ${currentDateStr}\nNO: ${finalDocNo}`;
      qrCodeDataUrl = await QRCode.toDataURL(qrPayload, { width: 150, margin: 1 });
    } catch (err) {
      console.error("Failed to generate QR Code Data URL:", err);
    }

    const doc = React.createElement(SubmissionPdfDocument, { submission, qrCodeDataUrl });
    const blob = await pdf(doc).toBlob();
    return URL.createObjectURL(blob);
  }

  /**
   * Downloads A4 PDF Document
   */
  static async downloadPdf(submission) {
    let qrCodeDataUrl = "";
    try {
      const finalDocNo = getFormattedDocNo(submission);
      const currentDateStr = new Date().toLocaleDateString("id-ID");
      const qrPayload = `TANGGAL CETAK: ${currentDateStr}\nNO: ${finalDocNo}`;
      qrCodeDataUrl = await QRCode.toDataURL(qrPayload, { width: 150, margin: 1 });
    } catch (err) {
      console.error("Failed to generate QR Code Data URL:", err);
    }

    const doc = React.createElement(SubmissionPdfDocument, { submission, qrCodeDataUrl });
    const blob = await pdf(doc).toBlob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const finalDocNo = getFormattedDocNo(submission);
    link.download = `Dokumen_PLN_${submission.type.toUpperCase()}_${finalDocNo.replace(/\//g, "-")}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1e4);
  }

  /**
   * Downloads A4 Resume Report PDF Document for Approved 3 Submissions
   */
  static async downloadReportPdf(submissions = [], filterInfo = {}, signatories = []) {
    const doc = React.createElement(ReportPdfDocument, { submissions, filterInfo, signatories });
    const blob = await pdf(doc).toBlob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const dateTag = new Date().toISOString().slice(0, 10);
    link.download = `Laporan_Resume_Permohonan_Approved3_PLN_${dateTag}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1e4);
  }

  /**
   * Helper to convert Blob to Base64 Data URL (safe for Chrome embedded PDF previews)
   */
  static blobToDataUrl(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Generates a Base64 Data URL for A4 PDF Preview (Bypasses Chrome blob iframe block)
   */
  static async generatePdfDataUrl(submission) {
    let qrCodeDataUrl = "";
    try {
      const finalDocNo = getFormattedDocNo(submission);
      const currentDateStr = new Date().toLocaleDateString("id-ID");
      const qrPayload = `TANGGAL CETAK: ${currentDateStr}\nNO: ${finalDocNo}`;
      qrCodeDataUrl = await QRCode.toDataURL(qrPayload, { width: 150, margin: 1 });
    } catch (err) {
      console.error("Failed to generate QR Code Data URL:", err);
    }

    const doc = React.createElement(SubmissionPdfDocument, { submission, qrCodeDataUrl });
    const blob = await pdf(doc).toBlob();
    return await this.blobToDataUrl(blob);
  }

  /**
   * Generates a Blob URL for A4 Resume Report PDF Document Preview
   */
  static async generateReportPdfBlobUrl(submissions = [], filterInfo = {}, signatories = []) {
    const doc = React.createElement(ReportPdfDocument, { submissions, filterInfo, signatories });
    const blob = await pdf(doc).toBlob();
    return URL.createObjectURL(blob);
  }

  /**
   * Generates a Base64 Data URL for A4 Resume Report PDF Document Preview (Bypasses Chrome blob block)
   */
  static async generateReportPdfDataUrl(submissions = [], filterInfo = {}, signatories = []) {
    const doc = React.createElement(ReportPdfDocument, { submissions, filterInfo, signatories });
    const blob = await pdf(doc).toBlob();
    return await this.blobToDataUrl(blob);
  }
}
