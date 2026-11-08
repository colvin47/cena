import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const dbMocks = vi.hoisted(() => ({
  createCollectiveInvite: vi.fn(),
  previewCollectiveInvite: vi.fn(),
  acceptCollectiveInvite: vi.fn(),
  listPendingCollectiveInvites: vi.fn(),
  acceptPendingCollectiveInvite: vi.fn(),
  declineCollectiveInvite: vi.fn(),
}));

vi.mock("./db", async () => {
  const actual = await vi.importActual<typeof import("./db")>("./db");
  return { ...actual, ...dbMocks };
});

import { appRouter } from "./routers";

type UserOverrides = Partial<TrpcContext["user"]>;
function callerFor(overrides: UserOverrides = {}) {
  const ctx: TrpcContext = {
    user: {
      id: 42,
      openId: "invite-test",
      email: "artist@example.com",
      name: "Artista Teste",
      loginMethod: "test",
      role: "user",
      adminRole: "moderator",
      accountType: "artist",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
      ...overrides,
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
  return appRouter.createCaller(ctx);
}

describe("collective invite flow", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates a link invite with permission and optional e-mail", async () => {
    dbMocks.createCollectiveInvite.mockResolvedValue({ token: "a".repeat(43), expiresAt: new Date("2026-12-01") });
    await expect(callerFor().scene.createCollectiveInvite({ collectiveId: 7, permission: "editor", email: "new@example.com" })).resolves.toMatchObject({ token: "a".repeat(43) });
    expect(dbMocks.createCollectiveInvite).toHaveBeenCalledWith(42, { collectiveId: 7, permission: "editor", email: "new@example.com" });
  });

  it("blocks invite creation when the owner check returns no invite", async () => {
    dbMocks.createCollectiveInvite.mockResolvedValue(null);
    await expect(callerFor().scene.createCollectiveInvite({ collectiveId: 7, permission: "member" })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("previews a valid token without accepting it", async () => {
    dbMocks.previewCollectiveInvite.mockResolvedValue({ collectiveName: "Coletivo Norte", collectiveHandle: "@norte", inviterName: "Rádio Local", permission: "agenda", expiresAt: new Date("2026-12-01") });
    const result = await callerFor().scene.previewCollectiveInvite({ token: "b".repeat(43) });
    expect(result).toMatchObject({ collectiveName: "Coletivo Norte", permission: "agenda" });
    expect(dbMocks.acceptCollectiveInvite).not.toHaveBeenCalled();
  });

  it("accepts only after the explicit accept mutation", async () => {
    dbMocks.acceptCollectiveInvite.mockResolvedValue({ accepted: true, collectiveId: 7 });
    await expect(callerFor().scene.acceptCollectiveInvite({ token: "c".repeat(43) })).resolves.toEqual({ accepted: true, collectiveId: 7 });
    expect(dbMocks.acceptCollectiveInvite).toHaveBeenCalledWith(42, "c".repeat(43));
  });

  it("rejects expired or invalid tokens returned by the database", async () => {
    dbMocks.acceptCollectiveInvite.mockResolvedValue({ accepted: false, reason: "INVITE_INVALID" });
    await expect(callerFor().scene.acceptCollectiveInvite({ token: "d".repeat(43) })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("accepts a directed pending invite only for an artist profile", async () => {
    dbMocks.acceptPendingCollectiveInvite.mockResolvedValue({ accepted: true, collectiveId: 9 });
    await expect(callerFor().scene.acceptPendingCollectiveInvite({ inviteId: 11 })).resolves.toEqual({ accepted: true, collectiveId: 9 });
    dbMocks.acceptPendingCollectiveInvite.mockResolvedValue({ accepted: false, reason: "ARTIST_PROFILE_REQUIRED" });
    await expect(callerFor().scene.acceptPendingCollectiveInvite({ inviteId: 12 })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("supports listing and declining pending invitations", async () => {
    dbMocks.listPendingCollectiveInvites.mockResolvedValue([{ id: 3, collectiveName: "Coletivo Sul", permission: "member" }]);
    dbMocks.declineCollectiveInvite.mockResolvedValue(true);
    await expect(callerFor().scene.pendingCollectiveInvites()).resolves.toHaveLength(1);
    await expect(callerFor().scene.declineCollectiveInvite({ inviteId: 3 })).resolves.toEqual({ declined: true });
    expect(dbMocks.declineCollectiveInvite).toHaveBeenCalledWith(42, 3);
  });

  it("validates token length and e-mail format at the router boundary", async () => {
    await expect(callerFor().scene.previewCollectiveInvite({ token: "short" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(callerFor().scene.createCollectiveInvite({ collectiveId: 7, permission: "member", email: "not-an-email" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});
