import "dotenv/config";
import express from "express";
import { createServer } from "http";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { publicPlatformScript } from "./publicConfig";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { storagePresignPut } from "../storage";
import { sdk } from "./sdk";
import { HttpError } from "@shared/_core/errors";

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
  app.get("/api/platform/config.js", (_req, res) => {
    res.set("Cache-Control", "no-store").type("application/javascript").send(publicPlatformScript());
  });
  registerOAuthRoutes(app);
  app.post("/api/upload", express.raw({ limit: "50mb", type: () => true }), async (req, res) => {
    try {
      const user = await sdk.authenticateRequest(req);
      if (!user) {
        res.status(401).json({ error: "Sua sessão expirou. Entre novamente antes de enviar o arquivo." });
        return;
      }
      if (user.accountType !== "artist" && user.role !== "admin") {
        res.status(403).json({ error: "Apenas artistas podem enviar arquivos." });
        return;
      }

      const kind = req.header("x-cena-kind");
      const contentType = (req.header("content-type") || "").toLowerCase().split(";", 1)[0];
      const encodedFileName = req.header("x-cena-file-name") || "upload.bin";
      const fileName = decodeURIComponent(encodedFileName);
      const body = Buffer.isBuffer(req.body) ? req.body : Buffer.from(req.body || "");
      const maxSize = kind === "audio" ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
      const allowedExtensions = kind === "audio" ? ["mp3", "wav", "m4a", "ogg"] : ["jpg", "jpeg", "png", "webp"];
      const allowedContentTypes = kind === "audio" ? ["audio/mpeg", "audio/wav", "audio/x-wav", "audio/mp4", "audio/ogg"] : ["image/jpeg", "image/png", "image/webp"];
      const extension = fileName.includes(".") ? fileName.split(".").pop()?.toLowerCase() : "";
      if ((kind !== "audio" && kind !== "image") || !extension || !allowedExtensions.includes(extension) || !allowedContentTypes.includes(contentType) || !body.length || body.length > maxSize) {
        res.status(400).json({ error: "Arquivo inválido. Confira formato, tipo e tamanho." });
        return;
      }

      const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "-").slice(-140);
      const requestedKey = req.header("x-cena-upload-key") || `${Date.now()}-${safeName}`;
      const safeUploadKey = requestedKey.replace(/[^a-zA-Z0-9_-]/g, "-").slice(0, 120) || `${Date.now()}`;
      const upload = await storagePresignPut(`cena/${user.id}/${kind}/${safeUploadKey}-${safeName}`, contentType, { unique: false });
      const storageResponse = await fetch(upload.url, { method: "PUT", headers: { "Content-Type": contentType }, body });
      if (!storageResponse.ok) {
        res.status(502).json({ error: `Não foi possível gravar o arquivo no storage (${storageResponse.status}).` });
        return;
      }
      res.json({ stableUrl: upload.stableUrl });
    } catch (error) {
      if (error instanceof HttpError && error.statusCode === 403) {
        res.status(401).json({ error: "Sua sessão expirou. Entre novamente antes de enviar o arquivo." });
        return;
      }
      console.error("[Upload] Failed:", error instanceof Error ? error.message : "unknown error");
      res.status(502).json({ error: "Não foi possível concluir o envio. Tente novamente." });
    }
  });
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const port = Number(process.env.PORT || "3000");
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("Invalid PORT");
  server.on("error", error => { console.error("Server failed:", error.message); process.exit(1); });
  server.listen(port, "0.0.0.0", () => console.log(`Server listening on port ${port}`));
}

startServer().catch(error => { console.error(error); process.exit(1); });
