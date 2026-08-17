import { api } from "./api";
import {
  mapWorkflowCuti,
  mapWorkflowIjin,
  mapWorkflowLembur,
  mapWorkflowSakit,
  mapWorkflowSppd,
  withWorkflowApprovalIdentities
} from "../utils/workflowSubmissionMapper";

const LOG_LOADERS = {
  lembur: api.getLemburLogs,
  cuti: api.getCutiLogs,
  ijin: api.getIjinLogs,
  sakit: api.getSakitLogs,
  sppd: api.getSppdLogs
};

const DETAIL_LOADERS = {
  lembur: api.getLemburById,
  cuti: api.getCutiById,
  ijin: api.getIjinById,
  sakit: api.getSakitById,
  sppd: api.getSppdById
};

const DOCUMENT_MAPPERS = {
  lembur: mapWorkflowLembur,
  cuti: mapWorkflowCuti,
  ijin: mapWorkflowIjin,
  sakit: mapWorkflowSakit,
  sppd: mapWorkflowSppd
};

export const loadSubmissionDocumentData = async (submission) => {
  if (!submission) return submission;

  const type = String(submission.type || submission.report_type || "").toLowerCase();
  const loadLogs = LOG_LOADERS[type];
  const loadDetail = DETAIL_LOADERS[type];
  const mapDocument = DOCUMENT_MAPPERS[type];
  const transactionId = submission.id ?? submission.id_lembur ?? submission.id_cuti ??
    submission.id_ijin ?? submission.id_sakit ?? submission.id_sppd;

  if ((!loadLogs && !loadDetail) || transactionId === undefined || transactionId === null) {
    return submission;
  }

  const [detailResult, logsResult] = await Promise.allSettled([
    loadDetail ? loadDetail(transactionId) : Promise.resolve(null),
    loadLogs ? loadLogs(transactionId) : Promise.resolve([])
  ]);

  let resolvedSubmission = submission;
  if (detailResult.status === "fulfilled" && detailResult.value && mapDocument) {
    resolvedSubmission = mapDocument(detailResult.value);
  } else if (detailResult.status === "rejected") {
    console.error("Failed to load transaction detail for document:", detailResult.reason);
  }

  const logs = logsResult.status === "fulfilled" && Array.isArray(logsResult.value)
    ? logsResult.value
    : resolvedSubmission.workflowHistory || [];
  if (logsResult.status === "rejected") {
    console.error("Failed to load approval identities for document:", logsResult.reason);
  }

  return withWorkflowApprovalIdentities(resolvedSubmission, logs);
};
