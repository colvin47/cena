import { sceneArtists, sceneActivity, sceneEvents, sceneGenres, scenePlaylists, sceneTracks } from "@shared/scene-seed";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { artists, events, tracks } from "../drizzle/schema";
import { addTrackToPlaylist, createArtistProfile, createPlaylist, findArtists, findTracks, getArtistByOwnerId, getDb, getUserLibrary, listEvents, recordTrackPlay, setAccountType, toggleEventInterest, toggleFollow, toggleSavedTrack } from "./db";
import { storagePresignPut } from "./storage";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";

const discoveryInput = z.object({
  city: z.string().trim().min(1).max(120).default("Campinas"),
  genre: z.string().trim().max(80).default("Tudo"),
  search: z.string().trim().max(120).default(""),
});

function filterSeed(input: z.infer<typeof discoveryInput>) {
  const query = input.search.toLowerCase();
  const tracksResult = sceneTracks.filter(track => {
    const matchesCity = !input.city || track.city.toLowerCase().includes(input.city.toLowerCase());
    const matchesGenre = input.genre === "Tudo" || track.genre === input.genre;
    const haystack = `${track.title} ${track.artist} ${track.genre} ${track.city}`.toLowerCase();
    return matchesCity && matchesGenre && (!query || haystack.includes(query));
  });
  const artistsResult = sceneArtists.filter(artist => {
    const matchesCity = !input.city || artist.city.toLowerCase().includes(input.city.toLowerCase());
    const haystack = `${artist.name} ${artist.handle} ${artist.genre} ${artist.city}`.toLowerCase();
    return matchesCity && (!query || haystack.includes(query));
  });
  const eventsResult = sceneEvents.filter(event => {
    const matchesCity = !input.city || event.city.toLowerCase().includes(input.city.toLowerCase());
    const haystack = `${event.title} ${event.place} ${event.city}`.toLowerCase();
    return matchesCity && (!query || haystack.includes(query));
  });
  return { tracks: tracksResult, artists: artistsResult, events: eventsResult, source: "seed" as const };
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie("webdev_app_session", { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  scene: router({
    discovery: publicProcedure.input(discoveryInput).query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { ...filterSeed(input), city: input.city, genres: sceneGenres, playlists: scenePlaylists, activity: sceneActivity, source: "seed" as const };
      const [dbTracks, dbArtists, dbEvents] = await Promise.all([
        findTracks(input.search, input.genre, input.city),
        findArtists(input.search, input.city),
        listEvents(input.city),
      ]);
      if (!dbTracks.length && !dbArtists.length && !dbEvents.length) {
        return { ...filterSeed(input), city: input.city, genres: sceneGenres, playlists: scenePlaylists, activity: sceneActivity, source: "seed" as const };
      }
      return {
        tracks: dbTracks.map(track => ({ ...track, duration: track.duration ?? 0, cover: track.cover ?? sceneTracks[0].cover, accent: "#c8f36a" })),
        artists: dbArtists.map(artist => ({ id: artist.id, name: artist.name, handle: artist.handle, genre: artist.genre ?? "Cena local", bio: artist.bio ?? "", city: artist.city, image: artist.avatarUrl ?? sceneArtists[0].image, accent: "#c8f36a", followers: "—" })),
        events: dbEvents.map(event => ({ ...event, day: event.eventDate.toLocaleDateString("pt-BR", { day: "2-digit" }), month: event.eventDate.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "").toUpperCase(), time: event.eventDate.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }), isoDate: event.eventDate.toISOString(), color: "lime" as const, interest: Number(event.interest ?? 0) })),
        source: "database" as const,
        city: input.city,
        genres: sceneGenres,
        playlists: scenePlaylists,
        activity: sceneActivity,
      };
    }),

    setAccountType: protectedProcedure.input(z.object({ accountType: z.enum(["listener", "artist"]) })).mutation(async ({ ctx, input }) => {
      const updated = await setAccountType(ctx.user.id, input.accountType);
      return { accountType: input.accountType, persisted: updated };
    }),

    library: protectedProcedure.query(({ ctx }) => getUserLibrary(ctx.user.id)),

    myArtistProfile: protectedProcedure.query(({ ctx }) => getArtistByOwnerId(ctx.user.id)),

    createArtistProfile: protectedProcedure.input(z.object({ name: z.string().trim().min(2).max(160), handle: z.string().trim().min(2).max(80).regex(/^@?[a-zA-Z0-9_]+$/), city: z.string().trim().min(2).max(120), genre: z.string().trim().max(80).optional(), bio: z.string().trim().max(1000).optional() })).mutation(async ({ ctx, input }) => {
      if (ctx.user.accountType !== "artist" && ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Ative o perfil de artista antes de continuar." });
      const handle = input.handle.startsWith("@") ? input.handle : `@${input.handle}`;
      try {
        const profile = await createArtistProfile(ctx.user.id, { ...input, handle });
        if (!profile) return { persisted: false, profile: null };
        return { persisted: true, profile };
      } catch (error) {
        if (String(error).toLowerCase().includes("duplicate")) throw new TRPCError({ code: "CONFLICT", message: "Esse @ já está em uso. Escolha outro." });
        throw error;
      }
    }),

    followArtist: protectedProcedure.input(z.object({ artistId: z.number().int().positive() })).mutation(async ({ ctx, input }) => ({ followed: await toggleFollow(ctx.user.id, input.artistId) })),
    interestEvent: protectedProcedure.input(z.object({ eventId: z.number().int().positive() })).mutation(async ({ ctx, input }) => ({ interested: await toggleEventInterest(ctx.user.id, input.eventId) })),
    saveTrack: protectedProcedure.input(z.object({ trackId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      const result = await toggleSavedTrack(ctx.user.id, input.trackId);
      if (result.missing) throw new TRPCError({ code: "NOT_FOUND", message: "Essa faixa não está disponível para salvar." });
      return result;
    }),
    recordPlay: publicProcedure.input(z.object({ trackId: z.number().int().positive() })).mutation(async ({ ctx, input }) => ({ recorded: await recordTrackPlay(input.trackId, ctx.user?.id) })),

    requestUpload: protectedProcedure.input(z.object({ kind: z.enum(["audio", "image"]), fileName: z.string().trim().min(1).max(180), contentType: z.string().trim().min(1).max(120), size: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      if (ctx.user.accountType !== "artist" && ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Apenas artistas podem enviar arquivos." });
      const maxSize = input.kind === "audio" ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
      if (input.size > maxSize) throw new TRPCError({ code: "BAD_REQUEST", message: `O arquivo excede o limite de ${input.kind === "audio" ? "50 MB" : "10 MB"}.` });
      const extension = input.fileName.includes(".") ? input.fileName.split(".").pop()?.toLowerCase() : "bin";
      const allowed = input.kind === "audio" ? ["mp3", "wav", "m4a", "ogg"] : ["jpg", "jpeg", "png", "webp"];
      if (!extension || !allowed.includes(extension)) throw new TRPCError({ code: "BAD_REQUEST", message: "Formato de arquivo não suportado." });
      const allowedContentTypes = input.kind === "audio" ? ["audio/mpeg", "audio/wav", "audio/x-wav", "audio/mp4", "audio/ogg"] : ["image/jpeg", "image/png", "image/webp"];
      if (!allowedContentTypes.includes(input.contentType.toLowerCase())) throw new TRPCError({ code: "BAD_REQUEST", message: "O tipo MIME do arquivo não é suportado." });
      const safeName = input.fileName.replace(/[^a-zA-Z0-9._-]/g, "-").slice(-140);
      return storagePresignPut(`cena/${ctx.user.id}/${input.kind}/${Date.now()}-${safeName}`, input.contentType.toLowerCase());
    }),

    createPlaylist: protectedProcedure.input(z.object({ name: z.string().trim().min(1).max(160), collaborative: z.boolean().default(false) })).mutation(async ({ ctx, input }) => {
      const id = await createPlaylist(ctx.user.id, input.name, input.collaborative);
      return { id, name: input.name, collaborative: input.collaborative, persisted: id !== null };
    }),

    addTrackToPlaylist: protectedProcedure.input(z.object({ playlistId: z.number().int().positive(), trackId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      const result = await addTrackToPlaylist(ctx.user.id, input.playlistId, input.trackId);
      if (result.reason === "FORBIDDEN") throw new TRPCError({ code: "FORBIDDEN", message: "Essa playlist não está aberta para colaboração." });
      if (result.reason === "NOT_FOUND" || result.reason === "TRACK_NOT_FOUND") throw new TRPCError({ code: "NOT_FOUND", message: "Playlist ou faixa não encontrada." });
      return result;
    }),

    createEvent: protectedProcedure.input(z.object({ name: z.string().trim().min(1).max(180), venue: z.string().trim().min(1).max(180), city: z.string().trim().min(1).max(120), eventDate: z.string().datetime(), description: z.string().max(500).optional(), ticketUrl: z.string().url().optional() })).mutation(async ({ ctx, input }) => {
      if (ctx.user.accountType !== "artist" && ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Apenas artistas podem criar eventos." });
      const db = await getDb();
      if (!db) return { persisted: false, id: null };
      const owner = await db.select({ id: artists.id }).from(artists).where(eq(artists.ownerId, ctx.user.id)).limit(1);
      if (!owner[0]) throw new TRPCError({ code: "BAD_REQUEST", message: "Crie seu perfil de artista antes de criar um evento." });
      const result = await db.insert(events).values({ ...input, artistId: owner[0].id, eventDate: new Date(input.eventDate) });
      return { persisted: true, id: Number(result[0].insertId) };
    }),

    createTrack: protectedProcedure.input(z.object({ title: z.string().trim().min(1).max(180), album: z.string().max(180).optional(), genre: z.string().max(80).optional(), city: z.string().trim().min(1).max(120), description: z.string().max(1000).optional(), coverUrl: z.string().trim().min(1).max(2048).optional(), audioUrl: z.string().trim().min(1).max(2048), durationSeconds: z.number().int().nonnegative().optional(), rightsDeclared: z.literal(true) })).mutation(async ({ ctx, input }) => {
      if (ctx.user.accountType !== "artist" && ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Apenas artistas podem enviar faixas." });
      const ownedAudioPrefix = `/manus-storage/cena/${ctx.user.id}/audio/`;
      const ownedCoverPrefix = `/manus-storage/cena/${ctx.user.id}/image/`;
      if (!input.audioUrl.startsWith(ownedAudioPrefix) || (input.coverUrl && !input.coverUrl.startsWith(ownedCoverPrefix))) throw new TRPCError({ code: "BAD_REQUEST", message: "Os arquivos precisam ser enviados pelo fluxo oficial da Cena." });
      const db = await getDb();
      if (!db) return { persisted: false, id: null };
      const owner = await db.select({ id: artists.id }).from(artists).where(eq(artists.ownerId, ctx.user.id)).limit(1);
      if (!owner[0]) throw new TRPCError({ code: "BAD_REQUEST", message: "Crie seu perfil de artista antes de enviar uma faixa." });
      const result = await db.insert(tracks).values({ ...input, artistId: owner[0].id, rightsDeclaredAt: new Date() });
      return { persisted: true, id: Number(result[0].insertId) };
    }),
  }),
});

export type AppRouter = typeof appRouter;
