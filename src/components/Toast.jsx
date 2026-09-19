import { useEffect } from "react";
import { createPortal } from "react-dom";

export default function Toast({ message, onClose, type = "error" }) {
  useEffect(() => {
    const t = setTimeout(onClose, 5000);
    return () => clearTimeout(t);
  }, [onClose]);

  return createPortal(
    <div
      style={{
        position: "fixed",
        top: "90px", // BELOW navbar
        left: "50%",
        transform: "translateX(-50%)",
        background: type === "error" ? "#dc2626" : "#16a34a",
        color: "white",
        padding: "14px 22px",
        borderRadius: "12px",
        fontSize: "14px",
        fontWeight: 500,
        boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
        zIndex: 999999
      }}
    >
      {message}
    </div>,
    document.body
  );
}
