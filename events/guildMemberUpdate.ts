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
import {client, myLog} from "../index";

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
    const msg = `### ${greeting[(Math.floor(Math.random() * greeting.length))]}, <@${member.id}>!\n` +
        `Welcome to the Death Jesters & Zeroes to Heroes community!\n\n` +
        `I just wanted to point you to the <#676924129076576263> channel to select your pingable roles and viewable channel categories. ` +
        `Make sure you go through the <#523555986343198728> channel to find out all about our community and this server, and use the ` +
        `[ticketing system](https://discord.com/channels/231141125359009793/523555986343198728/1133186114463739934) there for any guild invites you need.\n` +
        `Also you can check out the <#725788225230340097> channel if you're interested in joining any of our organized regular raid teams.\n\n` +
        `If you have any questions feel free to ask in the server or one of our friendly <@&1172578109032255558> here in this private thread!\nYou can leave this thread at any time, or it will autoarchive in three days.`;

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
                myLog(thisThread)
                thisThread.send(msg).catch(myLog);
                thisThread.members.add(member.id).catch(myLog);
            }).catch(myLog);
        }
    }).catch(myLog)
}