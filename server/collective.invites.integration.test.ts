import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createConnection, type Connection } from "mysql2/promise";
import { acceptCollectiveInvite, createCollectiveInvite, previewCollectiveInvite } from "./db";

const testDatabaseUrl = process.env.TEST_DATABASE_URL;
const databaseIdentity = (value: string) => {
  const url = new URL(value);
  return `${url.hostname}:${url.port || "3306"}${url.pathname}`;
};
if (testDatabaseUrl && process.env.DATABASE_URL && databaseIdentity(testDatabaseUrl) === databaseIdentity(process.env.DATABASE_URL)) {
  throw new Error("TEST_DATABASE_URL precisa apontar para um banco isolado, diferente do banco gerenciado da aplicação.");
}
if (testDatabaseUrl) process.env.DATABASE_URL = testDatabaseUrl;
const hasDatabase = Boolean(testDatabaseUrl);
describe.skipIf(!hasDatabase)("collective invites — MySQL integration", () => {
  let connection: Connection;
  let ownerId: number;
  let memberId: number;
  let collectiveId: number;
  let artistId: number;

  beforeAll(async () => {
    connection = await createConnection(testDatabaseUrl!);
    await connection.query("SELECT 1 FROM collectiveInvites LIMIT 1");
    const suffix = `${Date.now()}_${Math.floor(Math.random() * 100000)}`;
    const [owner] = await connection.execute<any>("INSERT INTO users (openId, name, email, accountType) VALUES (?, ?, ?, 'artist')", [`invite_it_owner_${suffix}`, "Integration Owner", `owner_${suffix}@example.test`]);
    ownerId = Number(owner.insertId);
    const [member] = await connection.execute<any>("INSERT INTO users (openId, name, email, accountType) VALUES (?, ?, ?, 'artist')", [`invite_it_member_${suffix}`, "Integration Member", `member_${suffix}@example.test`]);
    memberId = Number(member.insertId);
    const [collective] = await connection.execute<any>("INSERT INTO collectives (ownerId, name, handle, type, city) VALUES (?, ?, ?, 'collective', ?)", [ownerId, `Integration Collective ${suffix}`, `integration_${suffix}`, "Campinas"]);
    collectiveId = Number(collective.insertId);
    const [artist] = await connection.execute<any>("INSERT INTO artists (ownerId, name, handle, city) VALUES (?, ?, ?, ?)", [memberId, `Integration Artist ${suffix}`, `artist_${suffix}`, "Campinas"]);
    artistId = Number(artist.insertId);
  });

  afterAll(async () => {
    if (!connection) return;
    if (collectiveId) await connection.execute("DELETE FROM collectiveMembers WHERE collectiveId = ?", [collectiveId]);
    if (collectiveId) await connection.execute("DELETE FROM collectiveInvites WHERE collectiveId = ?", [collectiveId]);
    if (artistId) await connection.execute("DELETE FROM artists WHERE id = ?", [artistId]);
    if (collectiveId) await connection.execute("DELETE FROM collectives WHERE id = ?", [collectiveId]);
    if (ownerId || memberId) await connection.execute("DELETE FROM users WHERE id IN (?, ?)", [ownerId, memberId]);
    await connection.end();
  });

  it("runs the one-time invite lifecycle against MySQL", async () => {
    const invite = await createCollectiveInvite(ownerId, { collectiveId, permission: "editor", email: "member_integration@example.test" });
    expect(invite?.token).toHaveLength(43);
    expect(invite?.expiresAt).toBeInstanceOf(Date);

    const preview = await previewCollectiveInvite(invite!.token);
    expect(preview).toMatchObject({ collectiveName: expect.stringContaining("Integration Collective"), permission: "editor" });

    const accepted = await acceptCollectiveInvite(memberId, invite!.token);
    expect(accepted).toEqual({ accepted: true, collectiveId });

    const replay = await acceptCollectiveInvite(memberId, invite!.token);
    expect(replay).toEqual({ accepted: false, reason: "INVITE_INVALID" });
  });

  it("does not expose expired invites in preview", async () => {
    const invite = await createCollectiveInvite(ownerId, { collectiveId, permission: "member" });
    await connection.execute("UPDATE collectiveInvites SET expiresAt = ? WHERE collectiveId = ? AND tokenHash = SHA2(?, 256)", [new Date(Date.now() - 60_000), collectiveId, invite!.token]);
    await expect(previewCollectiveInvite(invite!.token)).resolves.toBeNull();
  });
});
