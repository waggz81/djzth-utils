import {config} from "../config";
import {Colors, EmbedBuilder, Events, TextChannel} from "discord.js";
import {client, myLog} from "../index";

client.on(Events.GuildMemberRemove, async (member) => {
    let roles = '';
    member.roles.cache.forEach(role => {
        if (role.name !== '@everyone') {
            roles += role.name + '\n'
        }
    });
    roles = roles === '' ? 'no roles' : roles;
    const embed1 = new EmbedBuilder({
        title: `${member.displayName} _(${member.user.tag})_ left the discord`,
        description: `**__Roles:__**\n${roles}`,
        color: Colors.Red,
        footer: {
            text: `Discord ID: ${member.user.id}`
        }
    });
    const channel = member.guild.channels.fetch(config.auditLogChannels.channel)
        .then(thisChan => {
            (thisChan as TextChannel).threads.fetch(config.auditLogChannels.joinsparts).then(thread => {
                if (thread) {
                    if (thread.archived) {
                        thread.setArchived(false).then(() => {
                            thread.send({embeds: [embed1]}).catch(myLog);
                        });
                    }
                } else myLog('Error: Missing joinsparts audit log channel.');
            });
        });
});
