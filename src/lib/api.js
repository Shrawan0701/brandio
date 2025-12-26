import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000/api",
  withCredentials: true
});

/* ======================
   DEALS
====================== */
export const fetchDeals = async () => {
  const res = await api.get("/deals");
  return res.data;
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
  formData.append("upload_preset", "brandio_unsigned");

  const res = await fetch(
    "https://api.cloudinary.com/v1_1/da9ej0tre/image/upload",
    {
      method: "POST",
      body: formData
    }
  );

  const image = await res.json();

  if (!image.secure_url) {
    throw new Error("Upload failed");
  }

  // Save in DB
  await api.post("/profile/save-photo", {
    url: image.secure_url
  });

  return { url: image.secure_url };
};



/* ======================
   PAYMENTS (already used)
====================== */
export const deleteDeal = async (dealId) => {
  const res = await api.delete(`/deals/${dealId}`);
  return res.data;
};


export const startUpgrade = async (planType) => {
  const { data } = await api.post("/payments/upgrade", { planType });
  return data;
};

export default api;
