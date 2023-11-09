import {APIRole, AuditLogEvent, Events, GuildMember, Message, Snowflake, TextChannel} from "discord.js";
import {client, myLog, thisServer} from "../index";
import {welcomeNewMember} from "./guildMemberUpdate";
import {config} from "../config";

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
        default:
           // myLog(auditLog);
            return;
    }
})