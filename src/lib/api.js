import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  withCredentials: true,
});

/* ======================
   DEALS
====================== */
export const fetchDeals = async () => {
  const res = await api.get("/deals");
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
   PROFILE
====================== */

/* Update username */
export const updateProfile = async (username) => {
  const { data } = await api.put("/profile/update", { username });
  return data;
};

/* Upload profile image (Cloudinary) */
export const uploadProfilePhoto = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", "brandio_profile");

  const res = await fetch(
    "https://api.cloudinary.com/v1_1/da9ej0tre/image/upload",
    {
      method: "POST",
      body: formData
    }
  );

  const data = await res.json();

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
