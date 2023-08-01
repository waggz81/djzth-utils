import {config} from "../config";
import {Colors, EmbedBuilder, Events, TextChannel} from "discord.js";
import {client, myLog} from "../index";

client.on(Events.MessageDelete, async (message) => {
    if (message.partial) {
        message.fetch().then(msg => {
            message = msg;
        }).catch(myLog);
    }
    let author = 'unknown user';
    let authorURL = 'https://i.imgur.com/pGIb1qm.png';
    if (message.author && message.guild) {
        message.guild.members.fetch(message.author.id).then(member => {
            author = `${member.displayName} (${member.user.tag})`;
            authorURL = member.displayAvatarURL() || 'https://i.imgur.com/pGIb1qm.png';
            const embed1 = new EmbedBuilder({
                title: `had a message deleted in ${message.channel}`,
                description: 'Check the audit log for details. Original message is below:',
                author: {
                    name: author,
                    iconURL: authorURL
                },
                color: Colors.Red
            });
            const msgContent = message.cleanContent ? message.cleanContent : message.content;
            const embed2 = new EmbedBuilder({
                description: msgContent || 'uncached message content, unable to display',
                footer: {text: `Message ID: ${message.id}`},
                color: Colors.Red
            });
            if (message.guild) {
                message.guild.channels.fetch(config.auditLogChannels.channel).then(thisChan => {
                    (thisChan as TextChannel).threads.fetch(config.auditLogChannels.messages).then(thread => {
                        if (thread) {
                            thread.setArchived(false).then(() => {
                                thread.send({embeds: [embed1, embed2]}).catch(myLog);
                            }).catch(myLog)
                        } else myLog('Error: Missing messages audit log channel.')
                    })
                })
            }
        });
    }
    if (message.partial) {
        const embed1 = new EmbedBuilder({
            title: `had a message deleted in ${message.channel}`,
            description: 'There is no additional information available for this un-cached message.',
            author: {
                name: 'Unknown User',
                iconURL: 'https://i.imgur.com/pGIb1qm.png'
            },
            color: Colors.Red
        });
        if (message.guild) {
            message.guild.channels.fetch(config.auditLogChannels.channel).then(thisChan => {
                (thisChan as TextChannel).threads.fetch(config.auditLogChannels.messages).then(thread => {
                    if (thread) {
                        thread.setArchived(false).then(() => {
                            thread.send({embeds: [embed1]}).catch(myLog);
                        }).catch(myLog)
                    } else myLog('Error: Missing messages audit log channel.')
                })
            })
        }
    }
});
