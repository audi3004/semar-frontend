import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { resolveBackendFileUrl } from "./fileUrl";

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

const imageToPng = async (blob) => {
  const objectUrl = URL.createObjectURL(blob);
  try {
    const image = await new Promise((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = reject;
      element.src = objectUrl;
    });
    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    canvas.getContext("2d").drawImage(image, 0, 0);
    return await new Promise((resolve, reject) => canvas.toBlob(
      (png) => (png ? png.arrayBuffer().then(resolve, reject) : reject(new Error("Konversi gambar gagal"))),
      "image/png",
    ));
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
};

const appendImage = async (target, bytes, contentType, attachment, font) => {
  let embedded;
  if (contentType.includes("png")) embedded = await target.embedPng(bytes);
  else if (contentType.includes("jpeg") || contentType.includes("jpg")) embedded = await target.embedJpg(bytes);
  else embedded = await target.embedPng(await imageToPng(new Blob([bytes], { type: contentType })));

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

export const appendSubmissionAttachments = async (mainBlob, submission) => {
  const attachments = getSubmissionAttachments(submission);
  if (!attachments.length) return mainBlob;

  const target = await PDFDocument.load(await mainBlob.arrayBuffer());
  const font = await target.embedFont(StandardFonts.HelveticaBold);

  for (const attachment of attachments) {
    try {
      const response = await fetch(attachment.url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const contentType = (response.headers.get("content-type") || "").toLowerCase();
      const bytes = await response.arrayBuffer();
      const isPdf = contentType.includes("pdf") || attachment.fileName.toLowerCase().endsWith(".pdf");

      if (isPdf) {
        const source = await PDFDocument.load(bytes);
        const pages = await target.copyPages(source, source.getPageIndices());
        pages.forEach((page) => target.addPage(page));
      } else if (contentType.startsWith("image/") || /\.(jpe?g|png|webp)$/i.test(attachment.fileName)) {
        await appendImage(target, bytes, contentType, attachment, font);
      }
    } catch (error) {
      console.error(`Gagal melampirkan ${attachment.label}:`, error);
    }
  }

  return new Blob([await target.save()], { type: "application/pdf" });
};
