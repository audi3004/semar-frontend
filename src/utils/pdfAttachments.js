import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { resolveBackendFileUrl } from "./fileUrl";
import { getAccessToken } from "../services/api";
import { compressAndResizeImage } from "./imageCompressor";

const A4 = { width: 595.28, height: 841.89 };

const firstValue = (...values) => values.find((value) => typeof value === "string" && value.trim());

export const getSubmissionAttachments = (submission = {}) => {
  const type = String(submission.type || "").toLowerCase();
  const attachments = [];

  const add = (label, url, fileName) => {
    if (!url || attachments.some((item) => item.url === url)) return;
    const resolvedUrl = resolveBackendFileUrl(url);
    if (!resolvedUrl || attachments.some((item) => item.url === resolvedUrl)) return;
    attachments.push({ label, url: resolvedUrl, fileName: fileName || decodeURIComponent(String(url).split("/").pop()?.split("?")[0] || label) });
  };

  if (type === "lembur") {
    add("Foto Kegiatan 1", firstValue(submission.fotoDokumentasi1Url, submission.foto_kegiatan_1), submission.fotoDokumentasi1Name);
    add("Foto Kegiatan 2", firstValue(submission.fotoDokumentasi2Url, submission.foto_kegiatan_2), submission.fotoDokumentasi2Name);
    add("Surat Perintah Lembur", firstValue(submission.dasarPerintahLemburUrl, submission.surat_perintah_lembur), submission.dasarPerintahLemburName);
  }

  if (type === "sakit") {
    add("Surat Keterangan Dokter", firstValue(submission.suratKeteranganDokterUrl, submission.foto), submission.suratKeteranganDokterFileName);
  }

  // Kompatibilitas data ijin lama yang pernah memiliki field foto.
  if (type === "ijin") {
    add("Dokumen Pendukung Ijin", firstValue(submission.dokumenPendukungUrl, submission.foto), submission.dokumenPendukungName);
  }

  return attachments;
};

const appendImage = async (target, bytes, contentType, attachment, font) => {
  const optimized = await compressAndResizeImage(bytes, {
    maxWidth: 1200,
    maxHeight: 1600,
    quality: 0.8,
  });
  const embedded = await target.embedJpg(optimized.bytes);

  const page = target.addPage([A4.width, A4.height]);
  page.drawText(`LAMPIRAN - ${attachment.label}`, { x: 36, y: A4.height - 42, size: 11, font, color: rgb(0.05, 0.25, 0.42) });
  page.drawText(attachment.fileName, { x: 36, y: A4.height - 59, size: 7, font, color: rgb(0.35, 0.35, 0.35), maxWidth: A4.width - 72 });

  const availableWidth = A4.width - 72;
  const availableHeight = A4.height - 112;
  const scale = Math.min(availableWidth / embedded.width, availableHeight / embedded.height);
  const width = embedded.width * scale;
  const height = embedded.height * scale;
  page.drawImage(embedded, { x: (A4.width - width) / 2, y: 30 + (availableHeight - height) / 2, width, height });
};

export const appendPdfBlobAttachment = async (target, pdfInput, attachment = {}) => {
  const bytes = pdfInput instanceof Blob || pdfInput instanceof File
    ? await pdfInput.arrayBuffer()
    : pdfInput;
  if (!(bytes instanceof ArrayBuffer)) {
    throw new Error("Input PDF harus berupa Blob, File, atau ArrayBuffer");
  }

  const source = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const sourcePages = source.getPages();
  if (!sourcePages.length) return;

  const font = await target.embedFont(StandardFonts.HelveticaBold);
  const embeddedPages = await target.embedPages(sourcePages);
  embeddedPages.forEach((embeddedPage, index) => {
    const page = target.addPage([A4.width, A4.height]);
    page.drawText(`LAMPIRAN - ${attachment.label || "DOKUMEN"}`, {
      x: 36, y: A4.height - 42, size: 11, font, color: rgb(0.05, 0.25, 0.42),
    });
    const pageLabel = embeddedPages.length > 1
      ? ` (Halaman ${index + 1} dari ${embeddedPages.length})`
      : "";
    page.drawText(`${attachment.fileName || "dokumen.pdf"}${pageLabel}`, {
      x: 36, y: A4.height - 59, size: 7, font, color: rgb(0.35, 0.35, 0.35), maxWidth: A4.width - 72,
    });
    const availableWidth = A4.width - 72;
    const availableHeight = A4.height - 112;
    const scale = Math.min(availableWidth / embeddedPage.width, availableHeight / embeddedPage.height);
    const width = embeddedPage.width * scale;
    const height = embeddedPage.height * scale;
    page.drawPage(embeddedPage, {
      x: (A4.width - width) / 2,
      y: 30 + (availableHeight - height) / 2,
      width,
      height,
    });
  });
};

export const appendSubmissionAttachments = async (mainBlob, submission) => {
  const attachments = getSubmissionAttachments(submission);
  if (!attachments.length) return mainBlob;

  const target = await PDFDocument.load(await mainBlob.arrayBuffer());
  const font = await target.embedFont(StandardFonts.HelveticaBold);

  for (const attachment of attachments) {
    try {
      const token = getAccessToken();
      const response = await fetch(attachment.url, {
        credentials: "include",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const contentType = (response.headers.get("content-type") || "").toLowerCase();
      const bytes = await response.arrayBuffer();
      const isPdf = contentType.includes("pdf") || attachment.fileName.toLowerCase().endsWith(".pdf");

      if (isPdf) {
        await appendPdfBlobAttachment(target, bytes, attachment);
      } else if (contentType.startsWith("image/") || /\.(jpe?g|png|webp)$/i.test(attachment.fileName)) {
        await appendImage(target, bytes, contentType, attachment, font);
      }
    } catch (error) {
      console.error(`Gagal melampirkan ${attachment.label}:`, error);
    }
  }

  return new Blob([await target.save()], { type: "application/pdf" });
};
