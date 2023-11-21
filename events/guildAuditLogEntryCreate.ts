import {
    APIRole,
    AuditLogEvent, AuditLogOptionsType,
    Events,
    GuildAuditLogsActionType,
    GuildAuditLogsEntry,
    GuildAuditLogsEntryExtraField,
    GuildAuditLogsTargetType,
    GuildMember, TextChannel
} from "discord.js";
import {client, myLog, thisServer} from "../index";
import {welcomeNewMember} from "./guildMemberUpdate";
import {config} from "../config";
import {db} from "../db";
import * as dayjs from "dayjs";

client.on(Events.GuildAuditLogEntryCreate, async auditLog => {
    const {
        action,
        extra,
        executorId,
        targetId
    } = auditLog;

    switch (action) {
        case AuditLogEvent.MessageDelete:
            myLog("message deleted");

        case AuditLogEvent.MemberRoleUpdate:
            myLog("member updated");
                const changes = auditLog.changes;
                if (changes) {
                    changes.forEach((change) => {
                        if (change.key === '$add') {
                            if (change.new){
                                const newchanges: APIRole[] = change.new as APIRole[];
                                if (config.generalaccessrole === newchanges[0].id as string) {
                                    if (targetId &&  executorId) {
                                        thisServer.members.fetch(targetId)
                                            .then(()=> {
                                                thisServer.members.fetch(executorId)
                                            })
                                            .then(() => {
                                                welcomeNewMember(thisServer.members.cache.get(targetId) as GuildMember, thisServer.members.cache.get(executorId) as GuildMember)
                                            })
                                            .catch((err) => myLog(err));
                                    }
                                }
                            }
                        }
                    })
                }
        case AuditLogEvent.AutoModerationFlagToChannel:
            myLog("message flagged by automod");
            myLog(auditLog);
            addAuditLogEntry(auditLog);
        default:
           // myLog(auditLog);
            return;
    }
})


// add an auditlog entry to db
function addAuditLogEntry (auditLog: GuildAuditLogsEntry<AuditLogEvent, GuildAuditLogsActionType, GuildAuditLogsTargetType, AuditLogEvent>) {
    const extra: GuildAuditLogsEntryExtraField[AuditLogEvent.AutoModerationFlagToChannel] = auditLog.extra as GuildAuditLogsEntryExtraField[AuditLogEvent.AutoModerationFlagToChannel];
    const channel: TextChannel = thisServer.channels.cache.get(extra.channel.id) as TextChannel;

    const data = [
        dayjs().format('YYYY-MM-DDTHH:mm:ssZ'),
        auditLog.executorId,
        auditLog.reason,
        auditLog.executor?.displayName,
        extra.autoModerationRuleName,
        extra.autoModerationRuleTriggerType,
        channel.id,
        channel.name,
        (channel.parentId) ? channel.parentId : "undefined",
        (channel.parentId) ? thisServer.channels.cache.get(channel.parentId)?.name : "undefined",
        channel.lastMessage?.id,
        channel.lastMessage?.cleanContent,
    ];
    const sql = `INSERT INTO
                    auditlog (timestamp, executorId, reason, username, autoModerationRuleName, autoModerationRuleTriggerType, channelId, channelName, channelParentId, channelParentName, messageId, MessageContent)
                             VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    db.run(sql, data, (err: Error) => {
        if (err) {
            console.error(err.message);
        }
    });
}
