import {config} from "../config";
import {Events, PermissionsBitField} from "discord.js";
import {client, myLog} from "../index";

client.on(Events.MessageCreate, message => {
    if (message.author.id === client.user!.id || message.channel.isThread()) return;
    if (message.mentions.roles) {
        let filterMention = false;
        let unapprovedRole = '';
        message.mentions.roles.forEach(thisRole => {
            if (message.guild) {
                message.guild.members.fetch(message.author.id).then(author => {
                    if (config.approved_roles.indexOf(thisRole.id) !== -1 && !author.roles.cache.has(thisRole.id) && !author.permissions.has(PermissionsBitField.Flags.MentionEveryone)) {
                        filterMention = true;
                        unapprovedRole += `, \`@${thisRole.name}\``;
                    }
                }).catch(myLog)
            }
        });
        if (filterMention) {
            message.delete()
                .then(msg => {
                    msg.channel.send(`Sorry <@${msg.author.id}>, your message was removed for containing a designated role mention you are not a member of. The following roles were identified: ${unapprovedRole.substring(2)}`)
                        .catch(myLog);
                    return false;
                }).catch(myLog);
        }
    }
    if (config.removeEmbeds.indexOf(message.channel.id) !== -1) {
        setTimeout(() => {
            message.suppressEmbeds(true).catch(myLog)
        }, 1000 * 3);
    }
});
