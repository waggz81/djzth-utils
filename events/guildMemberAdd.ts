import {config} from "../config";
import {Colors, EmbedBuilder, Events, TextChannel} from "discord.js";
import {client, myLog, thisServer} from "../index";

client.on(Events.GuildMemberAdd, async (member) => {
    await thisServer.members.fetch(member.id);
    const embed1 = new EmbedBuilder({
        title: `_${member.user.tag}_ joined the discord`,
        color: Colors.Green,
        footer: {
            text: `Discord ID: ${member.user.id}`
        }
    });
    member.guild.channels.fetch(config.auditLogChannels.channel)
        .then(thisChan => {
            (thisChan as TextChannel).threads.fetch(config.auditLogChannels.joinsparts).then(thread => {
                if (thread) {
                    thread.setArchived(false).then(() => {
                        thread.send({embeds: [embed1]}).catch(myLog);
                    });
                } else myLog('Error: Missing joinsparts audit log channel.');
            })
        })
        .catch(myLog)
});
