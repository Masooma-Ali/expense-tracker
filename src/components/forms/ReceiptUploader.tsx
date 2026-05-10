"use client";
import { useRef, useState } from "react";

interface ParsedReceipt {
  amount: number | null;
  date: string | null;
  description: string | null;
  category: string;
}

interface Props {
  onDataExtracted: (data: ParsedReceipt) => void;
}

export function ReceiptUploader({ onDataExtracted }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleFile(file: File) {
    setError("");
    setSuccess(false);

    // Show image preview
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);

    setLoading(true);

    const formData = new FormData();
    formData.append("receipt", file);

    const res = await fetch("/api/ocr", { method: "POST", body: formData });
    const data = await res.json();

    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Failed to scan receipt");
      return;
    }

    setSuccess(true);
    onDataExtracted(data.parsed);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  return (
    <div style={{ marginBottom: 16 }}>
      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
        style={{
          border: `2px dashed ${success ? "#A2CB8B" : error ? "#FB9B8F" : "#C7EABB"}`,
          borderRadius: 12,
          padding: preview ? "10px" : "24px",
          textAlign: "center",
          cursor: "pointer",
          background: success ? "#f0fbf4" : "#fafff8",
          transition: "all .15s",
          position: "relative",
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={handleChange}
        />

        {loading ? (
          <div style={{ padding: "10px 0" }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>🔍</div>
            <div style={{ fontSize: 13, color: "#84B179", fontWeight: 500 }}>Scanning receipt...</div>
            <div style={{ fontSize: 11, color: "#8aaa90", marginTop: 4 }}>Reading text from image</div>
          </div>
        ) : preview ? (
          <div>
            <img src={preview} alt="Receipt preview" style={{ maxHeight: 120, maxWidth: "100%", borderRadius: 8, objectFit: "contain" }} />
            <div style={{ fontSize: 11, color: "#8aaa90", marginTop: 6 }}>Click to change image</div>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🧾</div>
            <div style={{ fontSize: 13, fontWeight: 500, color: "#2d3a2e", marginBottom: 4 }}>Scan a Receipt</div>
            <div style={{ fontSize: 11, color: "#8aaa90" }}>Click or drag & drop a photo of your receipt</div>
            <div style={{ fontSize: 10, color: "#b0b0b0", marginTop: 4 }}>JPG, PNG up to 5MB</div>
          </div>
        )}
      </div>

      {/* States */}
      {error && (
        <div style={{ marginTop: 8, background: "#fff0f3", border: "1px solid #FB9B8F", borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "#c0446a" }}>
          ❌ {error}
        </div>
      )}
      {success && (
        <div style={{ marginTop: 8, background: "#e8f8ee", border: "1px solid #A2CB8B", borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "#2d6a3f" }}>
          ✅ Receipt scanned! Form filled automatically — review and save.
        </div>
      )}
    </div>
  );
}
