export type CenaUploadKind = "audio" | "image";

const AUDIO_TYPES: Record<string, string> = {
  mp3: "audio/mpeg",
  wav: "audio/wav",
  m4a: "audio/mp4",
  ogg: "audio/ogg",
};
const IMAGE_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};
export const MAX_AUDIO_BYTES = 50 * 1024 * 1024;
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

export function cenaUploadContentType(fileName: string, kind: CenaUploadKind): string | null {
  const extension = fileName.split(".").pop()?.trim().toLowerCase();
  if (!extension || extension === fileName.toLowerCase()) return null;
  return (kind === "audio" ? AUDIO_TYPES : IMAGE_TYPES)[extension] ?? null;
}

export function validateCenaUploadFile(fileName: string, size: number, kind: CenaUploadKind): string {
  const contentType = cenaUploadContentType(fileName, kind);
  if (!contentType) {
    throw new Error(kind === "audio"
      ? "Formato de áudio não aceito. Use MP3, WAV, M4A ou OGG."
      : "Formato de capa não aceito. Use JPG, PNG ou WebP.");
  }

  const maxBytes = kind === "audio" ? MAX_AUDIO_BYTES : MAX_IMAGE_BYTES;
  if (!Number.isFinite(size) || size <= 0 || size > maxBytes) {
    throw new Error(kind === "audio" ? "O áudio deve ter até 50 MB." : "A capa deve ter até 10 MB.");
  }
  return contentType;
}
