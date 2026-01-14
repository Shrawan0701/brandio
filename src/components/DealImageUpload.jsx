import { useState } from "react";
import {
  getDealUploadSignature,
  saveDealImage
} from "../lib/api";

export default function DealImageUpload({ deal, onUpdated }) {
  const [uploading, setUploading] = useState(false);

  

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploading(true);

      // 1️⃣ get signature
      const sig = await getDealUploadSignature(deal.id);

      // 2️⃣ upload to Cloudinary
      const formData = new FormData();
      formData.append("file", file);
      formData.append("api_key", sig.apiKey);
      formData.append("timestamp", sig.timestamp);
      formData.append("signature", sig.signature);
      formData.append("folder", `brandio/deals/${deal.id}`);

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`,
        {
          method: "POST",
          body: formData
        }
      );

      const data = await res.json();

      // 3️⃣ save image URL in DB
      const updated = await saveDealImage(deal.id, data.secure_url);

      onUpdated({
        ...deal,
        proof_images: updated.proof_images
      });
    } catch (err) {
      alert(err.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    
    <label className="btn btn-outline-primary w-100 mt-2">
      {uploading ? "Uploading..." : "+ Add Proof Image ( max 2)"}
      <input
        type="file"
        hidden
        accept="image/*"
        onChange={(e) => {
          handleUpload(e);
          e.target.value = null;
        }}
      />
    </label>
  );
}
