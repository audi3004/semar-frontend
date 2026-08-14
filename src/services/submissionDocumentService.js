import { api } from "./api";
import { withWorkflowApprovalIdentities } from "../utils/workflowSubmissionMapper";

const LOG_LOADERS = {
  lembur: api.getLemburLogs,
  cuti: api.getCutiLogs,
  ijin: api.getIjinLogs,
  sakit: api.getSakitLogs,
  sppd: api.getSppdLogs
};

export const loadSubmissionDocumentData = async (submission) => {
  if (!submission) return submission;

  const loadLogs = LOG_LOADERS[String(submission.type || "").toLowerCase()];
  const transactionId = submission.id ?? submission.id_lembur ?? submission.id_cuti ??
    submission.id_ijin ?? submission.id_sakit ?? submission.id_sppd;

  if (!loadLogs || transactionId === undefined || transactionId === null) {
    return submission;
  }

  try {
    const logs = await loadLogs(transactionId);
    return Array.isArray(logs)
      ? withWorkflowApprovalIdentities(submission, logs)
      : submission;
  } catch (error) {
    console.error("Failed to load approval identities for document:", error);
    return submission;
  }
};
