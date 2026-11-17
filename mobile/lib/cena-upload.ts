import * as FileSystem from "expo-file-system/legacy";
import { CENA_API_BASE_URL } from "./cena-api";
import { validateCenaUploadFile, type CenaUploadKind } from "./upload-policy";

export type LocalCenaFile = { uri: string; name: string; size?: number | null };

function parseUploadBody(body: string) {
  try {
    return JSON.parse(body) as { stableUrl?: unknown; error?: unknown };
  } catch {
    return {};
  }
}

function messageForStatus(status: number, kind: CenaUploadKind, serverMessage?: unknown) {
  if (typeof serverMessage === "string" && serverMessage.trim()) return serverMessage;
  if (status === 401) return "Sua sessão expirou. Entre novamente antes de enviar o arquivo.";
  if (status === 413) return `O arquivo excede o limite de ${kind === "audio" ? "50 MB" : "10 MB"}.`;
  if (status === 403) return "Apenas contas de artista podem enviar arquivos.";
  if (status >= 500) return "O servidor não conseguiu gravar o arquivo agora. Tente novamente.";
  return `Não foi possível enviar o arquivo (HTTP ${status}).`;
}

export async function uploadCenaFile(
  asset: LocalCenaFile,
  kind: CenaUploadKind,
  sessionToken: string,
  uploadKey: string,
): Promise<string> {
  if (!sessionToken) throw new Error("Entre com Manus antes de enviar arquivos.");
  if (!/^[A-Za-z0-9_-]{16,120}$/.test(uploadKey)) throw new Error("Chave de envio inválida.");

  const info = await FileSystem.getInfoAsync(asset.uri);
  if (!info.exists) throw new Error("O arquivo selecionado não está mais disponível neste aparelho.");
  const size = asset.size ?? info.size;
  if (typeof size !== "number" || !Number.isFinite(size) || size < 0) throw new Error("Não foi possível verificar o tamanho do arquivo antes do envio.");
  const contentType = validateCenaUploadFile(asset.name, size, kind);
  const fileName = asset.name.trim().slice(-140);
  if (!fileName) throw new Error("O arquivo selecionado não tem um nome válido.");

  let lastError: Error | null = null;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await FileSystem.uploadAsync(`${CENA_API_BASE_URL}/api/upload`, asset.uri, {
        httpMethod: "POST",
        uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
        headers: {
          Authorization: `Bearer ${sessionToken}`,
          "Content-Type": contentType,
          "X-Cena-Kind": kind,
          "X-Cena-File-Name": encodeURIComponent(fileName),
          "X-Cena-Upload-Key": uploadKey,
        },
      });
      const body = parseUploadBody(response.body);
      if (response.status >= 200 && response.status < 300 && typeof body.stableUrl === "string" && body.stableUrl.startsWith("/manus-storage/cena/")) {
        return body.stableUrl;
      }

      lastError = new Error(messageForStatus(response.status, kind, body.error));
      if (response.status < 500 && response.status !== 429) break;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("Falha de rede durante o envio.");
    }

    if (attempt < 3) await new Promise(resolve => setTimeout(resolve, 700 * attempt));
  }

  throw lastError ?? new Error("Não foi possível enviar o arquivo.");
}
