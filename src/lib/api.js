import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const AUTH_TOKEN_KEY = "brandio_auth_token";

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  withCredentials: true,
});

export const getAuthToken = () => localStorage.getItem(AUTH_TOKEN_KEY);

export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
  }
};

export const clearAuthToken = () => {
  localStorage.removeItem(AUTH_TOKEN_KEY);
};

api.interceptors.request.use((config) => {
  const token = getAuthToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else if (config.headers?.Authorization) {
    delete config.headers.Authorization;
  }

  return config;
});

/* ======================
   DEALS
====================== */
export const fetchDeals = async () => {
  const res = await api.get("/deals");
  return res.data;
};

export const fetchDeal = async (dealId) => {
  const res = await api.get(`/deals/${dealId}`);
  return res.data;
};

/* Get signed upload data */
export const getDealUploadSignature = async (dealId) => {
  const res = await api.get(`/deals/${dealId}/upload-signature`);
  return res.data;
};

/* Save image URL in DB */
export const saveDealImage = async (dealId, imageUrl) => {
  const res = await api.post(`/deals/${dealId}/add-image`, {
    imageUrl
  });
  return res.data;
};


export const fetchAnalytics = () => api.get("/analytics");

export const fetchIntelligence = async () => {
  const res = await api.get("/intelligence");
  return res.data;
};

/* AI-written brief over the creator's own intelligence payload.
   Falls back to a rules-based brief when no OpenAI key is set. */
export const fetchAiBrief = async () => {
  const res = await api.get("/intelligence/brief");
  return res.data;
};

export const fetchRoi = async () => {
  const res = await api.get("/roi");
  return res.data;
};

export const fetchCreatorWorkPage = async (username) => {
  const res = await api.get(`/inbound/public/${username}`);
  return res.data;
};

export const submitInboundInquiry = async (username, payload) => {
  const res = await api.post(`/inbound/public/${username}`, payload);
  return res.data;
};

export const fetchInboundInquiries = async (filter) => {
  const res = await api.get("/inbound", {
    params: filter && filter !== "all" ? { filter } : {}
  });
  return res.data;
};

export const updateInboundInquiry = async (inquiryId, payload) => {
  const res = await api.patch(`/inbound/${inquiryId}`, payload);
  return res.data;
};

export const fetchNotifications = async (params) => {
  const res = await api.get("/notifications", { params });
  return res.data;
};

export const fetchNotificationUnreadCount = async () => {
  const res = await api.get("/notifications/unread-count");
  return res.data;
};

export const markNotificationRead = async (notificationId) => {
  const res = await api.patch(`/notifications/${notificationId}/read`);
  return res.data;
};

export const markAllNotificationsRead = async () => {
  const res = await api.patch("/notifications/read-all");
  return res.data;
};

export const fetchPublicMediaKit = async (username) => {
  const res = await api.get(`/media-kit/public/${username}`);
  return res.data;
};

export const fetchMediaKit = async () => {
  const res = await api.get("/media-kit");
  return res.data;
};

export const updateMediaKit = async (payload) => {
  const res = await api.put("/media-kit", payload);
  return res.data;
};

export const fetchMoneyCockpit = async () => {
  const res = await api.get("/money");
  return res.data;
};

export const updateMoneySettings = async (payload) => {
  const res = await api.put("/money/settings", payload);
  return res.data;
};

export const fetchBrandRelationships = async () => {
  const res = await api.get("/brands");
  return res.data;
};

export const calculateRateQuote = async (payload) => {
  const res = await api.post("/rate/calculate", payload);
  return res.data;
};

export const saveRateQuote = async (payload) => {
  const res = await api.post("/rate/quotes", payload);
  return res.data;
};

export const fetchRateQuotes = async () => {
  const res = await api.get("/rate/quotes");
  return res.data;
};

export const analyzeDealTerms = async (text) => {
  const res = await api.post("/deal-analyzer/analyze", { text });
  return res.data;
};

export const extractDealAnalyzerFile = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  const res = await api.post("/deal-analyzer/extract-file", formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });
  return res.data;
};

export const updateDeal = async (dealId, payload) => {
  const res = await api.put(`/deals/${dealId}`, payload);
  return res.data;
};

export const fetchDeliverables = async (filter) => {
  const res = await api.get("/deliverables", {
    params: filter && filter !== "all" ? { filter } : {}
  });
  return res.data;
};

export const fetchDealDeliverables = async (dealId) => {
  const res = await api.get(`/deliverables/deal/${dealId}`);
  return res.data;
};

export const createDeliverable = async (dealId, payload) => {
  const res = await api.post(`/deliverables/deal/${dealId}`, payload);
  return res.data;
};

export const updateDeliverable = async (deliverableId, payload) => {
  const res = await api.put(`/deliverables/${deliverableId}`, payload);
  return res.data;
};

export const deleteDeliverable = async (deliverableId) => {
  const res = await api.delete(`/deliverables/${deliverableId}`);
  return res.data;
};

export const exportAnalyticsCSV = async () => {
  const res = await api.get("/analytics/export", {
    responseType: "blob", // 🔥 IMPORTANT
  });

  const blob = new Blob([res.data], {
    type: "text/csv",
  });

  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "brandio-analytics.csv";

  document.body.appendChild(link);
  link.click();

  link.remove();
  window.URL.revokeObjectURL(url);
};


export const updateSocialLinks = async (social_links) => {
  const res = await api.put("/profile/socials", { social_links });
  return res.data;
};


/* ======================
   PORTFOLIO (proof of work)
====================== */
export const fetchPortfolio = async () => {
  const res = await api.get("/portfolio");
  return res.data;
};

/* Completed deals that are not portfolio items yet */
export const fetchPortfolioCandidates = async () => {
  const res = await api.get("/portfolio/candidates");
  return res.data;
};

export const createPortfolioItem = async (payload) => {
  const res = await api.post("/portfolio", payload);
  return res.data;
};

export const updatePortfolioItem = async (itemId, payload) => {
  const res = await api.put(`/portfolio/${itemId}`, payload);
  return res.data;
};

export const deletePortfolioItem = async (itemId) => {
  const res = await api.delete(`/portfolio/${itemId}`);
  return res.data;
};

export const togglePortfolioVisibility = async (itemId, isPublic) => {
  const res = await api.patch(`/portfolio/${itemId}/visibility`, {
    is_public: isPublic
  });
  return res.data;
};

export const togglePortfolioFeatured = async (itemId, isFeatured) => {
  const res = await api.patch(`/portfolio/${itemId}/featured`, {
    is_featured: isFeatured
  });
  return res.data;
};

/* Signed Cloudinary upload for portfolio thumbnails */
export const uploadPortfolioThumbnail = async (file) => {
  const res = await api.get("/portfolio/upload-signature");
  const sig = res.data;

  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", sig.apiKey);
  formData.append("timestamp", sig.timestamp);
  formData.append("signature", sig.signature);
  formData.append("folder", sig.folder);

  const upload = await fetch(
    `https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`,
    {
      method: "POST",
      body: formData
    }
  );

  const data = await upload.json();

  if (!data.secure_url) {
    throw new Error(data.error?.message || "Thumbnail upload failed");
  }

  return data.secure_url;
};


/* ======================
   CONTRACTS (deal workspace + global page)
====================== */
export const fetchContracts = async (filter) => {
  const res = await api.get("/contracts", {
    params: filter && filter !== "all" ? { filter } : {}
  });
  return res.data;
};

export const fetchDealContract = async (dealId) => {
  const res = await api.get(`/contracts/deal/${dealId}`);
  return res.data;
};

export const attachContract = async (dealId, payload) => {
  const res = await api.post(`/contracts/deal/${dealId}`, payload);
  return res.data;
};

export const updateContract = async (contractId, payload) => {
  const res = await api.put(`/contracts/${contractId}`, payload);
  return res.data;
};

export const deleteContract = async (contractId) => {
  const res = await api.delete(`/contracts/${contractId}`);
  return res.data;
};

export const setContractStatus = async (contractId, status) => {
  const res = await api.patch(`/contracts/${contractId}/status`, { status });
  return res.data;
};

export const setContractSignature = async (contractId, signatureStatus) => {
  const res = await api.patch(`/contracts/${contractId}/signature`, {
    signature_status: signatureStatus
  });
  return res.data;
};

/* Signed Cloudinary upload for contract documents (pdf/doc/images) */
export const uploadContractFile = async (file) => {
  const res = await api.get("/contracts/upload-signature");
  const sig = res.data;

  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", sig.apiKey);
  formData.append("timestamp", sig.timestamp);
  formData.append("signature", sig.signature);
  formData.append("folder", sig.folder);

  const upload = await fetch(
    `https://api.cloudinary.com/v1_1/${sig.cloudName}/auto/upload`,
    { method: "POST", body: formData }
  );

  const data = await upload.json();

  if (!data.secure_url) {
    throw new Error(data.error?.message || "Contract upload failed");
  }

  return { url: data.secure_url, name: file.name };
};


/* ======================
   PROFILE
====================== */

/* Update username */
export const updateProfile = async (username) => {
  const { data } = await api.put("/profile/update", { username });
  return data;
};

export const updatePublicSlug = async (public_slug) => {
  const { data } = await api.put("/profile/public-slug", { public_slug });
  return data;
};

/* Upload profile image (Cloudinary) */
export const uploadProfilePhoto = async (file) => {
  if (!file || !file.type?.startsWith("image/")) {
    throw new Error("Choose an image file");
  }
  if (file.size > 5 * 1024 * 1024) {
    throw new Error("Profile image must be under 5 MB");
  }

  const sigRes = await api.get("/profile/photo/upload-signature");
  const sig = sigRes.data;
  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", sig.apiKey);
  formData.append("timestamp", sig.timestamp);
  formData.append("signature", sig.signature);
  formData.append("folder", sig.folder);
  formData.append("transformation", sig.transformation);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`,
    {
      method: "POST",
      body: formData
    }
  );

  const data = await res.json();
  if (!data.secure_url) {
    throw new Error(data.error?.message || "Profile image upload failed");
  }

  // 🔥 SAVE URL TO BACKEND
  await api.post("/profile/photo", { url: data.secure_url });

  return data.secure_url;
};




/* ======================
   PAYMENTS (already used)
====================== */
export const deleteDeal = async (dealId) => {
  const res = await api.delete(`/deals/${dealId}`);
  return res.data;
};




export default api;
