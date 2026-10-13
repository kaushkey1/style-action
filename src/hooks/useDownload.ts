import { useState, useCallback, useRef } from "react";
import { apiFetchBlob } from "@/lib/api";
import { useToast } from "@/hooks/useToast";

export function useDownload(basePath?: string) {
  const [isDownloading, setIsDownloading] = useState(false);
  const activeRef = useRef(false);
  const { info, success, error: showError, removeToast } = useToast();

  const download = useCallback(
    async (
      path: string,
      filename: string,
      options?: { headers?: Record<string, string>; params?: Record<string, string> },
    ) => {
      if (activeRef.current) return;
      activeRef.current = true;
      setIsDownloading(true);
      const toastId = info("Preparing your download...", "Download");
      try {
        await apiFetchBlob(path, { download: true, ...options?.params }, filename, basePath);
        removeToast(toastId);
        success("File downloaded successfully", "Download Complete");
      } catch {
        removeToast(toastId);
        showError("Something went wrong. Please try again.", "Download Failed");
      } finally {
        activeRef.current = false;
        setIsDownloading(false);
      }
    },
    [info, success, showError, removeToast, basePath],
  );

  return { download, isDownloading } as const;
}
