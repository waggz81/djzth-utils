import {config} from "../config";
import {EmbedBuilder, Events, ThreadAutoArchiveDuration} from "discord.js";
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
                const notesEmbed = new EmbedBuilder()
                    .setTitle('Copy & Paste')
                    .addFields(
                        { name: 'Character', value: `\`${nameAndRealm}\`` },
                        { name: 'Guild Note', value: `\`[XFa:${thisServer.members.cache.get(submitterDiscordId)?.nickname}]\``},
                        { name: 'Officer Note', value: `\`<@${submitterDiscordId}>\``}
                    );
                thread.send({embeds: [notesEmbed]}).catch(err => console.log(err));
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
        }
    }
});
