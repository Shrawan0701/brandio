// src/components/AppLayout.jsx
import Navbar from "./Navbar";

export default function AppLayout({ children }) {
  return (
    <>
      <Navbar />
      <main>{children}</main>
    </>
  );
}
