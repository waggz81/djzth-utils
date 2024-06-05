import {config} from "../config";
import {EmbedBuilder, Events, ThreadAutoArchiveDuration, ForumChannel} from "discord.js";
import {client, myLog, thisServer} from "../index";

client.on(Events.ThreadCreate, async thread => {
    if (thread.ownerId === '508391840525975553' && thread.name.startsWith('zth-')) {
        let nameAndRealm = '';
        let submitterDiscordId = '';
        console.log("zth invite ticket thread created " + thread.id)
        setTimeout(() => {
            thread.messages.fetch().then(messages => {
                messages.forEach(message => {
                   message.embeds.forEach(thisEmbed => {
                       if (thisEmbed.fields.length === 5) {
                           nameAndRealm = `${thisEmbed.fields[0].value}-${thisEmbed.fields[1].value}`;
                       }
                       else if (thisEmbed.description){
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
                    .addFields(
                        { name: 'Character', value: `\`${nameAndRealm}\`` },
                        { name: 'Guild Note', value: `\`[XFa:${submitterNickname}]\``},
                        { name: 'Officer Note', value: `\`<@${submitterDiscordId}>\``}
                    );

                thread.send({embeds: [notesEmbed]}).catch(err => console.log(err));
                let missingGeneralAccessRole = false;
                if (!submitter?.roles.cache.has(config.generalaccessrole)) {
                    const noGeneralAccessWarningEmbed = new EmbedBuilder()
                        .setTitle('WARNING')
                        .setDescription('Submitter is missing the Community Member role. Ensure a Discord Access Ticket is opened.')
                        .setColor('Red');
                    thread.send({embeds: [noGeneralAccessWarningEmbed]});
                    missingGeneralAccessRole = true;
                }
                if (!submitter?.nickname && !missingGeneralAccessRole) {
                    const noServerNameWarningEmbed = new EmbedBuilder()
                        .setTitle('WARNING')
                        .setDescription('Submitter is missing a server nickname. Notify Senior Community Leaders.')
                        .setColor('Red');
                    thread.send({embeds: [noServerNameWarningEmbed]});
                }
            });
        }, 1000 * 3);
    }
    // dj application auto mentions
    const forums = config.forum_post_auto_mention_roles;
    if (thread.parentId) {
        if (forums[thread.parentId]) {
            setTimeout(() => {
                thread.messages.fetch().then(msgs => {
                    msgs.last()?.pin();
                }).catch(myLog);
            }, 1000 * 3);
            thread.send(forums[thread.parentId]).catch(myLog);
            thread.setAutoArchiveDuration(ThreadAutoArchiveDuration.OneWeek).catch(myLog);

            // Auto tag the thread with Pending tag
            const tag = (thread.parent as ForumChannel).availableTags.find(t => t.name.toLowerCase() === "pending");
            if (tag) await thread.setAppliedTags([tag], "Thread Created").catch(myLog);
        }
    }
});
