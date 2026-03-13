export const sanitizeFilename = (name: string): string => {
  return name
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, "_")
    .replace(/\s+/g, "_")
    .substring(0, 200)
    .replace(/^\.+/, "_") || "document";
};

export const getExtensionFromUrl = (url: string): string => {
  const match = url.match(/\.([a-zA-Z0-9]{1,5})(?:\?|$)/);
  return match ? `.${match[1].toLowerCase()}` : "";
};

export const buildFilename = (title: string | undefined, docId: string | undefined, url: string): string => {
  let base = "";
  if (title && typeof title === "string" && title.trim().length > 0) {
    base = title.trim();
  } else if (docId) {
    base = `document_${docId}`;
  } else {
    base = "document";
  }
  const ext = getExtensionFromUrl(url);
  if (ext && !base.toLowerCase().endsWith(ext)) {
    base += ext;
  }
  return sanitizeFilename(base);
};

export const handleDownload = async (url: string, title?: string, docId?: string) => {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("fetch failed");
    const blob = await res.blob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = buildFilename(title, docId, url);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(a.href), 100);
  } catch {
    const a = document.createElement("a");
    a.href = url;
    a.download = buildFilename(title, docId, url);
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
};
