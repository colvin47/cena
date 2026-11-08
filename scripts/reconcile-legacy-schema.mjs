import mysql from "mysql2/promise";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const tables = new Set((await connection.query("SELECT TABLE_NAME FROM information_schema.tables WHERE table_schema = DATABASE()"))[0].map(row => row.TABLE_NAME));
const columns = async table => new Set((await connection.query("SELECT COLUMN_NAME FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = ?", [table]))[0].map(row => row.COLUMN_NAME));
const indexes = async table => new Set((await connection.query("SELECT DISTINCT INDEX_NAME FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = ?", [table]))[0].map(row => row.INDEX_NAME));
const addColumn = async (table, name, definition) => {
  if (!(await columns(table)).has(name)) await connection.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${name}\` ${definition}`);
};
const createTable = async (name, statement) => {
  if (!tables.has(name)) {
    await connection.query(statement);
    tables.add(name);
  }
};
const addIndex = async (table, name, definition) => {
  if (!(await indexes(table)).has(name)) await connection.query(`ALTER TABLE \`${table}\` ADD ${definition}`);
};

await addColumn("users", "adminRole", "enum('owner','moderator','agenda') NOT NULL DEFAULT 'moderator'");
await addColumn("artists", "profileType", "enum('solo','band','mc','producer','dj','collective','label','venue') NOT NULL DEFAULT 'solo'");
await addColumn("artists", "manifesto", "text NULL");
await addColumn("artists", "supportUrl", "text NULL");
await addColumn("artists", "pixUrl", "varchar(255) NULL");
await addColumn("artists", "merchUrl", "text NULL");
await addColumn("artists", "isVerified", "boolean NOT NULL DEFAULT false");
await addColumn("events", "collectiveId", "int NULL");
await addColumn("events", "eventType", "enum('show','battle','cypher','cultural_round','diy_festival','occupation','zine_fair','workshop','listening_party','release') NOT NULL DEFAULT 'show'");
await addColumn("events", "admissionType", "enum('ticket','free','contribution') NOT NULL DEFAULT 'ticket'");
await addColumn("events", "program", "text NULL");
await addColumn("events", "accessibility", "text NULL");
await addColumn("events", "safeSpace", "boolean NOT NULL DEFAULT false");
await addColumn("events", "ageRating", "varchar(40) NULL");
await addColumn("events", "canceledAt", "timestamp NULL");
await addColumn("events", "cancelReason", "text NULL");
await addColumn("tracks", "collectiveId", "int NULL");
await addColumn("tracks", "releaseType", "enum('single','album','demo','live','split','compilation') NOT NULL DEFAULT 'single'");
await addColumn("tracks", "creditsNote", "text NULL");
await addColumn("tracks", "idempotencyKey", "varchar(64) NULL");
await connection.query("UPDATE tracks SET idempotencyKey = CONCAT('legacy-', id) WHERE idempotencyKey IS NULL");
await connection.query("ALTER TABLE tracks MODIFY COLUMN idempotencyKey varchar(64) NOT NULL");
await addColumn("tracks", "bookletPages", "text NULL");
await addColumn("tracks", "releaseDate", "timestamp NULL");
await addColumn("tracks", "visibility", "enum('public','private') NOT NULL DEFAULT 'public'");
await addColumn("tracks", "sourceType", "enum('upload','spotify','youtube','bandcamp','soundcloud') NOT NULL DEFAULT 'upload'");
await addColumn("tracks", "externalUrl", "text NULL");

await createTable("collectives", "CREATE TABLE `collectives` (`id` int AUTO_INCREMENT NOT NULL, `ownerId` int NOT NULL, `name` varchar(160) NOT NULL, `handle` varchar(80) NOT NULL, `type` enum('collective','label','venue','media','festival') NOT NULL DEFAULT 'collective', `city` varchar(120) NOT NULL, `bio` text NULL, `manifesto` text NULL, `imageUrl` text NULL, `supportUrl` text NULL, `pixUrl` varchar(255) NULL, `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, PRIMARY KEY (`id`), UNIQUE KEY `collectives_handle_unique` (`handle`)) ENGINE=InnoDB");
await createTable("collectiveMembers", "CREATE TABLE `collectiveMembers` (`collectiveId` int NOT NULL, `artistId` int NOT NULL, `memberRole` varchar(100) NULL, `permission` enum('owner','editor','agenda','member') NOT NULL DEFAULT 'member', `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (`collectiveId`,`artistId`)) ENGINE=InnoDB");
await createTable("moderationReports", "CREATE TABLE `moderationReports` (`id` int AUTO_INCREMENT NOT NULL, `reporterId` int NOT NULL, `targetType` enum('track','artist','event','collective') NOT NULL, `targetId` int NOT NULL, `reason` varchar(120) NOT NULL, `details` text NULL, `status` enum('open','reviewed','resolved','rejected') NOT NULL DEFAULT 'open', `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, `resolvedAt` timestamp NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB");
await createTable("trackCredits", "CREATE TABLE `trackCredits` (`trackId` int NOT NULL, `creditName` varchar(160) NOT NULL, `creditRole` varchar(100) NOT NULL, `artistId` int NULL, `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (`trackId`,`creditName`,`creditRole`)) ENGINE=InnoDB");
await createTable("auditLogs", "CREATE TABLE `auditLogs` (`id` int AUTO_INCREMENT NOT NULL, `actorId` int NOT NULL, `action` varchar(120) NOT NULL, `targetType` varchar(40) NOT NULL, `targetId` int NULL, `metadata` text NULL, `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (`id`)) ENGINE=InnoDB");
await createTable("collectiveInvites", "CREATE TABLE `collectiveInvites` (`id` int AUTO_INCREMENT NOT NULL, `collectiveId` int NOT NULL, `inviterId` int NOT NULL, `tokenHash` varchar(128) NOT NULL, `permission` enum('editor','agenda','member') NOT NULL DEFAULT 'member', `email` varchar(320) NULL, `expiresAt` timestamp NOT NULL, `acceptedAt` timestamp NULL, `declinedAt` timestamp NULL, `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (`id`), UNIQUE KEY `collectiveInvites_tokenHash_unique` (`tokenHash`)) ENGINE=InnoDB");

await addIndex("artists", "artists_ownerId_unique", "UNIQUE KEY `artists_ownerId_unique` (`ownerId`)");
await addIndex("tracks", "tracks_idempotencyKey_unique", "UNIQUE KEY `tracks_idempotencyKey_unique` (`idempotencyKey`)");
await addIndex("collectiveMembers", "idx_collective_members_artist", "KEY `idx_collective_members_artist` (`artistId`)");
await addIndex("collectives", "idx_collectives_city", "KEY `idx_collectives_city` (`city`)");
await addIndex("collectives", "idx_collectives_owner", "KEY `idx_collectives_owner` (`ownerId`)");
await addIndex("moderationReports", "idx_reports_target", "KEY `idx_reports_target` (`targetType`,`targetId`)");
await addIndex("moderationReports", "idx_reports_status", "KEY `idx_reports_status` (`status`)");
await addIndex("trackCredits", "idx_track_credits_artist", "KEY `idx_track_credits_artist` (`artistId`)");
await addIndex("auditLogs", "idx_audit_actor_date", "KEY `idx_audit_actor_date` (`actorId`,`createdAt`)");
await addIndex("auditLogs", "idx_audit_target", "KEY `idx_audit_target` (`targetType`,`targetId`)");
await addIndex("collectiveInvites", "idx_collective_invites_collective", "KEY `idx_collective_invites_collective` (`collectiveId`)");
await addIndex("collectiveInvites", "idx_collective_invites_token", "KEY `idx_collective_invites_token` (`tokenHash`)");

await connection.end();
console.log("Legacy schema reconciliation completed without truncating application data.");
