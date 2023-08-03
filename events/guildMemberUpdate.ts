import {config} from "../config";
import {AuditLogEvent, Colors, EmbedBuilder, Events, TextChannel} from "discord.js";
import {client, myLog} from "../index";

client.on(Events.GuildMemberUpdate, async (oldMember, newMember) => {
    let changes = '';
    let rolechanges = false;
    let nickchanges = false;
    let changedroles = '';
    if (oldMember.guild) {
        const author = `${oldMember.displayName} (${oldMember.user.tag})`;

        if (oldMember.nickname !== newMember.nickname) {
            changes += `**__Nickname:__**\n~~${oldMember.nickname}~~ => ${newMember.nickname || 'server nickname removed'}\n`;
            nickchanges = true;
        }
        const ignoredroles = config.ignoredUserUpdateRoles;
        oldMember.roles.cache.forEach(role => {
            if (!newMember.roles.cache.has(role.id) && !ignoredroles.includes(role.id)) {
                changedroles += `~~_${role.name}_~~ removed\n`;
                rolechanges = true;
            }
        });
        newMember.roles.cache.forEach(role => {
            if (!oldMember.roles.cache.has(role.id) && !ignoredroles.includes(role.id)) {
                changedroles += `_${role.name}_ added`;
                rolechanges = true;
            }
        });
        if (rolechanges) {
            changes += `**__Role Changes:__**\n${changedroles}`
        }
        if (rolechanges || nickchanges) {
            const fetchedLogs = await oldMember.guild.fetchAuditLogs({
                type: AuditLogEvent.MemberRoleUpdate,
                limit: 10,
            });
            const executor = fetchedLogs.entries.find(x => x.targetId === oldMember.id)?.executorId as string;
            const embed1 = new EmbedBuilder({
                color: Colors.Blue,
                title: `${author} was updated by ${oldMember.guild.members.cache.get(executor)?.displayName}`,
                description: `${changes}`
            });
            oldMember.guild.channels.fetch(config.auditLogChannels.channel).then(thisChan => {
                (thisChan as TextChannel).threads.fetch(config.auditLogChannels.userupdates).then(thread => {
                    if (thread) {
                        thread.send({embeds: [embed1]}).catch(myLog);
                    } else myLog('Error: Missing userupdates audit log channel.')
                }).catch(myLog);
            }).catch(myLog);
        }
    }
});
