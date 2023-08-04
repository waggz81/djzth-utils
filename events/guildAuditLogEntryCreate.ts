import {Events} from "discord.js";
import {client, myLog} from "../index";

client.on(Events.GuildAuditLogEntryCreate, async auditLog => {
    const { action, extra: channel, executorId, targetId } = auditLog;
    myLog(auditLog);
})