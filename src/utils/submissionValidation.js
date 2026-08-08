import { formatDateIndonesian } from "./formatters";

/**
 * Task 1 Validation Rules for Lembur, Cuti, Ijin, Sakit, SPPD
 */

/**
 * 1. Lembur: Maksimal tanggal 10 bulan N+1 (periode lembur Juni maksimal diinput sebelum tanggal 10 Juli)
 */
export function validateLemburInput(tanggalLemburStr, tanggalPengajuanStr) {
  if (!tanggalLemburStr || !tanggalPengajuanStr) return { isValid: true };

  const dLembur = new Date(tanggalLemburStr + "T00:00:00");
  const dPengajuan = new Date(tanggalPengajuanStr + "T00:00:00");

  const yearLembur = dLembur.getFullYear();
  const monthLembur = dLembur.getMonth(); // 0-indexed (0=Jan, 5=Jun)

  // Cutoff date is 10th of Month N+1
  let cutoffYear = yearLembur;
  let cutoffMonth = monthLembur + 1; // 1-12
  if (cutoffMonth > 11) {
    cutoffMonth = 0;
    cutoffYear += 1;
  }

  // Cutoff is end of day of 10th N+1
  const cutoffDate = new Date(cutoffYear, cutoffMonth, 10, 23, 59, 59);

  if (dPengajuan > cutoffDate) {
    const monthNames = [
      "Januari", "Februari", "Maret", "April", "Mei", "Juni",
      "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];
    const monthLemburName = monthNames[monthLembur];
    const cutoffMonthName = monthNames[cutoffMonth];

    return {
      isValid: false,
      message: `Gagal Simpan/Kirim Lembur!\n\nKetentuan: Periode lembur bulan ${monthLemburName} ${yearLembur} maksimal dapat diinput/diajukan sebelum tanggal 10 ${cutoffMonthName} ${cutoffYear}.\n\nTanggal Pengajuan Anda: ${formatDateIndonesian(tanggalPengajuanStr)}\nBatas Maksimal: 10 ${cutoffMonthName} ${cutoffYear}\nStatus: Melewati batas waktu yang ditentukan.`
    };
  }

  return { isValid: true };
}

/**
 * Helper to calculate calendar week bounds (Monday to Sunday) for a given YYYY-MM-DD date string
 */
export function getWeekRange(dateStr) {
  if (!dateStr) return { monday: new Date(), sunday: new Date(), mondayStr: "", sundayStr: "" };
  const d = new Date(dateStr + "T00:00:00");
  if (isNaN(d.getTime())) return { monday: new Date(), sunday: new Date(), mondayStr: "", sundayStr: "" };

  const day = d.getDay(); // 0 is Sunday, 1 is Monday, ... 6 is Saturday
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diffToMonday);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const mYear = monday.getFullYear();
  const mMon = String(monday.getMonth() + 1).padStart(2, "0");
  const mDay = String(monday.getDate()).padStart(2, "0");

  const sYear = sunday.getFullYear();
  const sMon = String(sunday.getMonth() + 1).padStart(2, "0");
  const sDay = String(sunday.getDate()).padStart(2, "0");

  return {
    monday,
    sunday,
    mondayStr: `${mYear}-${mMon}-${mDay}`,
    sundayStr: `${sYear}-${sMon}-${sDay}`
  };
}

/**
 * Task 1: Calculate accumulated weekly (Mon-Sun) and monthly overtime hours for an employee
 */
export function calculateEmployeeLemburAccumulation(submissions, employeeNip, dateStr, currentSubId = null) {
  if (!dateStr || !employeeNip || !Array.isArray(submissions)) {
    return {
      weeklyHours: 0,
      monthlyHours: 0,
      weeklyCount: 0,
      monthlyCount: 0,
      weekPeriodStr: "-",
      mondayStr: "",
      sundayStr: ""
    };
  }

  const { monday, sunday, mondayStr, sundayStr } = getWeekRange(dateStr);
  const startOfWeek = new Date(monday);
  startOfWeek.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(sunday);
  endOfWeek.setHours(23, 59, 59, 999);

  const targetDate = new Date(dateStr + "T00:00:00");
  const targetYear = targetDate.getFullYear();
  const targetMonth = targetDate.getMonth();

  let weeklyHours = 0;
  let monthlyHours = 0;
  let weeklyCount = 0;
  let monthlyCount = 0;

  submissions.forEach((sub) => {
    if (!sub || sub.type !== "lembur" || sub.employeeNip !== employeeNip) return;
    const statusLower = sub.status ? sub.status.toLowerCase() : "";
    if (statusLower === "rejected" || statusLower === "cancelled" || statusLower === "dibatalkan" || statusLower === "ditolak") return;
    if (currentSubId && String(sub.id) === String(currentSubId)) return; // Exclude current when editing/validating prior

    const subDate = new Date((sub.tanggalLembur || sub.tanggalPengajuan) + "T00:00:00");
    if (isNaN(subDate.getTime())) return;

    // Use corrected hours if present, otherwise durasiJam
    const effectiveHours = Number(
      sub.jumlahJamKoreksi !== undefined && sub.jumlahJamKoreksi !== null && sub.jumlahJamKoreksi !== ""
        ? sub.jumlahJamKoreksi
        : sub.durasiJam
    ) || 0;

    // Check weekly match (Monday <= subDate <= Sunday)
    if (subDate >= startOfWeek && subDate <= endOfWeek) {
      weeklyHours += effectiveHours;
      weeklyCount++;
    }

    // Check monthly match (same year and month)
    if (subDate.getFullYear() === targetYear && subDate.getMonth() === targetMonth) {
      monthlyHours += effectiveHours;
      monthlyCount++;
    }
  });

  const roundWeekly = Math.round(weeklyHours * 10) / 10;
  const roundMonthly = Math.round(monthlyHours * 10) / 10;

  return {
    weeklyHours: roundWeekly,
    monthlyHours: roundMonthly,
    weeklyCount,
    monthlyCount,
    weekPeriodStr: `${formatDateIndonesian(mondayStr)} s/d ${formatDateIndonesian(sundayStr)}`,
    mondayStr,
    sundayStr
  };
}

/**
 * Task 1 & Task 2: Validate Lembur limits (Max 4 hours per day, Max 18 hours per week Mon-Sun)
 */
export function validateLemburMaxHours(
  durasiJamInput,
  submissions,
  employeeNip,
  tanggalLemburStr,
  currentSubId = null,
  jenisPekerjaan = ""
) {
  const durasi = Number(durasiJamInput) || 0;
  if (durasi <= 0) {
    return {
      isValid: false,
      message: "Durasi jam lembur harus lebih dari 0 jam."
    };
  }

  // Khusus jenis pekerjaan "Pengganti Piket (Operator sedang cuti)" dan "Siaga / Libur Nasional",
  // batasan harian 4 jam dilewati dan diset default maksimal 8 jam.
  const isSpecial8HourJob =
    jenisPekerjaan === "Pengganti Piket (Operator sedang cuti)" ||
    jenisPekerjaan === "Siaga / Libur Nasional" ||
    (typeof jenisPekerjaan === "string" && (
      jenisPekerjaan.toLowerCase().includes("pengganti piket") ||
      jenisPekerjaan.toLowerCase().includes("siaga") ||
      jenisPekerjaan.toLowerCase().includes("libur nasional")
    ));

  const maxDaily = isSpecial8HourJob ? 8 : 4;

  // 1. Maksimal jam lembur per hari
  if (durasi > maxDaily) {
    return {
      isValid: false,
      message: `Gagal Pembatasan Jam Lembur Harian!\n\nKetentuan: Maksimal jam lembur per hari adalah ${maxDaily} jam${
        isSpecial8HourJob ? " (Pengganti Piket / Siaga Libur set default 8 jam)" : ""
      }.\n\nInput Durasi Jam: ${durasi} jam.\nStatus: Melebihi batas maksimal ${maxDaily} jam per hari.`
    };
  }

  // 2. Total jam lembur per minggu (Senin-Minggu)
  const accumulation = calculateEmployeeLemburAccumulation(submissions, employeeNip, tanggalLemburStr, currentSubId);
  const totalWithNew = Math.round((accumulation.weeklyHours + durasi) * 10) / 10;
  const maxWeekly = isSpecial8HourJob ? 40 : 18;

  if (totalWithNew > maxWeekly) {
    return {
      isValid: false,
      message: `Gagal Pembatasan Jam Lembur Mingguan!\n\nKetentuan: Total jam lembur per minggu (Senin s/d Minggu) maksimal ${maxWeekly} jam.\n\nAkumulasi Lembur Minggu Ini (${accumulation.weekPeriodStr}): ${accumulation.weeklyHours} jam\nInput Lembur Tambahan/Koreksi: ${durasi} jam\nTotal Akumulasi Terhitung: ${totalWithNew} jam\n\nStatus: Melebihi batas maksimal ${maxWeekly} jam per minggu (Sisa kuota minggu ini: ${Math.max(0, Math.round((maxWeekly - accumulation.weeklyHours) * 10) / 10)} jam).`
    };
  }

  return { isValid: true };
}

/**
 * 2. Cuti: Minimal 7 hari sebelum tanggal mulai cuti
 */
export function validateCutiInput(tanggalMulaiStr, tanggalPengajuanStr) {
  if (!tanggalMulaiStr || !tanggalPengajuanStr) return { isValid: true };

  const dMulai = new Date(tanggalMulaiStr + "T00:00:00");
  const dPengajuan = new Date(tanggalPengajuanStr + "T00:00:00");

  const diffMs = dMulai - dPengajuan;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 7) {
    return {
      isValid: false,
      message: `Gagal Simpan/Kirim Cuti!\n\nKetentuan: Permohonan cuti wajib dibuat minimal 7 hari sebelum tanggal mulai cuti.\n\nTanggal Pengajuan: ${formatDateIndonesian(tanggalPengajuanStr)}\nTanggal Mulai Cuti: ${formatDateIndonesian(tanggalMulaiStr)}\nSelisih Waktu: ${diffDays < 0 ? 0 : diffDays} hari (Syarat minimal: 7 hari).`
    };
  }

  return { isValid: true };
}

/**
 * 3. Ijin: Minimal 1 hari sebelum tanggal ijin
 */
export function validateIjinInput(tanggalMulaiStr, tanggalPengajuanStr) {
  if (!tanggalMulaiStr || !tanggalPengajuanStr) return { isValid: true };

  const dMulai = new Date(tanggalMulaiStr + "T00:00:00");
  const dPengajuan = new Date(tanggalPengajuanStr + "T00:00:00");

  const diffMs = dMulai - dPengajuan;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 1) {
    return {
      isValid: false,
      message: `Gagal Simpan/Kirim Ijin!\n\nKetentuan: Permohonan ijin wajib dibuat minimal 1 hari sebelum tanggal ijin.\n\nTanggal Pengajuan: ${formatDateIndonesian(tanggalPengajuanStr)}\nTanggal Ijin: ${formatDateIndonesian(tanggalMulaiStr)}\nSelisih Waktu: ${diffDays < 0 ? 0 : diffDays} hari (Syarat minimal: 1 hari sebelum tanggal ijin).`
    };
  }

  return { isValid: true };
}

/**
 * 4. Sakit: Minimal 0 hari sebelum tanggal sakit (harus sesuai tanggal sakit / surat dokter, tidak boleh tanggal masa depan)
 */
export function validateSakitInput(tanggalMulaiStr, tanggalPengajuanStr) {
  if (!tanggalMulaiStr || !tanggalPengajuanStr) return { isValid: true };

  const dMulai = new Date(tanggalMulaiStr + "T00:00:00");
  const dPengajuan = new Date(tanggalPengajuanStr + "T00:00:00");

  if (dMulai > dPengajuan) {
    return {
      isValid: false,
      message: `Gagal Simpan/Kirim Izin Sakit!\n\nKetentuan: Pengajuan izin sakit dibuat minimal 0 hari sebelum tanggal sakit (harus di hari yang sesuai dengan tanggal sakit / tanggal surat dokter) dan tidak dapat dibuat untuk tanggal di masa depan.\n\nTanggal Pengajuan: ${formatDateIndonesian(tanggalPengajuanStr)}\nTanggal Mulai Sakit: ${formatDateIndonesian(tanggalMulaiStr)} (Masa Depan - Tidak Sesuai Ketentuan).`
    };
  }

  return { isValid: true };
}

/**
 * 5. SPPD: Minimal 0 hari sebelum tanggal berangkat dan maksimal 2 hari setelah tanggal pulang
 */
export function validateSppdInput(tanggalBerangkatStr, tanggalKembaliStr, tanggalPengajuanStr) {
  if (!tanggalBerangkatStr || !tanggalKembaliStr || !tanggalPengajuanStr) return { isValid: true };

  const dBerangkat = new Date(tanggalBerangkatStr + "T00:00:00");
  const dKembali = new Date(tanggalKembaliStr + "T00:00:00");
  const dPengajuan = new Date(tanggalPengajuanStr + "T00:00:00");

  const maxAllowedDate = new Date(dKembali);
  maxAllowedDate.setDate(maxAllowedDate.getDate() + 2);

  if (dPengajuan > maxAllowedDate) {
    return {
      isValid: false,
      message: `Gagal Simpan/Kirim SPPD!\n\nKetentuan: SPPD wajib dibuat minimal 0 hari sebelum tanggal berangkat dan maksimal 2 hari setelah tanggal pulang.\n\nTanggal Pulang: ${formatDateIndonesian(tanggalKembaliStr)}\nBatas Maksimal Pengajuan: ${formatDateIndonesian(maxAllowedDate.toISOString().slice(0, 10))}\nTanggal Pengajuan Anda: ${formatDateIndonesian(tanggalPengajuanStr)} (Sudah melebihi 2 hari setelah tanggal pulang).`
    };
  }

  return { isValid: true };
}
