import {config} from "../config";
import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    Events,
    ForumChannel,
    GuildMemberFlags,
    Snowflake,
    ThreadAutoArchiveDuration
} from "discord.js";
import {client, myLog, thisServer} from "../index";
import {sendLFGPings} from "../helpers";

client.on(Events.ThreadCreate, async thread => {
    // zth invite ticket
    if (thread.ownerId === '508391840525975553' && thread.name.startsWith('zth-')) {
        let nameAndRealm = '';
        let submitterDiscordId = '';
        setTimeout(() => {
            thread.messages.fetch().then(messages => {
                messages.forEach(message => {
                    message.embeds.forEach(thisEmbed => {
                        if (thisEmbed.fields.length === 5) {
                            nameAndRealm = `${thisEmbed.fields[0].value}-${thisEmbed.fields[1].value}`;
                        } else if (thisEmbed.description) {
                            const re = /<@(.*)>/;
                            const submitterId = thisEmbed.description.match(re);
                            if (submitterId) {
                                submitterId.forEach(match => {
                                    if (thread.members.cache.has(match)) {
                                        submitterDiscordId = match;
                                    }
                                })
                            }
                        }

                    })
                });
                let submitter = thisServer.members.cache.get(submitterDiscordId);
                if (!submitter) {
                    thisServer.members.fetch(submitterDiscordId).then(member => {
                        submitter = member;
                    })
                }
                let submitterNickname = submitter?.nickname ? submitter.nickname : submitter?.displayName;
                const nameCheck = /(.*?)[\s\,\-\/\("]/;
                const match = submitterNickname?.match(nameCheck);
                if (match) {
                    console.log(match)
                    submitterNickname = match[1];
                }
                const notesEmbed = new EmbedBuilder()
                    .setTitle('Copy & Paste for Inviters')
                    .addFields({name: 'Character', value: `\`${nameAndRealm}\``}, {
                        name: 'Guild Note',
                        value: `\`[XFa:${submitterNickname}]\``
                    }, {name: 'Officer Note', value: `\`<@${submitterDiscordId}>\``});
const buttonRow = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(new ButtonBuilder({
        label: 'Ping On-Call', style: ButtonStyle.Primary, customId: 'invites-oncall-' + submitterDiscordId
    }))
    .addComponents(new ButtonBuilder({
        label: 'Sorry We Missed You',
        style: ButtonStyle.Secondary,
        customId: 'invites-miss-' + submitterDiscordId
    }))

                thread.send({embeds: [notesEmbed], components: [buttonRow]}).catch(err => console.log(err));
                if (!submitter?.nickname) {
                    const noServerNameWarningEmbed = new EmbedBuilder()
                        .setTitle('WARNING')
                        .setDescription('Submitter is missing a server nickname. Notify Senior Community Leaders.')
                        .setColor('Red');
                    thread.send({embeds: [noServerNameWarningEmbed]});
                }
            });
        }, 1000 * 3);
    }
    // discord access ticket
    if (/*thread.ownerId === '508391840525975553' &&*/ thread.name.startsWith('discord-')) {
        setTimeout(() => {
            thread.members.fetch().then(member => {
                console.log(member)
                member.forEach(thisMember => {
                    if (!thisMember.guildMember?.roles.cache.has(config.generalaccessrole)) {
                        const user = thisServer.members.cache.get(thisMember.id);
                        if (user) {
                            console.log(user)
                            console.log(user.displayAvatarURL({extension: 'jpg', size: 1024}))
                            const thisEmbed = new EmbedBuilder()
                                .setTitle('User Info')
                                .addFields({
                                    name: 'Joined',
                                    value: user.joinedAt?.toString() || 'Missing Data'
                                })
                                .addFields({
                                    name: 'User Rejoined',
                                    value: user.flags.has(GuildMemberFlags.DidRejoin) ? 'True' : 'False'
                                })
                            console.log(user.flags.has(GuildMemberFlags.DidRejoin))
                            console.log(user.joinedAt)
                            thread.send({embeds: [thisEmbed]});
                            thread.send(user.displayAvatarURL({extension: 'jpg', size: 1024}))
                        }
                    }
                })
            })
        }, 1000 * 3);
    }
    // dj application auto mentions
    const forumsautomention = config.forum_post_auto_mention_roles;
    if (thread.parentId) {
        if (forumsautomention[thread.parentId]) {
            setTimeout(() => {
                thread.messages.fetch().then(msgs => {
                    msgs.last()?.pin();
                }).catch(myLog);
            }, 1000 * 3);
            thread.send(forumsautomention[thread.parentId]).catch(myLog);
            thread.setAutoArchiveDuration(ThreadAutoArchiveDuration.OneWeek).catch(myLog);


        }
    }
    // Auto tag the thread with Pending tags
    const forumsautoapplytag = config.forum_post_auto_apply_tags;
    if (thread.parentId) {
        if (forumsautoapplytag[thread.parentId]) {
            const autotags: Snowflake[] = []
            forumsautoapplytag[thread.parentId].forEach((thistag: string) => {
                const tag = (thread.parent as ForumChannel).availableTags.find(t => t.name.toLowerCase() === thistag.toLowerCase())?.id;
                if (tag) {
                    autotags.push(tag as Snowflake);
                }
            })
            await thread.setAppliedTags(autotags, "Thread Created").catch(myLog);
        }
    }

});

//lfg pings embed
client.on(Events.ThreadCreate, async thread => {
    if (config.lfgpostschannel.includes(thread.parentId)) {
        const lfgchannel = thisServer.channels.cache.get(config.lfgchannel);
        if (lfgchannel && lfgchannel.isTextBased()) {
            setTimeout(() => {
                sendLFGPings(thread, true, null, null);
            }, 1000 * 3) // wait 3 seconds

        }
    }
});
