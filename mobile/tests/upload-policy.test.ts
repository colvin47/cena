import { describe, expect, it } from "vitest";
import { MAX_AUDIO_BYTES, MAX_IMAGE_BYTES, cenaUploadContentType, validateCenaUploadFile } from "../lib/upload-policy";

describe("política de arquivos CENA", () => {
  it("normaliza somente os formatos de áudio suportados pelo servidor", () => {
    expect(cenaUploadContentType("Faixa.MP3", "audio")).toBe("audio/mpeg");
    expect(cenaUploadContentType("ao-vivo.wav", "audio")).toBe("audio/wav");
    expect(cenaUploadContentType("single.m4a", "audio")).toBe("audio/mp4");
    expect(cenaUploadContentType("demo.ogg", "audio")).toBe("audio/ogg");
    expect(cenaUploadContentType("faixa.flac", "audio")).toBeNull();
  });

  it("normaliza somente as capas aceitas e respeita os limites máximos", () => {
    expect(cenaUploadContentType("capa.JPEG", "image")).toBe("image/jpeg");
    expect(cenaUploadContentType("capa.png", "image")).toBe("image/png");
    expect(cenaUploadContentType("capa.webp", "image")).toBe("image/webp");
    expect(cenaUploadContentType("capa.gif", "image")).toBeNull();
    expect(validateCenaUploadFile("track.mp3", MAX_AUDIO_BYTES, "audio")).toBe("audio/mpeg");
    expect(validateCenaUploadFile("cover.webp", MAX_IMAGE_BYTES, "image")).toBe("image/webp");
  });

  it("bloqueia formato incorreto, arquivo vazio e arquivo acima do limite", () => {
    expect(() => validateCenaUploadFile("faixa.flac", 1024, "audio")).toThrow("MP3, WAV, M4A ou OGG");
    expect(() => validateCenaUploadFile("faixa.mp3", 0, "audio")).toThrow("até 50 MB");
    expect(() => validateCenaUploadFile("faixa.mp3", MAX_AUDIO_BYTES + 1, "audio")).toThrow("até 50 MB");
    expect(() => validateCenaUploadFile("capa.png", MAX_IMAGE_BYTES + 1, "image")).toThrow("até 10 MB");
  });
});
