--
-- File generated with SQLiteStudio v3.4.4 on Mon Nov 20 16:44:54 2023
--
-- Text encoding used: System
--
PRAGMA foreign_keys = off;
BEGIN TRANSACTION;

-- Table: absences
CREATE TABLE IF NOT EXISTS absences (
    team    TEXT    NOT NULL,
    date    NUMERIC NOT NULL,
    comment TEXT,
    user    NUMERIC NOT NULL,
    id      INTEGER PRIMARY KEY AUTOINCREMENT
);


-- Table: auditlog
CREATE TABLE IF NOT EXISTS auditlog (
    timestamp,
    executorId                    INTEGER,
    reason                        TEXT,
    username                      TEXT,
    autoModerationRuleName        TEXT,
    autoModerationRuleTriggerType INTEGER,
    channelId                     INTEGER,
    channelName                   TEXT,
    messageId                     INTEGER,
    MessageContent                TEXT
);


-- Table: keystones
CREATE TABLE IF NOT EXISTS keystones (
    character    VARCHAR,
    name         VARCHAR,
    class        VARCHAR,
    spec         VARCHAR,
    role         VARCHAR,
    score_all    INTEGER,
    score_tank   INTEGER,
    score_healer INTEGER,
    score_dps    INTEGER,
    guild        VARCHAR,
    key_level    INTEGER,
    dungeon_name VARCHAR,
    timestamp    INT,
    uploader     VARCHAR
);


-- Table: pending_roles
CREATE TABLE IF NOT EXISTS pending_roles (
    messageID  VARCHAR UNIQUE ON CONFLICT FAIL,
    submitter  VARCHAR,
    target     VARCHAR,
    role       VARCHAR,
    add_remove VARCHAR
);


-- Table: users
CREATE TABLE IF NOT EXISTS users (
    uuid          VARCHAR UNIQUE,
    id            INTEGER UNIQUE,
    username      VARCHAR,
    discriminator INTEGER,
    avatar        VARCHAR
);


-- Index: character
CREATE UNIQUE INDEX IF NOT EXISTS character ON keystones (
    character
);


COMMIT TRANSACTION;
PRAGMA foreign_keys = on;
