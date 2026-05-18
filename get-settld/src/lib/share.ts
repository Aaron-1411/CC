import { toast } from "@/hooks/use-toast";

export const copyText = async (text: string, label = "Copied") => {
  try {
    await navigator.clipboard.writeText(text);
    toast({ title: label, description: "Copied to clipboard." });
  } catch {
    toast({ title: "Copy failed", description: "Your browser blocked clipboard access.", variant: "destructive" });
  }
};

export const downloadText = (text: string, filename: string) => {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

export const shareLink = async (url: string, title: string) => {
  if (navigator.share) {
    try {
      await navigator.share({ title, url });
      return;
    } catch { /* user cancelled */ }
  }
  await copyText(url, "Link copied");
};
