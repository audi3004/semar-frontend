export function formatRupiah(amount) {
  if (isNaN(amount) || amount === void 0 || amount === null) return "Rp 0";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
  }).format(amount);
}

export function formatDateIndonesian(dateStr) {
  if (!dateStr) return "-";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
    const day = d.getDate();
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  } catch {
    return String(dateStr);
  }
}

export function formatDateIndonesianLong(dateStr) {
  if (!dateStr) return "-";
  try {
    const raw = String(dateStr).slice(0, 10);
    const parts = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    const d = parts
      ? new Date(Number(parts[1]), Number(parts[2]) - 1, Number(parts[3]))
      : new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  } catch {
    return String(dateStr);
  }
}

export function formatDateDDMMYYYY(dateStr) {
  if (!dateStr) return "15031998";
  const cleanStr = String(dateStr).split("T")[0];
  const parts = cleanStr.includes("-") ? cleanStr.split("-") : cleanStr.split("/");
  if (parts.length === 3) {
    if (parts[0].length === 4) {
      // YYYY-MM-DD
      const [year, month, day] = parts;
      return `${day.padStart(2, "0")}${month.padStart(2, "0")}${year}`;
    } else {
      // DD-MM-YYYY
      const [day, month, year] = parts;
      return `${day.padStart(2, "0")}${month.padStart(2, "0")}${year}`;
    }
  }
  return cleanStr.replace(/\D/g, "") || "15031998";
}

export function formatTimeHHMM(timeStr) {
  if (!timeStr) return "--:--";
  return String(timeStr).slice(0, 5);
}

export function calculateHoursDifference(jamMulai, jamSelesai) {
  if (!jamMulai || !jamSelesai || typeof jamMulai !== "string" || typeof jamSelesai !== "string") return 0;
  const parts1 = jamMulai.split(":");
  const parts2 = jamSelesai.split(":");
  if (parts1.length < 2 || parts2.length < 2) return 0;
  const [h1, m1] = parts1.map(Number);
  const [h2, m2] = parts2.map(Number);
  if (isNaN(h1) || isNaN(h2)) return 0;
  let startMinutes = h1 * 60 + (m1 || 0);
  let endMinutes = h2 * 60 + (m2 || 0);
  if (endMinutes < startMinutes) {
    endMinutes += 24 * 60;
  }
  const diffHours = (endMinutes - startMinutes) / 60;
  return Math.max(0, Math.round(diffHours * 10) / 10);
}

export function calculateOvertimeCost(gajiPokok, durasiJam, isHariLibur, formula) {
  if (!durasiJam || durasiJam <= 0 || !formula) return 0;
  const divisor = (formula && formula.divisorMonthlySalary) || 173;
  const hourlyRate = (gajiPokok || 0) / divisor;
  let totalMultiplier = 0;
  if (isHariLibur) {
    for (let hour = 1; hour <= durasiJam; hour++) {
      if (hour <= 8) {
        totalMultiplier += (formula && formula.holidayMultiplier) || 2;
      } else if (hour === 9) {
        totalMultiplier += 3;
      } else {
        totalMultiplier += 4;
      }
    }
  } else {
    for (let hour = 1; hour <= durasiJam; hour++) {
      if (hour === 1) {
        totalMultiplier += (formula && formula.multiplierFirstHour) || 1.5;
      } else {
        totalMultiplier += (formula && formula.multiplierSubsequentHours) || 2;
      }
    }
  }
  return Math.ceil(hourlyRate * totalMultiplier);
}

export function calculateAccruedCuti(tanggalMasuk, usedCutiDays = 0, maxAllowedYearly = 12) {
  let joinDate = new Date(tanggalMasuk || "2022-01-01");
  if (isNaN(joinDate.getTime())) joinDate = new Date("2022-01-01");
  const now = new Date();
  let months = (now.getFullYear() - joinDate.getFullYear()) * 12 + (now.getMonth() - joinDate.getMonth());
  if (now.getDate() < joinDate.getDate()) {
    months--;
  }
  months = Math.max(0, months);
  let eligibleTotal = maxAllowedYearly;
  let isEligibleForCuti = true;
  if (months < 12) {
    eligibleTotal = 0;
    isEligibleForCuti = false;
  } else {
    eligibleTotal = maxAllowedYearly;
    isEligibleForCuti = true;
  }
  const remainingCuti = Math.max(0, eligibleTotal - usedCutiDays);
  return {
    eligibleTotal,
    remainingCuti,
    monthsOfService: months,
    isEligibleForCuti,
    joinDateFormatted: formatDateIndonesian(tanggalMasuk)
  };
}

export function calculateAccumulatedSakit12Months(submissions, employeeNip, refDateStr) {
  let refDate = refDateStr ? new Date(refDateStr) : new Date();
  if (isNaN(refDate.getTime())) refDate = new Date();
  const twelveMonthsAgo = new Date(refDate);
  twelveMonthsAgo.setFullYear(twelveMonthsAgo.getFullYear() - 1);

  const employeeSubmissions = (submissions || []).filter(
    (s) => s.type === "sakit" && 
           (!employeeNip || s.employeeNip === employeeNip) &&
           s.status !== "rejected"
  );

  let totalDays = 0;
  let totalSubmissionsCount = 0;

  employeeSubmissions.forEach((sub) => {
    const subDate = new Date(sub.tanggalMulai || sub.tanggalPengajuan);
    if (!isNaN(subDate.getTime()) && subDate >= twelveMonthsAgo && subDate <= refDate) {
      totalDays += Number(sub.jumlahHari) || 0;
      totalSubmissionsCount++;
    }
  });

  const startDateIso = !isNaN(twelveMonthsAgo.getTime()) ? twelveMonthsAgo.toISOString().slice(0, 10) : "";
  const endDateIso = !isNaN(refDate.getTime()) ? refDate.toISOString().slice(0, 10) : "";

  return {
    totalDays,
    totalSubmissionsCount,
    startDateStr: startDateIso,
    endDateStr: endDateIso,
    periodFormatted: `${formatDateIndonesian(startDateIso)} s/d ${formatDateIndonesian(endDateIso)}`
  };
}

export function getStatusBadgeColor(status) {
  const s = status ? status.toLowerCase() : "";
  switch (s) {
    case "approved":
      return "bg-emerald-100 text-emerald-800 border-emerald-300 font-bold";
    case "rejected":
    case "ditolak":
    case "dibatalkan":
    case "cancelled":
      return "bg-rose-100 text-rose-800 border-rose-300 font-bold";
    case "revision":
    case "revision_required":
      return "bg-amber-100 text-amber-800 border-amber-300 font-bold";
    case "pending_checker":
    case "pending_verification":
    case "pending_approved1":
    case "pending_approved2":
    case "pending_approved3":
    case "pending_app_1":
    case "pending_app_2":
    case "pending_app_3":
      return "bg-sky-100 text-sky-800 border-sky-300 font-bold";
    default:
      return "bg-slate-100 text-slate-800 border-slate-300 font-bold";
  }
}

export function getStatusLabel(status) {
  const s = status ? status.toLowerCase() : "";
  switch (s) {
    case "draft":
      return "Draft";
    case "pending_checker":
      return "Menunggu Checker (TL PLN)";
    case "pending_verification":
      return "Menunggu Verifikasi (AMN PLN)";
    case "pending_approved1":
    case "pending_app_1":
      return "Menunggu Approval 1 (MAN PLN)";
    case "pending_approved2":
    case "pending_app_2":
      return "Menunggu Approval 2 (TL ES)";
    case "pending_approved3":
    case "pending_app_3":
      return "Menunggu Approval 3 (AMN ES)";
    case "approved":
      return "Disetujui (Approved)";
    case "rejected":
    case "ditolak":
      return "Ditolak (Rejected)";
    case "dibatalkan":
    case "cancelled":
      return "Dibatalkan";
    case "revision":
    case "revision_required":
      return "Perlu Revisi";
    default:
      return status;
  }
}

export function getRoleLabel(role) {
  switch (role) {
    case "superadmin":
      return "Superadmin System";
    case "maker":
      return "Tenaga Kerja (Maker)";
    case "checker":
      return "TL PLN (Checker)";
    case "verification":
      return "AMN PLN (Verifikasi)";
    case "approval1":
    case "approved1":
      return "Approval 1 (Spv/MAN)";
    case "approval2":
    case "approved2":
      return "Approval 2 (TL ES)";
    case "approval3":
    case "approved3":
      return "Approval 3 (AMN ES)";
    case "admin":
      return "Superadmin System";
    default:
      return role;
  }
}

export function getFormattedDocNo(sub) {
  if (!sub) return "001/LMB/UPT-SMG/PLN-ES/VII/2026";

  if (typeof sub === "string") {
    if (/^\d{3}\/[A-Z0-9-]+\/UPT-[A-Z]+\/PLN-ES\/[IVXLCDM]+\/\d{4}$/i.test(sub)) {
      return sub;
    }
    sub = { nomorDokumen: sub };
  }

  if (sub.nomorDokumen && /^\d{3}\/[A-Z0-9-]+\/UPT-[A-Z]+\/PLN-ES\/[IVXLCDM]+\/\d{4}$/i.test(sub.nomorDokumen)) {
    return sub.nomorDokumen;
  }

  const rawDocNo = sub.nomorDokumen || sub.docNo || sub.nomor_dokumen || sub.no_dokumen || sub.no_cuti || sub.no_sppd || "";

  // Backend adalah satu-satunya sumber nomor resmi. Jangan membentuk ulang nomor
  // yang sudah tersimpan karena dapat mengubah unit/periode/sequence dokumen.
  if (rawDocNo) return String(rawDocNo);

  // 1. Sequence Number
  let seqStr = "001";
  if (rawDocNo) {
    const parts = String(rawDocNo).split("/");
    const firstPart = parts[0];
    const lastPart = parts[parts.length - 1];

    if (/^\d+$/.test(firstPart) && firstPart.length <= 3) {
      seqStr = firstPart.padStart(3, "0");
    } else if (/^\d+$/.test(lastPart) && lastPart.length <= 3 && lastPart.length < 4) {
      seqStr = lastPart.padStart(3, "0");
    } else if (parts.length > 1) {
      const digitPart = parts.find((p) => /^\d{1,3}$/.test(p));
      if (digitPart) {
        seqStr = digitPart.padStart(3, "0");
      }
    } else {
      const match = String(rawDocNo).match(/\d+/);
      if (match) {
        const num = match[0];
        seqStr = (num.length > 3 ? num.slice(-3) : num).padStart(3, "0");
      }
    }
  } else if (sub.id) {
    const match = String(sub.id).match(/\d+/);
    if (match) {
      const num = match[0];
      seqStr = (num.length > 3 ? num.slice(-3) : num).padStart(3, "0");
    }
  }

  // 2. Type Abbreviation (e.g. lembur -> LMB)
  const typeAbbrMap = {
    lembur: "LMB",
    lmb: "LMB",
    cuti: "CUTI",
    sppd: "SPPD",
    ijin: "IJIN",
    izin: "IJIN",
    sakit: "SAKIT"
  };
  let typeKey = (sub.type || "").toLowerCase();
  if (!typeKey && rawDocNo) {
    const lowerRaw = rawDocNo.toLowerCase();
    if (lowerRaw.includes("lmb") || lowerRaw.includes("lembur")) typeKey = "lembur";
    else if (lowerRaw.includes("cuti")) typeKey = "cuti";
    else if (lowerRaw.includes("sppd")) typeKey = "sppd";
    else if (lowerRaw.includes("ijin") || lowerRaw.includes("izin")) typeKey = "ijin";
    else if (lowerRaw.includes("sakit")) typeKey = "sakit";
  }
  const typeAbbr = typeAbbrMap[typeKey] || typeKey.toUpperCase() || "DOC";

  // 3. UPT Abbreviation (e.g. UPT Semarang -> UPT-SMG)
  const unitUpt = sub.unitUpt || sub.unit_upt || sub.upt || "UPT Semarang";
  const getUptAbbr = (unitName) => {
    const name = String(unitName).toLowerCase();
    if (name.includes("semarang") || name.includes("smg")) return "UPT-SMG";
    if (name.includes("purwokerto") || name.includes("pwt")) return "UPT-PWT";
    if (name.includes("surakarta") || name.includes("solo") || name.includes("skt")) return "UPT-SKT";
    if (name.includes("salatiga") || name.includes("slg")) return "UPT-SLG";
    return "UPT-SMG";
  };
  const uptAbbr = getUptAbbr(unitUpt);

  // 4. Month (e.g. VII)
  const dateForMonth = sub.tanggalPengajuan || sub.tanggalLembur || sub.tanggalMulai || sub.tanggalBerangkat || sub.created_at || sub.createdAt;
  const getRomanMonth = (dateStr) => {
    if (!dateStr) return "VII";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "VII";
    const months = [
      "I", "II", "III", "IV", "V", "VI",
      "VII", "VIII", "IX", "X", "XI", "XII"
    ];
    return months[date.getMonth()];
  };
  const monthName = getRomanMonth(dateForMonth);

  // 5. Year
  let yearStr = String(new Date().getFullYear());
  if (dateForMonth) {
    const d = new Date(dateForMonth);
    if (!isNaN(d.getTime())) {
      yearStr = String(d.getFullYear());
    }
  }

  return `${seqStr}/${typeAbbr}/${uptAbbr}/PLN-ES/${monthName}/${yearStr}`;
}
