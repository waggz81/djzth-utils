import {config} from "../config";
import {
    ChannelType,
    Colors,
    EmbedBuilder,
    escapeMaskedLink,
    Events,
    GuildMember,
    PartialGuildMember,
    TextChannel
} from "discord.js";
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
                if (role.id === config.generalaccessrole) {
                    myLog('welcome new member');
                    welcomeNewMember(oldMember);
                }
            }
        });
        if (rolechanges) {
            changes += `**__Role Changes:__**\n${changedroles}`
        }
        if (rolechanges || nickchanges) {
            const embed1 = new EmbedBuilder({
                color: Colors.Blue,
                title: `${author} was updated`,
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

function welcomeNewMember(member: GuildMember | PartialGuildMember) {
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
        'Well hello',
        'Oh hi',
        'Hi there',
        'Aloha',
        'Ahoy'
    ];
    let msg = `### ${greeting[(Math.floor(Math.random() * greeting.length))]}, <@${member.id}>!\n` +
        `Welcome to the Death Jesters & Zeroes to Heroes community!\n\n` +
        `I just wanted to point you to the <#676924129076576263> channel to select your pingable roles and viewable channel categories. ` +
        `Make sure you go through the <#523555986343198728> channel to find out all about our community and this server, and use the ` +
        `[ticketing system](https://discord.com/channels/231141125359009793/523555986343198728/1133186114463739934) there for any guild invites you need.\n` +
        `Also you can check out the <#725788225230340097> channel if you're interested in joining any of our organized regular raid teams.\n\n` +
        `If you have any questions feel free to ask in the server!`;
    member.user.send({content: msg}).then(() => {
        // stuff
        msg = `### ${greeting[(Math.floor(Math.random() * greeting.length))]}, <@${member.id}>!\n_ _\nWelcome to the community!`;
    }).catch(err => {
        myLog(err);
        if (err.status === 403) {
            myLog('cannot send message to this user, not acccepting DMs')
            msg = `### ${greeting[(Math.floor(Math.random() * greeting.length))]}, <@${member.id}>!\n` +
                `Welcome to the community! I tried to send you a DM but I wasn't able to, so you likely have DMs disabled for this server. ` +
                `Please use the \`/newmember\` command for more information.\n\n` +
                `If you have any questions feel free to ask!`;
        }
    }).finally(() => {
        member.guild.channels.fetch(config.welcomechannel).then(thisChan => {
            if (thisChan && thisChan.type === ChannelType.GuildText) {
                thisChan.send({
                    embeds: [new EmbedBuilder({
                        description: msg,
                        thumbnail: {
                            url: 'https://cdn.discordapp.com/icons/231141125359009793/a_e474c60ca8b04f50663a0442702eedfa.gif?size=128'
                        }
                    })]
                }).catch(myLog);
            }
        }).catch(myLog)
    })
}