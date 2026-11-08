import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AdminRole = "owner" | "moderator" | "agenda";
function callerFor(role: "user" | "admin", adminRole: AdminRole = "moderator") {
  const ctx: TrpcContext = {
    user: {
      id: 42,
      openId: "moderation-test",
      email: "moderation@example.com",
      name: "Moderation Test",
      loginMethod: "test",
      role,
      adminRole,
      accountType: "listener",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
  return appRouter.createCaller(ctx);
}

describe("moderation authorization", () => {
  it("blocks non-admin users from reading reports", async () => {
    await expect(callerFor("user").scene.moderationReports({})).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("blocks non-admin users from changing report status", async () => {
    await expect(callerFor("user").scene.updateModerationReport({ id: 1, status: "resolved" })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("blocks non-admin users from hiding reported content", async () => {
    await expect(callerFor("user").scene.hideReportedContent({ reportId: 1 })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("blocks non-admin users from reading the audit history", async () => {
    await expect(callerFor("user").scene.auditLogs()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("blocks agenda managers from changing moderation decisions", async () => {
    await expect(callerFor("admin", "agenda").scene.updateModerationReport({ id: 1, status: "resolved" })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
