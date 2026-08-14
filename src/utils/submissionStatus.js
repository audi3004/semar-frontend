const ROLE_STATUS = {
  maker: "draft",
  checker: "pending_checker",
  verification: "pending_verification",
  verificator: "pending_verification",
  approved1: "pending_approved1",
  approval1: "pending_approved1",
  approver1: "pending_approved1",
  approved2: "pending_approved2",
  approval2: "pending_approved2",
  approver2: "pending_approved2",
  approved3: "pending_approved3",
  approval3: "pending_approved3",
  approver3: "pending_approved3"
};

const normalize = (value) => String(value || "").trim().toLowerCase().replace(/[^a-z0-9]/g, "");

export const resolveSubmissionStatus = (submission) => {
  if (!submission) return "";
  const statusObject = typeof submission.status === "object" ? submission.status : null;
  const rawStatus = typeof submission.status === "string"
    ? submission.status.toLowerCase()
    : String(statusObject?.kode_status || submission.statusCode || "").toLowerCase();
  const statusCode = String(submission.statusCode || statusObject?.kode_status || rawStatus).toUpperCase();
  const rejected = ["REJECT", "TOLAK", "CANCEL", "BATAL"].some((word) => statusCode.includes(word));
  const finalFlag = submission.isFinal === true || submission.isFinal === "Y" ||
    submission.is_final === "Y" || statusObject?.is_final === "Y";

  if (finalFlag) return rejected ? (statusCode.includes("CANCEL") || statusCode.includes("BATAL") ? "dibatalkan" : "rejected") : "approved";
  if (rejected) return statusCode.includes("CANCEL") || statusCode.includes("BATAL") ? "dibatalkan" : "rejected";

  const role = normalize(submission.currentApproverRole || statusObject?.role?.kode_role);
  if (role && ROLE_STATUS[role]) return ROLE_STATUS[role];
  return rawStatus || "draft";
};

export const isSubmissionFinalApproved = (submission) =>
  resolveSubmissionStatus(submission) === "approved" &&
  (submission?.isFinal === true || submission?.isFinal === "Y" ||
    submission?.is_final === "Y" || submission?.status?.is_final === "Y");
