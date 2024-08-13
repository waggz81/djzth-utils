BEGIN TRANSACTION;
CREATE TABLE IF NOT EXISTS "absences" (
	"team"	TEXT NOT NULL,
	"date"	NUMERIC NOT NULL,
	"comment"	TEXT,
	"user"	NUMERIC NOT NULL,
	"id"	INTEGER,
	PRIMARY KEY("id" AUTOINCREMENT)
);
CREATE TABLE IF NOT EXISTS "auditlog" (
	"timestamp"	,
	"executorId"	INTEGER,
	"reason"	TEXT,
	"username"	TEXT,
	"autoModerationRuleName"	TEXT,
	"autoModerationRuleTriggerType"	INTEGER,
	"channelId"	INTEGER,
	"channelName"	TEXT,
	"channelParentId"	INTEGER,
	"channelParentName"	TEXT,
	"messageId"	INTEGER,
	"MessageContent"	TEXT
);
CREATE TABLE IF NOT EXISTS "bannedusers" (
	"target_id"	INTEGER UNIQUE,
	"target_name"	TEXT,
	"target_nick"	TEXT,
	"executor_id"	INTEGER NOT NULL,
	"executor_nick"	TEXT,
	"reason"	TEXT,
	"timestamp"	TIMESTAMP NOT NULL,
	PRIMARY KEY("target_id")
);
CREATE TABLE IF NOT EXISTS "character_known_recipes" (
	"table_index"	TEXT UNIQUE,
	"character_id"	INTEGER,
	"recipe_id"	INTEGER
);
CREATE TABLE IF NOT EXISTS "guild_members" (
	"blizz_character_id"	INTEGER,
	"character_name"	TEXT,
	"realm"	INTEGER,
	"guild"	INTEGER,
	"level"	NUMERIC,
	"faction"	TEXT,
	"player_notes"	TEXT,
	"armory_link"	TEXT UNIQUE,
	"class"	TEXT,
	"race"	NUMERIC,
	"rank"	TEXT,
	"last_login"	INTEGER,
	"last_login_datetime"	TEXT,
	"cached_professions"	INTEGER,
	"last_imported"	INTEGER,
	"deletion_flag"	INTEGER,
	PRIMARY KEY("armory_link")
);
CREATE TABLE IF NOT EXISTS "guilds" (
	"guild_name"	TEXT,
	"gow_slug"	TEXT,
	"blizz_id"	INTEGER UNIQUE,
	"realm"	INTEGER
);
CREATE TABLE IF NOT EXISTS "keystones" (
	"character"	VARCHAR,
	"name"	VARCHAR,
	"class"	VARCHAR,
	"spec"	VARCHAR,
	"role"	VARCHAR,
	"score_all"	INTEGER,
	"score_tank"	INTEGER,
	"score_healer"	INTEGER,
	"score_dps"	INTEGER,
	"guild"	VARCHAR,
	"key_level"	INTEGER,
	"dungeon_name"	VARCHAR,
	"timestamp"	INT,
	"uploader"	VARCHAR
);
CREATE TABLE IF NOT EXISTS "pending_roles" (
	"messageID"	VARCHAR UNIQUE ON CONFLICT FAIL,
	"submitter"	VARCHAR,
	"target"	VARCHAR,
	"role"	VARCHAR,
	"add_remove"	VARCHAR
);
CREATE TABLE IF NOT EXISTS "profession_recipes" (
	"profession_id"	INTEGER,
	"profession_name"	TEXT,
	"recipe_name"	TEXT,
	"recipe_id"	INTEGER UNIQUE,
	"tier_id"	INTEGER,
	"tier_name"	TEXT,
	PRIMARY KEY("recipe_id")
);
CREATE TABLE IF NOT EXISTS "profession_skills" (
	"table_index"	TEXT UNIQUE,
	"character_id"	INTEGER,
	"profession_id"	INTEGER,
	"profession_name"	TEXT,
	"profession_tier_id"	INTEGER,
	"profession_tier_name"	TEXT,
	"skill_level"	INTEGER,
	"max_skill_level"	INTEGER
);
CREATE TABLE IF NOT EXISTS "raidteams_contacts" (
	"raidteam"	INTEGER,
	"discordid"	INTEGER NOT NULL,
	"bnetid"	TEXT,
	"name"	TEXT NOT NULL,
	FOREIGN KEY("raidteam") REFERENCES "raidteams_entries"("team") ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS "raidteams_entries" (
	"team"	INTEGER,
	"messageid"	INTEGER,
	"teamname"	TEXT NOT NULL UNIQUE,
	"game"	TEXT NOT NULL,
	"description"	TEXT NOT NULL,
	"progression"	TEXT,
	"requirements"	TEXT,
	"recruitmentneeds"	TEXT,
	"updated_by"	INTEGER NOT NULL,
	"timestamp"	TIMESTAMP NOT NULL,
	PRIMARY KEY("team")
);
CREATE TABLE IF NOT EXISTS "raidteams_schedules" (
	"raidteam"	INTEGER NOT NULL,
	"day"	INTEGER NOT NULL,
	"start"	INTEGER NOT NULL,
	"end"	INTEGER NOT NULL,
	FOREIGN KEY("raidteam") REFERENCES "raidteams_entries"("team") ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS "realms" (
	"realm_name"	TEXT,
	"realm_id"	INTEGER UNIQUE,
	"realm_slug"	TEXT
);
CREATE TABLE IF NOT EXISTS "userhistory" (
	"userid"	,
	"timestamp"	 NOT NULL DEFAULT (CURRENT_TIMESTAMP),
	"type"	 NOT NULL,
	"previousValue"	,
	"newValue"	,
	"data"	,
	PRIMARY KEY("userid")
);
CREATE TABLE IF NOT EXISTS "users" (
	"uuid"	VARCHAR UNIQUE,
	"id"	INTEGER UNIQUE,
	"username"	VARCHAR,
	"discriminator"	INTEGER,
	"avatar"	VARCHAR
);
CREATE UNIQUE INDEX IF NOT EXISTS "character" ON "keystones" (
	"character"
);
COMMIT;
