const clean = (value) => String(value || "").trim();

const hierarchyName = (submission, pattern) =>
  (submission?.unitHierarchy || []).find((unit) => pattern.test(clean(unit?.name)))?.name || "";

export const formatReportUnitHierarchy = (submission = {}) => {
  const gi = clean(submission.garduInduk) || clean(hierarchyName(submission, /(^|\s)(GI|GARDU INDUK)(\s|$)/i));
  const ultg = clean(submission.unitUltg) || clean(hierarchyName(submission, /(^|\s)ULTG(\s|$)/i));
  const upt = clean(submission.unitUpt) || clean(hierarchyName(submission, /(^|\s)(UPT|UNIT PELAKSANA)(\s|$)/i));
  const fallback = clean(submission.unitKerja || submission.unit || submission.areaGroup);
  const locations = [gi, ultg, upt].filter((value, index, values) => value && values.indexOf(value) === index);
  return locations.length ? locations.join(" / ") : (fallback || "-");
};

export const getOvertimeCorrectionNote = (submission = {}) => {
  if (submission.type !== "lembur") return "";
  const submitted = Number(submission.durasiJam ?? submission.total_jam);
  const corrected = Number(submission.jumlahJamKoreksi ?? submission.durasiJamApproved ?? submission.jumlah_jam_koreksi);
  if (!Number.isFinite(submitted) || !Number.isFinite(corrected) || submitted === corrected) return "";
  return `Koreksi jam: ${corrected} jam (diajukan ${submitted} jam)`;
};

export const appendOvertimeCorrection = (description, submission = {}) => {
  const base = clean(description) || "-";
  const correction = getOvertimeCorrectionNote(submission);
  return correction ? `${base} | ${correction}` : base;
};

export const isReplacementOvertimeReport = (submission = {}) => {
  if (submission.type !== "lembur") return false;
  const text = [submission.kategoriLembur, submission.jenisPekerjaan, submission.dasarLemburType, submission.keterangan]
    .filter(Boolean).join(" ").toUpperCase();
  return ["CUTI", "IJIN", "IZIN", "SAKIT"].some((keyword) => text.includes(keyword))
    && (text.includes("PENGGANTI") || ["CUTI", "IJIN", "IZIN", "SAKIT"].includes(clean(submission.dasarLemburType).toUpperCase()));
};

export const filterReportTransactionsByView = (submissions = [], reportView = "PLN") =>
  reportView === "PLN_ES"
    ? submissions
    : submissions.filter((submission) => !isReplacementOvertimeReport(submission));
