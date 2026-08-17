const primaryTransactionDate = (submission = {}) => String(
  submission.tanggalLembur || submission.tgl_lembur ||
  submission.tanggalMulai || submission.tgl_mulai || submission.tanggal ||
  submission.tanggalBerangkat || submission.tgl_berangkat ||
  submission.tanggalPengajuan || submission.tgl_pengajuan ||
  submission.createdAt || submission.created_at || ""
).slice(0, 10);

export const matchesNavbarTransactionFilter = (
  submission,
  { projectIds = [], startDate = "", endDate = "" } = {}
) => {
  const normalizedProjectIds = projectIds.map(Number).filter(Boolean);
  if (normalizedProjectIds.length) {
    const submissionProjectId = Number(
      submission.id_project || submission.project?.id_project || 0
    );
    if (!submissionProjectId || !normalizedProjectIds.includes(submissionProjectId)) return false;
  }

  const transactionDate = primaryTransactionDate(submission);
  if (transactionDate) {
    if (startDate && transactionDate < startDate) return false;
    if (endDate && transactionDate > endDate) return false;
  }
  return true;
};

