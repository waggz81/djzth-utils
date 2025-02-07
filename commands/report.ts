import {
    ContextMenuCommandBuilder,
    ApplicationCommandType,
    TextChannel,
    MessageContextMenuCommandInteraction, Message
} from 'discord.js';
import {myLog, thisServer} from "../index";
import {config} from "../config";
const moderatorchannel = thisServer.channels.cache.get(config.moderatorchannel) as TextChannel;

module.exports = {
    data: new ContextMenuCommandBuilder()
        .setName('Report Message')
        .setType(ApplicationCommandType.Message),

    async execute(interaction : MessageContextMenuCommandInteraction) {
        await interaction.deferReply({ephemeral: true});
        console.log(interaction);
        moderatorchannel.send(`<@${interaction.user.id}> reported message https://discord.com/channels/${interaction.options.data[0].message?.guildId}/${interaction.options.data[0].message?.channelId}/${interaction.options.data[0].message?.id}`)
            .then((message : Message) => {
                interaction.editReply({content: "Message reported to community leadership!"});
            })
            .catch((err : Error) => {
                myLog(err)
            })
    }
};
