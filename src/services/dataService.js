import {
  INITIAL_SUBMISSIONS,
  INITIAL_SETTINGS,
  INITIAL_NOTIFICATIONS,
  INITIAL_ATTENDANCE
} from "../master/initialData";
import { AuthService } from "./authService";
import { formatDateIndonesian } from "../utils/formatters";
import { toast } from "../utils/toast";
const SUBMISSIONS_KEY = "epresensi_submissions";
const SETTINGS_KEY = "epresensi_settings";
const NOTIFICATIONS_KEY = "epresensi_notifications";
const ATTENDANCE_KEY = "epresensi_attendance";
export class DataService {
  /**
   * Helper to check if any active user/employee is assigned to the verification role.
   * If empty or unassigned, workflow transitions directly from checker to approval 1.
   */
  static isVerificationAssigned() {
    try {
      const users = AuthService.getUsers() || [];
      return users.some(
        (u) => u && (u.role === "verification" || u.role === "verifikasi") && u.status !== "inactive"
      );
    } catch {
      return false;
    }
  }

  // --- SUBMISSIONS CRUD ---
  static getSubmissions() {
    const stored = localStorage.getItem(SUBMISSIONS_KEY);
    if (!stored) {
      localStorage.setItem(SUBMISSIONS_KEY, JSON.stringify(INITIAL_SUBMISSIONS));
      return INITIAL_SUBMISSIONS;
    }
    try {
      const parsed = JSON.parse(stored);
      // Clean up static legacy test mock items (sub-1, sub-2, etc.) if present
      const isLegacyMockId = (id) => ["sub-1", "sub-2", "sub-3", "sub-4", "sub-5"].includes(String(id));
      if (Array.isArray(parsed) && parsed.some((s) => isLegacyMockId(s?.id))) {
        const cleaned = parsed.filter((s) => !isLegacyMockId(s?.id));
        localStorage.setItem(SUBMISSIONS_KEY, JSON.stringify(cleaned));
        return cleaned;
      }
      return parsed;
    } catch {
      return INITIAL_SUBMISSIONS;
    }
  }
  static saveSubmissions(submissions) {
    try {
      localStorage.setItem(SUBMISSIONS_KEY, JSON.stringify(submissions));
    } catch (err) {
      console.warn("Storage quota exceeded when saving submissions, auto-pruning non-essential cache...", err);
      this.pruneOldNotifications();
      try {
        localStorage.removeItem("epresensi_report_signatories");
      } catch (e) {}

      // Try saving again
      try {
        localStorage.setItem(SUBMISSIONS_KEY, JSON.stringify(submissions));
      } catch (retryErr) {
        // Strip heavy base64 data URLs on older historical submissions to free space
        try {
          const trimmed = submissions.map((sub, idx) => {
            if (idx < Math.max(0, submissions.length - 5)) {
              return {
                ...sub,
                suratDokterUrl: (sub.suratDokterUrl && sub.suratDokterUrl.length > 200) ? undefined : sub.suratDokterUrl,
                attachmentUrl: (sub.attachmentUrl && sub.attachmentUrl.length > 200) ? undefined : sub.attachmentUrl,
                makerSignatureUrl: (sub.makerSignatureUrl && sub.makerSignatureUrl.length > 500) ? undefined : sub.makerSignatureUrl
              };
            }
            return sub;
          });
          localStorage.setItem(SUBMISSIONS_KEY, JSON.stringify(trimmed));
        } catch (finalErr) {
          console.error("Local storage quota completely full:", finalErr);
          toast.error("Penyimpanan lokal browser penuh. Mohon kurangi ukuran file lampiran.");
        }
      }
    }
  }

  static pruneOldNotifications() {
    try {
      const stored = localStorage.getItem(NOTIFICATIONS_KEY);
      if (stored) {
        const notifs = JSON.parse(stored);
        if (Array.isArray(notifs) && notifs.length > 5) {
          const pruned = notifs.slice(0, 5);
          localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(pruned));
        }
      }
    } catch (e) {
      // ignore
    }
  }
  static getSubmissionById(id) {
    return this.getSubmissions().find((s) => s.id === id);
  }

  /**
   * Checks if the employee already has an active (non-rejected/non-cancelled) submission
   * that overlaps with the requested date range.
   */
  static checkActiveSubmissionOverlap(employeeNip, startDateStr, endDateStr, excludeSubmissionId = null) {
    if (!employeeNip || !startDateStr) return { isOverlapping: false };

    const submissions = this.getSubmissions();
    const cleanStartStr = String(startDateStr).split("T")[0];
    const cleanEndStr = endDateStr ? String(endDateStr).split("T")[0] : cleanStartStr;

    const targetStart = new Date(cleanStartStr + "T00:00:00");
    const targetEnd = new Date(cleanEndStr + "T23:59:59");

    for (const sub of submissions) {
      if (excludeSubmissionId && sub.id === excludeSubmissionId) continue;
      if (sub.employeeNip !== employeeNip) continue;

      const statusUpper = (sub.status || "").toUpperCase();
      if (statusUpper.includes("REJECT") || statusUpper.includes("DITOLAK") || statusUpper.includes("CANCEL") || statusUpper.includes("BATAL")) {
        continue;
      }

      let subStartRaw = sub.tanggalMulai || sub.tanggalLembur || sub.tanggalBerangkat || sub.tanggalPengajuan;
      let subEndRaw = sub.tanggalSelesai || sub.tanggalKembali || sub.tanggalLembur || sub.tanggalMulai || sub.tanggalPengajuan;

      if (!subStartRaw) continue;

      const subStartClean = String(subStartRaw).split("T")[0];
      const subEndClean = subEndRaw ? String(subEndRaw).split("T")[0] : subStartClean;

      const subStart = new Date(subStartClean + "T00:00:00");
      const subEnd = new Date(subEndClean + "T23:59:59");

      if (isNaN(subStart.getTime()) || isNaN(subEnd.getTime())) continue;

      // Overlap check: targetStart <= subEnd AND targetEnd >= subStart
      if (targetStart <= subEnd && targetEnd >= subStart) {
        const typeLabel = (sub.type || "pengajuan").toUpperCase();
        const isApproved = statusUpper === "APPROVED";
        const statusLabel = isApproved ? "Approved 3 (Selesai)" : "Dalam Proses Approval / Aktif";
        const periodeText = subStartClean === subEndClean 
          ? formatDateIndonesian(subStartClean) 
          : `${formatDateIndonesian(subStartClean)} s/d ${formatDateIndonesian(subEndClean)}`;

        return {
          isOverlapping: true,
          activeSubmission: sub,
          message: `Pengajuan Baru Ditolak! Anda sudah memiliki pengajuan ${typeLabel} yang masih AKTIF (${sub.nomorDokumen}) pada tanggal ${periodeText} dengan status "${statusLabel}". Mohon periksa kembali jadwal permohonan Anda.`
        };
      }
    }

    return { isOverlapping: false };
  }

  static createSubmission(submission, makerUser) {
    const submissions = this.getSubmissions();
    submissions.unshift(submission);
    this.saveSubmissions(submissions);
    const isDraft = submission.status === "draft";
    this.pushNotification({
      id: "notif-" + Date.now(),
      submissionId: submission.id,
      submissionType: submission.type,
      title: isDraft ? `Draft ${submission.type.toUpperCase()} Disimpan` : `Pengajuan ${submission.type.toUpperCase()} Baru`,
      message: isDraft
        ? `Draft pengajuan ${submission.type.toUpperCase()} (${submission.nomorDokumen}) berhasil disimpan.`
        : `${makerUser.name} (${makerUser.nip}) telah mengajukan ${submission.type.toUpperCase()} (${submission.keterangan}). Menunggu review TL PLN (Checker).`,
      actorName: makerUser.name,
      actorRole: "maker",
      timestamp: new Date().toLocaleString("id-ID"),
      isRead: false,
      targetRoles: isDraft ? ["maker"] : ["checker", "admin"],
      targetNip: isDraft ? makerUser.nip : undefined
    });
    if (isDraft) {
      toast.success(`Draft pengajuan ${submission.type.toUpperCase()} berhasil disimpan!`);
    } else {
      toast.success(`Pengajuan ${submission.type.toUpperCase()} baru berhasil dikirim!`);
    }
    return submission;
  }
  static saveDraft(submission, makerUser) {
    const submissions = this.getSubmissions();
    const index = submissions.findIndex((s) => s.id === submission.id);
    const draftSub = {
      ...submission,
      status: "draft",
      currentApproverRole: "maker"
    };
    if (index >= 0) {
      submissions[index] = draftSub;
    } else {
      submissions.unshift(draftSub);
    }
    this.saveSubmissions(submissions);
    this.pushNotification({
      id: "notif-" + Date.now(),
      submissionId: draftSub.id,
      submissionType: draftSub.type,
      title: `Draft ${draftSub.type.toUpperCase()} Disimpan`,
      message: `Draft pengajuan ${draftSub.type.toUpperCase()} (${draftSub.nomorDokumen || draftSub.id}) telah berhasil disimpan. Anda dapat memperbarui atau mengirim pengajuan kapan saja.`,
      actorName: makerUser.name,
      actorRole: "maker",
      timestamp: new Date().toLocaleString("id-ID"),
      isRead: false,
      targetRoles: ["maker"],
      targetNip: makerUser.nip
    });
    toast.success(`Draft pengajuan ${draftSub.type.toUpperCase()} berhasil disimpan!`);
    return draftSub;
  }
  /**
   * Save draft correction for Checker (TL PLN) before approving
   */
  static saveCheckerDraftCorrection(submissionId, jumlahJamKoreksi, catatanKoreksi, checkerUser, estimasiBiayaRupiah = null) {
    const submissions = this.getSubmissions();
    const index = submissions.findIndex((s) => s.id === submissionId);
    if (index === -1) throw new Error("Pengajuan tidak ditemukan");

    const sub = { ...submissions[index] };
    const numCorr = Number(jumlahJamKoreksi);
    sub.jumlahJamKoreksi = isNaN(numCorr) ? sub.durasiJam : numCorr;
    sub.catatanKoreksi = catatanKoreksi || "";
    sub.checkerDraftCorrection = true;
    sub.checkerDraftByNip = checkerUser.nip;
    sub.checkerDraftByName = checkerUser.name;
    sub.checkerDraftSavedAt = new Date().toLocaleString("id-ID");
    if (estimasiBiayaRupiah !== null && estimasiBiayaRupiah !== undefined) {
      sub.estimasiBiayaRupiah = estimasiBiayaRupiah;
    }

    submissions[index] = sub;
    this.saveSubmissions(submissions);

    this.pushNotification({
      id: "notif-" + Date.now(),
      submissionId: sub.id,
      submissionType: sub.type,
      title: `Draft Koreksi Lembur Disimpan`,
      message: `${checkerUser.name} (TL PLN Checker) menyimpan draft koreksi jam lembur (${sub.jumlahJamKoreksi} Jam) untuk dokumen ${sub.nomorDokumen}.`,
      actorName: checkerUser.name,
      actorRole: "checker",
      timestamp: sub.checkerDraftSavedAt,
      isRead: false,
      targetRoles: ["checker", "admin"],
      targetNip: checkerUser.nip
    });
    toast.success("Draft koreksi lembur berhasil disimpan!");
    return sub;
  }

  /**
   * Save direct field correction for Checker (TL PLN) for any type of submission
   */
  static saveCheckerDirectCorrection(submissionId, updatedFields, checkerUser) {
    const submissions = this.getSubmissions();
    const index = submissions.findIndex((s) => s.id === submissionId);
    if (index === -1) throw new Error("Pengajuan tidak ditemukan");

    const sub = { ...submissions[index], ...updatedFields };
    sub.checkerEditedByNip = checkerUser.nip;
    sub.checkerEditedByName = checkerUser.name;
    sub.checkerEditedAt = new Date().toLocaleString("id-ID");
    sub.checkerEdited = true;

    submissions[index] = sub;
    this.saveSubmissions(submissions);

    this.pushNotification({
      id: "notif-" + Date.now(),
      submissionId: sub.id,
      submissionType: sub.type,
      title: `Koreksi ${sub.type.toUpperCase()} oleh Checker`,
      message: `${checkerUser.name} (TL PLN Checker) telah melakukan koreksi langsung pada pengajuan ${sub.nomorDokumen || sub.id}.`,
      actorName: checkerUser.name,
      actorRole: "checker",
      timestamp: sub.checkerEditedAt,
      isRead: false,
      targetRoles: ["checker", "admin", "maker"],
      targetNip: checkerUser.nip
    });
    return sub;
  }

  /**
   * Process 6-Tingkat Approval Action (Approve, Reject, Request Revision)
   */
  static processApproval(submissionId, actionUser, action, signatureUrl, notes, extraData = {}) {
    const submissions = this.getSubmissions();
    const index = submissions.findIndex((s) => s.id === submissionId);
    if (index === -1) throw new Error("Pengajuan tidak ditemukan");
    const sub = { ...submissions[index], ...(extraData || {}) };

    // RBAC Security Guard: Verify that actionUser is authorized for the current approval stage or is admin
    if (actionUser.role !== "admin" && sub.currentApproverRole && sub.currentApproverRole !== actionUser.role) {
      throw new Error(`Akses Ditolak: Peran Anda (${actionUser.role}) tidak berhak memproses persetujuan untuk tahap ini (${sub.currentApproverRole}).`);
    }

    const effectiveRole =
      (actionUser.role === "admin" || actionUser.role === "superadmin") && sub.currentApproverRole
        ? sub.currentApproverRole
        : actionUser.role;
    const nowStr = (/* @__PURE__ */ new Date()).toLocaleString("id-ID");

    // Clear draft flag when finalized approval action occurs
    if (action === "approve") {
      sub.checkerDraftCorrection = false;
    }
    const roleLabels = {
      checker: "TL PLN (Checker)",
      verification: "AMN PLN (Verifikasi)",
      approved1: "MAN PLN (Approval 1)",
      approved2: "TL ES (Approval 2)",
      approved3: "AMN ES (Approval 3)"
    };

    if (!sub.approvalSteps) {
      sub.approvalSteps = [
        { role: "checker", name: "TL PLN (Checker)", roleLabel: "TL PLN (Checker)", status: "pending" },
        { role: "verification", name: "AMN PLN (Verifikasi)", roleLabel: "AMN PLN (Verifikasi)", status: "pending" },
        { role: "approved1", name: "MAN PLN (Approval 1)", roleLabel: "MAN PLN (Approval 1)", status: "pending" },
        { role: "approved2", name: "TL ES (Approval 2)", roleLabel: "TL ES (Approval 2)", status: "pending" },
        { role: "approved3", name: "AMN ES (Approval 3)", roleLabel: "AMN ES (Approval 3)", status: "pending" }
      ];
    }

    const finalSigUrl = signatureUrl || actionUser.signatureUrl || actionUser.signature || "";

    const stepIndex = sub.approvalSteps.findIndex((st) => st.role === effectiveRole);
    if (stepIndex >= 0) {
      const existingStep = sub.approvalSteps[stepIndex];
      sub.approvalSteps[stepIndex] = {
        ...existingStep,
        status: action === "approve" ? "approved" : action === "reject" ? "rejected" : "pending",
        actionByName: actionUser.name || actionUser.nama || "",
        actionByNip: actionUser.nip || actionUser.nipNik || "",
        actionByRole: actionUser.role || "",
        actionByJabatan: actionUser.jabatan || roleLabels[effectiveRole] || "",
        roleLabel: existingStep.roleLabel || roleLabels[effectiveRole] || effectiveRole,
        actionDate: nowStr,
        notes: notes || "",
        signatureUrl: finalSigUrl || existingStep.signatureUrl || ""
      };
    }

    if (action === "approve") {
      if (effectiveRole === "checker") {
        sub.checkerSignatureUrl = finalSigUrl || sub.checkerSignatureUrl;
        sub.checkerName = actionUser.name;
        sub.checkerNip = actionUser.nip || actionUser.nipNik || "";
        sub.checkerDate = nowStr;
        sub.checkerJabatan = actionUser.jabatan;
      } else if (effectiveRole === "verification") {
        sub.verificationSignatureUrl = finalSigUrl || sub.verificationSignatureUrl;
        sub.verificationName = actionUser.name;
        sub.verificationNip = actionUser.nip || actionUser.nipNik || "";
        sub.verificationDate = nowStr;
        sub.verificationJabatan = actionUser.jabatan;
      } else if (effectiveRole === "approved1") {
        sub.approved1SignatureUrl = finalSigUrl || sub.approved1SignatureUrl;
        sub.approved1Name = actionUser.name;
        sub.approved1Nip = actionUser.nip || actionUser.nipNik || "";
        sub.approved1Date = nowStr;
        sub.approved1Jabatan = actionUser.jabatan;
      } else if (effectiveRole === "approved2") {
        sub.approved2SignatureUrl = finalSigUrl || sub.approved2SignatureUrl;
        sub.approved2Name = actionUser.name;
        sub.approved2Nip = actionUser.nip || actionUser.nipNik || "";
        sub.approved2Date = nowStr;
        sub.approved2Jabatan = actionUser.jabatan;
      } else if (effectiveRole === "approved3") {
        sub.approved3SignatureUrl = finalSigUrl || sub.approved3SignatureUrl;
        sub.approved3Name = actionUser.name;
        sub.approved3Nip = actionUser.nip || actionUser.nipNik || "";
        sub.approved3Date = nowStr;
        sub.approved3Jabatan = actionUser.jabatan;
      }
    }
    if (action === "reject") {
      sub.status = "REJECTED";
      sub.currentApproverRole = null; // Permanently terminated, no current approver
      sub.rejectionReason = notes || "Ditolak oleh " + actionUser.name;
      sub.revisionNote = null;
      sub.revisedByRole = actionUser.role;
      sub.revisedByName = actionUser.name;
      this.pushNotification({
        id: "notif-" + Date.now(),
        submissionId: sub.id,
        submissionType: sub.type,
        title: `Pengajuan ${sub.type.toUpperCase()} Ditolak (Proses Dibatalkan)`,
        message: `Pengajuan ${sub.nomorDokumen} telah DITOLAK oleh ${actionUser.name} (${actionUser.jabatan}). Seluruh proses pengajuan dibatalkan secara permanen. Catatan: ${notes || "-"}`,
        actorName: actionUser.name,
        actorRole: actionUser.role,
        timestamp: nowStr,
        isRead: false,
        targetRoles: ["maker", "admin"],
        targetNip: sub.employeeNip
      });
    } else if (action === "revision") {
      let targetRole = "maker";
      if (typeof extraData === "string") {
        targetRole = extraData;
      } else if (extraData && typeof extraData === "object") {
        targetRole = extraData.targetRevisionRole || extraData.targetRole || "maker";
      }
      sub.status = "REVISION_REQUIRED";
      sub.currentApproverRole = targetRole;
      sub.revisionNote = notes || "Perbaikan diminta oleh " + actionUser.name;
      sub.rejectionReason = null;
      sub.revisedByRole = actionUser.role;
      sub.revisedByName = actionUser.name;

      const roleLabelMap = {
        maker: "Pembuat / Pegawai (Maker)",
        checker: "TL PLN (Checker)",
        verification: "AMN PLN (Verifikasi)",
        approved1: "MAN PLN (Approved 1)",
        approved2: "TL ES (Approved 2)",
        approved3: "AMN ES (Approved 3)"
      };

      this.pushNotification({
        id: "notif-" + Date.now(),
        submissionId: sub.id,
        submissionType: sub.type,
        title: `Pengajuan ${sub.type.toUpperCase()} Perlu Revisi / Perbaikan`,
        message: `Pengajuan ${sub.nomorDokumen} dikembalikan untuk revisi oleh ${actionUser.name} kepada ${roleLabelMap[targetRole] || targetRole}. Catatan: ${notes || "-"}`,
        actorName: actionUser.name,
        actorRole: actionUser.role,
        timestamp: nowStr,
        isRead: false,
        targetRoles: [targetRole, "maker", "admin"],
        targetNip: targetRole === "maker" ? sub.employeeNip : undefined
      });
    } else if (action === "approve") {
      switch (effectiveRole) {
        case "checker": {
          const hasVerification = this.isVerificationAssigned();
          if (hasVerification) {
            sub.status = "PENDING_VERIFICATION";
            sub.currentApproverRole = "verification";
            this.notifyNextApprover(sub, actionUser, "verification", "AMN PLN (Verifikasi)");
          } else {
            // Unassigned verification role -> bypass directly to Approval 1
            sub.status = "PENDING_APP_1";
            sub.currentApproverRole = "approved1";
            if (sub.approvalSteps) {
              const verIndex = sub.approvalSteps.findIndex((st) => st.role === "verification");
              if (verIndex >= 0) {
                sub.approvalSteps[verIndex] = {
                  ...sub.approvalSteps[verIndex],
                  status: "skipped",
                  notes: "Dilewati (Tidak ada pegawai di role Verifikasi)",
                  actionByName: "-",
                  actionDate: nowStr
                };
              }
            }
            this.notifyNextApprover(sub, actionUser, "approved1", "MAN PLN (Approved 1)");
          }
          break;
        }
        case "verification":
          sub.status = "PENDING_APP_1";
          sub.currentApproverRole = "approved1";
          this.notifyNextApprover(sub, actionUser, "approved1", "MAN PLN (Approved 1)");
          break;
        case "approved1":
          sub.status = "PENDING_APP_2";
          sub.currentApproverRole = "approved2";
          this.notifyNextApprover(sub, actionUser, "approved2", "TL ES (Approved 2)");
          break;
        case "approved2":
          sub.status = "PENDING_APP_3";
          sub.currentApproverRole = "approved3";
          this.notifyNextApprover(sub, actionUser, "approved3", "AMN ES (Approved 3)");
          break;
        case "approved3":
          sub.status = "APPROVED";
          sub.currentApproverRole = null;
          this.pushNotification({
            id: "notif-" + Date.now(),
            submissionId: sub.id,
            submissionType: sub.type,
            title: `Pengajuan ${sub.type.toUpperCase()} DISETUJUI SELESAI`,
            message: `Pengajuan ${sub.nomorDokumen} oleh ${sub.employeeName} telah DISETUJUI SEPENUHNYA hingga tingkat AMN ES. Dokumen resmi siap diunduh!`,
            actorName: actionUser.name,
            actorRole: actionUser.role,
            timestamp: nowStr,
            isRead: false,
            targetRoles: ["maker", "admin", "checker", "verification", "approved1", "approved2", "approved3"],
            targetNip: sub.employeeNip
          });
          break;
        case "admin":
          // Admin approving at top-level / final stage or fallback
          sub.status = "APPROVED";
          sub.currentApproverRole = null;
          this.pushNotification({
            id: "notif-" + Date.now(),
            submissionId: sub.id,
            submissionType: sub.type,
            title: `Pengajuan ${sub.type.toUpperCase()} DISETUJUI SELESAI`,
            message: `Pengajuan ${sub.nomorDokumen} oleh ${sub.employeeName} telah DISETUJUI SEPENUHNYA oleh Administrator. Dokumen resmi siap diunduh!`,
            actorName: actionUser.name,
            actorRole: actionUser.role,
            timestamp: nowStr,
            isRead: false,
            targetRoles: ["maker", "admin", "checker", "verification", "approved1", "approved2", "approved3"],
            targetNip: sub.employeeNip
          });
          break;
      }
    }
    submissions[index] = sub;
    this.saveSubmissions(submissions);
    if (action === "approve") {
      const nextRoleLabelMap = {
        verification: "AMN PLN (Verifikasi)",
        approved1: "MAN PLN (Approved 1)",
        approved2: "TL ES (Approved 2)",
        approved3: "AMN ES (Approved 3)"
      };

      if (sub.status === "APPROVED") {
        toast.success(`🎉 PROSES SELESAI! Dokumen ${sub.nomorDokumen || "Pengajuan"} telah disetujui sepenuhnya oleh AMN ES (Approved 3).`, {
          duration: 6000
        });
      } else {
        const nextRoleTitle = nextRoleLabelMap[sub.currentApproverRole] || sub.currentApproverRole;
        toast.success(`✅ Persetujuan Berhasil! Lanjut Kirim ke role berikutnya: ${nextRoleTitle}.`, {
          duration: 5000
        });
      }
    } else if (action === "reject") {
      toast.error(`Dokumen ${sub.nomorDokumen || "Pengajuan"} telah ditolak.`);
    } else if (action === "revision") {
      toast.warning(`Permintaan revisi dokumen ${sub.nomorDokumen || "Pengajuan"} berhasil dikirim.`);
    }
    return sub;
  }
  /**
   * Save / Update Draft or Revised Submission without advancing approval status
   */
  static updateDraftSubmission(submissionId, updatedFields, user) {
    const submissions = this.getSubmissions();
    const index = submissions.findIndex((s) => s.id === submissionId);
    if (index === -1) throw new Error("Pengajuan tidak ditemukan");
    const existing = submissions[index];
    const updated = {
      ...existing,
      ...updatedFields,
      updatedAt: new Date().toLocaleString("id-ID")
    };
    submissions[index] = updated;
    this.saveSubmissions(submissions);
    this.pushNotification({
      id: "notif-" + Date.now(),
      submissionId: updated.id,
      submissionType: updated.type,
      title: `Draft Pengajuan ${updated.type.toUpperCase()} Diperbarui`,
      message: `Draft / revisi pengajuan ${updated.type.toUpperCase()} (${updated.nomorDokumen || updated.id}) telah berhasil diperbarui dan disimpan.`,
      actorName: user?.name || "User",
      actorRole: user?.role || "maker",
      timestamp: new Date().toLocaleString("id-ID"),
      isRead: false,
      targetRoles: [user?.role || "maker", "admin"],
      targetNip: user?.nip
    });
    toast.success(`Draft pengajuan ${updated.type.toUpperCase()} berhasil diperbarui!`);
    return updated;
  }

  /**
   * Resubmit a rejected or revised submission back into the approval workflow
   */
  static resubmitSubmission(submissionId, updatedFields, user) {
    const submissions = this.getSubmissions();
    const index = submissions.findIndex((s) => s.id === submissionId);
    if (index === -1) throw new Error("Pengajuan tidak ditemukan");
    const nowStr = new Date().toLocaleString("id-ID");
    const existing = submissions[index];

    let nextStatus = "PENDING_CHECKER";
    let nextRole = "checker";
    let nextRoleLabel = "TL PLN (Checker)";

    const currentRole = existing.currentApproverRole || "maker";
    if (currentRole === "checker") {
      const hasVerification = this.isVerificationAssigned();
      if (hasVerification) {
        nextStatus = "PENDING_VERIFICATION";
        nextRole = "verification";
        nextRoleLabel = "AMN PLN (Verifikasi)";
      } else {
        nextStatus = "PENDING_APP_1";
        nextRole = "approved1";
        nextRoleLabel = "MAN PLN (Approved 1)";
      }
    } else if (currentRole === "verification") {
      nextStatus = "PENDING_APP_1";
      nextRole = "approved1";
      nextRoleLabel = "MAN PLN (Approved 1)";
    } else if (currentRole === "approved1") {
      nextStatus = "PENDING_APP_2";
      nextRole = "approved2";
      nextRoleLabel = "TL ES (Approved 2)";
    } else if (currentRole === "approved2") {
      nextStatus = "PENDING_APP_3";
      nextRole = "approved3";
      nextRoleLabel = "AMN ES (Approved 3)";
    } else {
      nextStatus = "PENDING_CHECKER";
      nextRole = "checker";
      nextRoleLabel = "TL PLN (Checker)";
    }

    const roleOrder = ["checker", "verification", "approved1", "approved2", "approved3"];
    const startResetIdx = roleOrder.indexOf(nextRole);

    const resetSteps = (existing.approvalSteps || []).map((step) => {
      const stepIdx = roleOrder.indexOf(step.role);
      if (stepIdx >= startResetIdx) {
        return {
          ...step,
          status: "pending",
          notes: void 0,
          actionDate: void 0,
          actionByName: void 0,
          actionByNip: void 0,
          signatureUrl: void 0
        };
      }
      return step;
    });

    const resubmitted = {
      ...existing,
      ...updatedFields,
      status: nextStatus,
      currentApproverRole: nextRole,
      rejectionReason: void 0,
      revisionNote: void 0,
      revisedByRole: void 0,
      revisedByName: void 0,
      approvalSteps: resetSteps,
      updatedAt: nowStr
    };

    submissions[index] = resubmitted;
    this.saveSubmissions(submissions);

    this.pushNotification({
      id: "notif-" + Date.now(),
      submissionId: resubmitted.id,
      submissionType: resubmitted.type,
      title: `Pengajuan ${resubmitted.type.toUpperCase()} Diajukan Ulang`,
      message: `${user.name} (${user.nip || user.jabatan}) telah memperbarui & mengajukan ulang ${resubmitted.type.toUpperCase()} #${resubmitted.nomorDokumen}. Selanjutnya dikirim ke ${nextRoleLabel}.`,
      actorName: user.name,
      actorRole: user.role,
      timestamp: nowStr,
      isRead: false,
      targetRoles: [nextRole, "maker", "admin"],
      targetNip: void 0
    });
    toast.success(`Pengajuan ${resubmitted.type.toUpperCase()} berhasil diajukan ulang ke ${nextRoleLabel}!`);
    return resubmitted;
  }
  static notifyNextApprover(sub, actor, nextRole, nextRoleTitle) {
    this.pushNotification({
      id: "notif-" + Date.now(),
      submissionId: sub.id,
      submissionType: sub.type,
      title: `Persetujuan ${actor.jabatan} Selesai`,
      message: `${actor.name} menyetujui pengajuan ${sub.type.toUpperCase()} #${sub.nomorDokumen}. Selanjutnya memerlukan persetujuan ${nextRoleTitle}.`,
      actorName: actor.name,
      actorRole: actor.role,
      timestamp: (/* @__PURE__ */ new Date()).toLocaleString("id-ID"),
      isRead: false,
      targetRoles: [nextRole, "admin", "maker"],
      targetNip: void 0
    });
  }
  static cancelSubmission(id, currentUser = null, reason = "Transaksi Dibatalkan") {
    const sub = this.getSubmissionById(id);
    if (!sub) return null;
    if (currentUser) {
      const isOwner = sub.employeeNip === currentUser.nip;
      const isAdmin = currentUser.role === "admin";
      const isMaker = currentUser.role === "maker" || isOwner;
      if (!isOwner && !isAdmin && !isMaker) {
        const errMsg = "Akses Ditolak: Anda hanya dapat membatalkan pengajuan milik Anda sendiri.";
        toast.error(errMsg);
        throw new Error(errMsg);
      }
    }
    const submissions = this.getSubmissions();
    const nowStr = new Date().toLocaleString("id-ID");
    const updated = submissions.map((s) => {
      if (s.id === id) {
        return {
          ...s,
          status: "dibatalkan",
          currentApproverRole: null,
          rejectionReason: reason || "Transaksi Dibatalkan",
          rejectionNote: reason || "Transaksi Dibatalkan",
          cancellationNote: reason || "Transaksi Dibatalkan",
          keteranganTransaksi: reason || "Transaksi Dibatalkan",
          cancelledAt: nowStr,
          cancelledBy: currentUser ? currentUser.name : "Maker",
          updatedAt: new Date().toISOString()
        };
      }
      return s;
    });
    this.saveSubmissions(updated);
    this.pushNotification({
      id: "notif-" + Date.now(),
      submissionId: sub.id,
      submissionType: sub.type,
      title: `Draft / Pengajuan Dibatalkan`,
      message: `Pengajuan ${sub.type ? sub.type.toUpperCase() : "FORM"} #${sub.nomorDokumen || sub.id} telah dibatalkan oleh ${currentUser ? currentUser.name : "Maker"}. Status transaksi dibatalkan (Readonly).`,
      actorName: currentUser ? currentUser.name : "Maker",
      actorRole: currentUser ? currentUser.role : "maker",
      timestamp: nowStr,
      isRead: false,
      targetRoles: ["maker", "admin"],
      targetNip: sub.employeeNip
    });
    toast.info("Status pengajuan diubah menjadi Dibatalkan (Readonly).");
    return updated.find((s) => s.id === id);
  }

  static deleteSubmission(id, currentUser = null) {
    const sub = this.getSubmissionById(id);
    if (!sub) return;
    if (currentUser) {
      const isOwner = sub.employeeNip === currentUser.nip;
      const isAdmin = currentUser.role === "admin";
      const isDraft = sub.status === "draft";
      if (!isOwner && !isAdmin) {
        const errMsg = "Akses Ditolak: Anda hanya dapat menghapus draf pengajuan milik Anda sendiri.";
        toast.error(errMsg);
        throw new Error(errMsg);
      }
      if (!isDraft && !isAdmin) {
        const errMsg = "Akses Ditolak: Dokumen pengajuan yang telah berjalan dalam rantai workflow tidak dapat dihapus.";
        toast.error(errMsg);
        throw new Error(errMsg);
      }
    }
    const submissions = this.getSubmissions().filter((s) => s.id !== id);
    this.saveSubmissions(submissions);
    toast.success("Pengajuan berhasil dihapus.");
  }
  // --- SETTINGS CRUD ---
  static getSettings() {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (!stored) {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(INITIAL_SETTINGS));
      return INITIAL_SETTINGS;
    }
    try {
      return JSON.parse(stored);
    } catch {
      return INITIAL_SETTINGS;
    }
  }
  static saveSettings(settings) {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }
  // --- NOTIFICATIONS ---
  static getNotifications(userNip) {
    const stored = localStorage.getItem(NOTIFICATIONS_KEY);
    let notifs = [];
    if (!stored) {
      localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(INITIAL_NOTIFICATIONS));
      notifs = INITIAL_NOTIFICATIONS;
    } else {
      try {
        notifs = JSON.parse(stored);
      } catch {
        notifs = INITIAL_NOTIFICATIONS;
      }
    }
    if (userNip) {
      return notifs.filter((n) => !n.targetNip || n.targetNip === userNip);
    }
    return notifs;
  }
  static pushNotification(notif) {
    const notifs = this.getNotifications();
    notifs.unshift(notif);
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifs));
  }
  static markNotificationAsRead(id) {
    const notifs = this.getNotifications();
    const target = notifs.find((n) => n.id === id);
    if (target) {
      target.isRead = true;
      localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifs));
    }
  }
  static markAllNotificationsRead() {
    const notifs = this.getNotifications().map((n) => ({ ...n, isRead: true }));
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifs));
  }
  // --- ATTENDANCE ---
  static getAttendance() {
    const stored = localStorage.getItem(ATTENDANCE_KEY);
    if (!stored) {
      localStorage.setItem(ATTENDANCE_KEY, JSON.stringify(INITIAL_ATTENDANCE));
      return INITIAL_ATTENDANCE;
    }
    try {
      return JSON.parse(stored);
    } catch {
      return INITIAL_ATTENDANCE;
    }
  }
  static recordCheckin(record) {
    const list = this.getAttendance();
    list.unshift(record);
    localStorage.setItem(ATTENDANCE_KEY, JSON.stringify(list));
    return record;
  }
}
