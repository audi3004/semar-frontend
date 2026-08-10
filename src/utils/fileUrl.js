const configuredBase = String(import.meta.env.VITE_API_BASE_URL || "").replace(/\/+$/, "");
const isAbsoluteBase = /^https?:\/\//i.test(configuredBase);

export const resolveBackendFileUrl = (value) => {
  if (!value) return "";
  const raw = String(value).trim();
  if (!raw) return "";
  if (/^(data:|blob:|https?:\/\/)/i.test(raw)) return raw;

  let path = raw.replace(/\\/g, "/");
  if (!path.startsWith("/")) path = `/${path}`;
  if (!path.startsWith("/uploads/") && !path.startsWith("/api/uploads/")) return raw;

  if (isAbsoluteBase) {
    const origin = configuredBase.replace(/\/api$/i, "");
    return `${origin}${path.replace(/^\/api(?=\/uploads)/i, "")}`;
  }

  // Production reverse proxy menggunakan VITE_API_BASE_URL=/api.
  const proxyPrefix = configuredBase || "/api";
  if (path.startsWith("/api/uploads/")) return path;
  return `${proxyPrefix.replace(/\/api$/i, "/api")}${path}`;
};

export const resolveBackendFileFields = (item = {}) => ({
  makerSignatureUrl: resolveBackendFileUrl(item.maker_signature),
  checkerSignatureUrl: resolveBackendFileUrl(item.checker_signature),
  verificationSignatureUrl: resolveBackendFileUrl(item.verification_signature),
  approval1SignatureUrl: resolveBackendFileUrl(item.approval_1_signature),
  approval2SignatureUrl: resolveBackendFileUrl(item.approval_2_signature),
  approval3SignatureUrl: resolveBackendFileUrl(item.approval_3_signature),
});
