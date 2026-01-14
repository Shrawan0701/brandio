import { useState } from "react";
import countries from "world-countries";

const countryList = countries
  .map(c => ({
    label: c.name.common,
    code: c.cca2
  }))
  .sort((a, b) => a.label.localeCompare(b.label));

export default function CountrySelect({ value = "IN", onChange }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selected = countryList.find(c => c.code === value);

  const filtered = countryList.filter(c =>
    c.label.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="country-select">
      {/* SELECT BOX */}
      <button
        type="button"
        className="country-input"
        onClick={() => setOpen(!open)}
      >
        <span>{selected?.label || "Select country"}</span>
        <span className="dropdown-arrow">▾</span>
      </button>

      {/* DROPDOWN */}
      {open && (
        <div className="country-dropdown">
          <input
            type="text"
            placeholder="Search country..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="country-search"
            autoFocus
          />

          <div className="country-list">
            {filtered.map(c => (
              <div
                key={c.code}
                className={`country-option ${
                  c.code === value ? "active" : ""
                }`}
                onClick={() => {
                  onChange(c.code);
                  setOpen(false);
                  setSearch("");
                }}
              >
                {c.label}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
