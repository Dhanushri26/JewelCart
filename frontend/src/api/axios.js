import axios from "axios";
import { fetchAuthSession } from "aws-amplify/auth";

<<<<<<< HEAD
const BASE_URL =
  "https://fpgg90w2y8.execute-api.ap-southeast-1.amazonaws.com";
  
=======
console.log("VITE_API_BASE_URL =", import.meta.env.VITE_API_BASE_URL);

const BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "https://fpgg90w2y8.execute-api.ap-southeast-1.amazonaws.com";

console.log("Using BASE_URL =", BASE_URL);

>>>>>>> a1085ac3f907c76d2adb17501784107a85c1a905
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});
<<<<<<< HEAD

=======
>>>>>>> a1085ac3f907c76d2adb17501784107a85c1a905
/**
 * Decode a JWT payload without verifying the signature.
 * Cognito ID token carries: sub, email, cognito:groups[], etc.
 */
function decodeJwtPayload(token) {
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = atob(base64);
    return JSON.parse(json);
  } catch {
    return {};
  }
}

/**
 * Derive role string from Cognito ID token claims.
 * Uses cognito:groups if present (Admin, Business, Customer).
 * Falls back to "Customer".
 */
function resolveRole(idTokenPayload) {
  const groups = idTokenPayload["cognito:groups"] || [];
  if (groups.includes("Admin")) return "Admin";
  if (groups.includes("Business")) return "Business";
  return "Customer";
}

// ──────────────────────────────────────────────────────────────
// REQUEST INTERCEPTOR — attach Cognito JWT + user context headers
// ──────────────────────────────────────────────────────────────
api.interceptors.request.use(
  async (config) => {
    try {
      const session = await fetchAuthSession();
      const tokens = session.tokens;

      if (!tokens) return config;

      // Access token for API Gateway authorizer
      const accessToken = tokens.accessToken?.toString();
      if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
      }

      // Decode the ID token for user identity claims
      const idTokenStr = tokens.idToken?.toString();
      if (idTokenStr) {
        const payload = decodeJwtPayload(idTokenStr);

        // x-user-id: Cognito sub (UUID uniquely identifying the user)
        const userId = payload.sub || "";
        if (userId) config.headers["x-user-id"] = userId;

        // x-user-role: derived from Cognito groups
        const role = resolveRole(payload);
        config.headers["x-user-role"] = role;

        // x-user-email: email claim
        const email = payload.email || "";
        if (email) config.headers["x-user-email"] = email;

        // x-business-id: if user belongs to a Business group, use sub as
        // businessId placeholder until custom attributes are added.
        if (role === "Business") {
          config.headers["x-business-id"] = payload["custom:businessId"] || userId;
        }
      }
    } catch (err) {
      // Unauthenticated requests proceed without headers
      console.warn("[api] Could not attach auth headers:", err?.message);
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ──────────────────────────────────────────────────────────────
// RESPONSE INTERCEPTOR — unified error logging
// ──────────────────────────────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url;
    const method = error.config?.method?.toUpperCase();

    console.error(`[api] ${method} ${url} → ${status}`, error.response?.data);

    // Propagate so callers can handle individually
    return Promise.reject(error);
  }
);

export default api;