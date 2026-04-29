import { supabase } from "@/lib/supabase";

interface UploadOptions {
  file: File;
  userId: string;
  onProgress?: (percent: number) => void;
}

interface UploadResult {
  datasetId: string;
  storagePath: string;
}

/**
 * Uploads a video file to the `datasets` bucket and inserts a metadata row
 * into public.datasets. Reports byte-level progress via the onProgress callback.
 */
export async function uploadDataset({ file, userId, onProgress }: UploadOptions): Promise<UploadResult> {
  const datasetId = crypto.randomUUID();
  const ext = file.name.split(".").pop() || "mp4";
  const storagePath = `${userId}/${datasetId}.${ext}`;

  // Get a signed upload URL so we can drive the request via XHR (which exposes
  // real upload progress, unlike the standard SDK upload method).
  const { data: signed, error: signedErr } = await supabase
    .storage
    .from("datasets")
    .createSignedUploadUrl(storagePath);

  if (signedErr || !signed) {
    throw new Error(signedErr?.message ?? "Failed to create signed upload URL");
  }

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress((e.loaded / e.total) * 100);
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.(100);
        resolve();
      } else {
        reject(new Error(`Upload failed: ${xhr.status} ${xhr.statusText}`));
      }
    };
    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.open("PUT", signed.signedUrl);
    xhr.setRequestHeader("Content-Type", file.type || "video/mp4");
    xhr.send(file);
  });

  // Probe duration locally (cheap; doesn't require server round-trip)
  const duration = await new Promise<number>((resolve) => {
    const url = URL.createObjectURL(file);
    const vid = document.createElement("video");
    vid.preload = "metadata";
    vid.onloadedmetadata = () => {
      const d = vid.duration;
      URL.revokeObjectURL(url);
      resolve(d);
    };
    vid.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(0);
    };
    vid.src = url;
  });

  // Insert metadata row
  const { error: insertErr } = await supabase.from("datasets").insert({
    id: datasetId,
    user_id: userId,
    name: file.name.replace(/\.[^.]+$/, ""),
    location: "Uploaded",
    capture_date: new Date(file.lastModified || Date.now()).toISOString().slice(0, 10),
    duration_seconds: duration > 0 ? duration : null,
    storage_path: storagePath,
    processing_status: "pending",
  });

  if (insertErr) {
    throw new Error(`Metadata insert failed: ${insertErr.message}`);
  }

  return { datasetId, storagePath };
}
