import { resolveBackendFileFields, resolveBackendFileUrl } from "./fileUrl";

const ROLE_MAP = {
  MAKER: "maker",
  CHECKER: "checker",
  VERIFICATION: "verification",
  APPROVAL_1: "approved1",
  APPROVAL1: "approved1",
  APPROVED1: "approved1",
  APPROVAL_2: "approved2",
  APPROVAL2: "approved2",
  APPROVED2: "approved2",
  APPROVAL_3: "approved3",
  APPROVAL3: "approved3",
  APPROVED3: "approved3"
};

const SIGNATURE_FIELDS = {
  checker: "checker_signature",
  verification: "verification_signature",
  approved1: "approval_1_signature",
  approved2: "approval_2_signature",
  approved3: "approval_3_signature"
};

const ROLE_LABELS = {
  checker: "TL PLN (Checker)",
  verification: "AMN PLN (Verifikasi)",
  approved1: "MAN PLN (Approved 1)",
  approved2: "TL ES (Approved 2)",
  approved3: "AMN ES (Approved 3)"
};

const normalizeRole = (code) => ROLE_MAP[String(code || "").toUpperCase()] || "";

const buildApprovalSteps = (item, workflowHistory) =>
  Object.keys(SIGNATURE_FIELDS).map((role) => {
    const log = [...workflowHistory].reverse().find((entry) =>
      normalizeRole(entry.createdBy?.role?.kode_role) === role &&
      ["NEXT", "REJECT"].includes(String(entry.aksi || "").toUpperCase())
    );
    const identity = log?.createdBy?.pegawai || log?.createdBy?.petugas;
    const signatureUrl = resolveBackendFileUrl(item[SIGNATURE_FIELDS[role]]);
    const action = String(log?.aksi || "").toUpperCase();

    return {
      role,
      roleLabel: ROLE_LABELS[role],
      status: action === "REJECT" ? "rejected" : (log || signatureUrl ? "approved" : "pending"),
      actionByName: identity?.nama || log?.createdBy?.username || "",
      actionByNip: identity?.nip || "",
      actionDate: log?.created_at || "",
      notes: log?.keterangan || "",
      signatureUrl
    };
  });

export const withWorkflowApprovalIdentities = (submission, workflowHistory = []) => ({
  ...submission,
  workflowHistory,
  approvalSteps: buildApprovalSteps(submission, workflowHistory)
});

const workflowRole = (item) =>
  ROLE_MAP[String(item.status?.role?.kode_role || "").toUpperCase()] || "maker";

const workflowStatus = (item) => {
  const code = String(item.status?.kode_status || "").toLowerCase();
  if (item.status?.is_final === "Y") {
    return code.includes("reject") ? "rejected" : "approved";
  }
  if (code.includes("revision") || code.includes("revisi")) return "revision";
  if (item.status?.is_initial === "Y" || code.includes("draft")) return "draft";
  return `pending_${workflowRole(item)}`;
};

const common = (item, type, id) => {
  const workflowHistory = [...(item.logs || [])].sort(
    (a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0)
  );
  const latestRevision = [...workflowHistory].reverse().find(
    (entry) => String(entry.aksi || "").toUpperCase() === "REVISION"
  );
  const directUnit = item.petugas?.unit;
  const unitNodes = [];
  const visitedUnitIds = new Set();
  let currentUnit = directUnit;
  while (currentUnit && !visitedUnitIds.has(currentUnit.id_unit)) {
    visitedUnitIds.add(currentUnit.id_unit);
    unitNodes.push(currentUnit);
    currentUnit = currentUnit.indukUnit;
  }
  const unitHierarchy = unitNodes
    .filter(Boolean)
    .map((unit) => ({ id: unit.id_unit, name: unit.nama_unit }));
  const findUnitName = (pattern, fallback = "") =>
    unitHierarchy.find((unit) => pattern.test(String(unit.name || "")))?.name || fallback;
  const directUnitName = directUnit?.nama_unit || "-";

  return {
    ...item,
    ...resolveBackendFileFields(item),
    id: String(id),
    type,
    employeeNip: item.petugas?.nip || String(item.id_petugas || ""),
    employeeName: item.petugas?.nama || "-",
    employeeJabatan: item.petugas?.jabatan?.nama_jabatan || "-",
    id_unit: item.petugas?.id_unit ?? item.petugas?.unit?.id_unit,
    unitHierarchy,
    unitUpt: findUnitName(/\b(UP|UPT|UNIT PELAKSANA)\b/i),
    unitUltg: findUnitName(/\bULTG\b/i),
    garduInduk: findUnitName(/\b(GI|GARDU INDUK)\b/i),
    status: workflowStatus(item),
    statusCode: item.status?.kode_status || "",
    isFinal: item.status?.is_final === "Y",
    currentApproverRole: workflowRole(item),
    workflowHistory,
    approvalSteps: buildApprovalSteps(item, workflowHistory),
    revisionNote: latestRevision?.keterangan || "",
    revisionDate: latestRevision?.created_at || "",
    revisionBy: latestRevision?.createdBy?.username || ""
  };
};

export const mapWorkflowLembur = (item) => ({
  ...common(item, "lembur", item.id_lembur),
  nomorDokumen: item.nomor_dokumen || `LMB-${String(item.id_lembur).padStart(6, "0")}`,
  tanggalPengajuan: String(item.created_at || item.tgl_lembur || "").slice(0, 10),
  tanggalLembur: item.tgl_lembur,
  jamMulai: String(item.jam_mulai || "").slice(0, 5),
  jamSelesai: String(item.jam_selesai || "").slice(0, 5),
  durasiJam: Number(item.total_jam || 0),
  jumlahJamKoreksi: Number(item.jumlah_jam_koreksi ?? item.total_jam ?? 0),
  catatanKoreksi: item.catatan_koreksi || "",
  kategoriLembur: item.kategori_lembur || "",
  jenisPekerjaan: item.jenis_pekerjaan || "",
  areaGroup: item.area_group || item.petugas?.unit?.nama_unit || "",
  kegiatanDetail: item.detail_pekerjaan_lembur || "",
  biayaLembur: Number(item.biaya_lembur || 0),
  estimasiBiayaRupiah: Number(item.biaya_lembur || 0),
  isHariLibur: item.is_hari_libur === "Y",
  dasarLemburType: item.dasar_lembur_type || "",
  nomorSpkl: item.spklAssignment?.spkl?.nomor_dokumen || "",
  pengajuLemburNama: item.petugas?.nama || "-",
  pengajuLemburNip: item.petugas?.nip || "",
  makerSignatureUrl: resolveBackendFileUrl(item.maker_signature)
});

export const mapWorkflowCuti = (item) => ({
  ...common(item, "cuti", item.id_cuti),
  nomorDokumen: item.no_cuti || `CUTI-${item.id_cuti}`,
  tanggalPengajuan: item.tgl_pengajuan,
  cutiType: item.jenis_cuti,
  tanggalMulai: item.tgl_mulai,
  tanggalSelesai: item.tgl_selesai,
  jumlahHari: Number(item.lama_hari || 0),
  alamatSelamaCuti: item.contact_alamat || "",
  nomorTeleponDarurat: item.nomor_telepon_darurat || "",
  keterangan: item.perihal || "",
  pengganti: item.pengganti || "",
  makerSignatureUrl: resolveBackendFileUrl(item.maker_signature)
});

export const mapWorkflowIjin = (item) => ({
  ...common(item, "ijin", item.id_ijin),
  nomorDokumen: item.nomor_dokumen || `IJIN-${item.id_ijin}`,
  tanggalPengajuan: String(item.created_at || item.tanggal || "").slice(0, 10),
  ijinReasonType: item.agenda,
  tanggalMulai: item.tanggal,
  tanggalSelesai: item.tgl_selesai,
  jumlahHari: Math.max(1, Math.round((new Date(item.tgl_selesai) - new Date(item.tanggal)) / 86400000) + 1),
  jumlahHariDisetujui: item.jumlah_hari_disetujui,
  keterangan: item.keterangan || "",
  makerSignatureUrl: resolveBackendFileUrl(item.maker_signature)
});

export const mapWorkflowSakit = (item) => ({
  ...common(item, "sakit", item.id_sakit),
  nomorDokumen: item.nomor_dokumen || `SAKIT-${item.id_sakit}`,
  tanggalPengajuan: String(item.created_at || item.tanggal || "").slice(0, 10),
  tanggalMulai: item.tanggal,
  tanggalSelesai: item.tgl_selesai,
  jumlahHari: Math.max(1, Math.round((new Date(item.tgl_selesai) - new Date(item.tanggal)) / 86400000) + 1),
  instansiKlinik: item.agenda || "",
  namaDokterFaskes: item.agenda || "",
  namaDokter: item.nama_dokter || "",
  suratKeteranganDokterUrl: resolveBackendFileUrl(item.foto),
  diagnosaSingkat: item.keterangan || "",
  makerSignatureUrl: resolveBackendFileUrl(item.maker_signature)
});

export const mapWorkflowSppd = (item) => {
  const expenses = [
    { id: "akomodasi", kategori: "Akomodasi", deskripsi: item.desc_akomodasi, nominal: Number(item.rp_akomodasi || 0) },
    { id: "transportasi", kategori: "Transportasi", deskripsi: item.desc_transportasi, nominal: Number(item.rp_transportasi || 0) },
    { id: "lain-lain", kategori: "Lain-lain", deskripsi: item.desc_lain_lain, nominal: Number(item.rp_lain_lain || 0) }
  ].filter((expense) => Boolean(String(expense.deskripsi || "").trim()) || expense.nominal > 0);
  return {
    ...common(item, "sppd", item.id_sppd),
    nomorDokumen: item.nomor_dokumen || item.no_sppd || `SPPD-${item.id_sppd}`,
    nomorSuratTugas: item.no_sppd || "",
    tanggalPengajuan: String(item.created_at || item.tgl_berangkat || "").slice(0, 10),
    maksudPerjalanan: item.maksud_dinas,
    kotaAsal: item.kota_asal || "",
    kotaTujuan: item.kota_tujuan || "",
    tanggalBerangkat: item.tgl_berangkat,
    tanggalKembali: item.tgl_kembali,
    durasiHari: Number(item.lama_dinas || 1),
    bebanAnggaranUnit: item.beban_anggaran || "",
    expenses,
    totalBiaya: expenses.reduce((sum, expense) => sum + expense.nominal, 0),
    totalEstimasiBiaya: expenses.reduce((sum, expense) => sum + expense.nominal, 0),
    makerSignatureUrl: resolveBackendFileUrl(item.maker_signature)
  };
};

export const mapWorkflowSubmission = (item) => {
  const type = String(item?.report_type || item?.type || "").toLowerCase();
  return ({
    lembur: mapWorkflowLembur,
    cuti: mapWorkflowCuti,
    ijin: mapWorkflowIjin,
    sakit: mapWorkflowSakit,
    sppd: mapWorkflowSppd,
  }[type] || ((value) => value))(item);
};
