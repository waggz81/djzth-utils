import {config} from "../config";
import {
    AuditLogEvent,
    ChannelType,
    Colors,
    EmbedBuilder,
    Events,
    GuildMember,
    TextChannel,
    ThreadAutoArchiveDuration
} from "discord.js";
import {client, myLog, updateStatus} from "../index";

const linkedroles: (string | [string, unknown])[] = []
Object.entries(config.linkedroles).forEach((entry) => {
    linkedroles.push([entry[0],entry[1]]);
})

client.on(Events.GuildMemberUpdate, async (oldMember, newMember) => {
    let changes = '';
    let rolechanges = false;
    let nickchanges = false;
    let changedroles = '';
    let welcome = false;
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
                if (role.id === config.generalaccessrole) {
                    welcome = true;
                }
            }
            const thisRole = role.id;
            if (config.linkedroles[thisRole]) {
                newMember.roles.add(config.linkedroles[thisRole]).catch(myLog);
            }
        });
        if (rolechanges) {
            changes += `**__Role Changes:__**\n${changedroles}`;
            updateStatus();
        }
        if (rolechanges || nickchanges) {
            const fetchedLogs = await oldMember.guild.fetchAuditLogs({
                type: AuditLogEvent.MemberRoleUpdate,
                limit: 10,
            });
            const executor = fetchedLogs.entries.find(x => x.targetId === oldMember.id)?.executorId as string;
            if (welcome) {
                // welcomeNewMember(newMember as GuildMember, newMember.guild.members.cache.get(executor) as GuildMember);
            }
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

export function welcomeNewMember(member: GuildMember, executor: GuildMember) {
    const greeting = [
        'Hey there',
        'Hiya',
        'Hello',
        'Hi',
        'Greetings',
        'Bonjour',
        'Howdy',
        'Howdy-do',
        'Heya',
        'Salutations',
        'Oh hi',
        'Hi there',
        'Aloha',
        'Ahoy'
    ];
    const msg = `### ${greeting[(Math.floor(Math.random() * greeting.length))]}, <@${member.id}>!\n${config.welcomemsg}`;
    member.guild.channels.fetch(config.welcomechannel).then(thisChan => {
        if (thisChan && thisChan.type === ChannelType.GuildText) {
            thisChan.send({
                allowedMentions: {
                    users: [member.id]
                },
                content: `<@${executor.id}> has welcomed a new member!\nSay "${greeting[(Math.floor(Math.random() * greeting.length))]}" to <@${member.id}>!`
            }).catch(myLog);
            thisChan.threads.create({
                name: `Welcome ${member.displayName}!`,
                autoArchiveDuration: ThreadAutoArchiveDuration.ThreeDays,
                type: ChannelType.PrivateThread
            }).then(thisThread =>{
                myLog(thisThread);
                thisThread.send(msg).catch(myLog);
                thisThread.members.add(member.id).catch(myLog);
            }).catch(myLog);
        }
    }).catch(myLog);
}
