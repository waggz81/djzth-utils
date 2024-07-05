import {SlashCommandBuilder} from "@discordjs/builders";
import {
    ActionRowBuilder,
    ButtonBuilder, ButtonStyle,
    ChannelType,
    ChatInputCommandInteraction,
    EmbedBuilder,
} from "discord.js";
import {myLog, thisServer} from "../index";
import {joinVoiceChannel} from "@discordjs/voice";
import {config} from "../config";

module.exports = {
    data: new SlashCommandBuilder()
        .setName('buzzer')
        .setDescription('Add a buzzer panel to a voice channel text chat')
        .addChannelOption(option => option
            .setName('channel')
            .setDescription('Voice channel to use')
            .addChannelTypes(ChannelType.GuildVoice)
            .setRequired(true)
        )
        .addIntegerOption(option =>
        option.setName('delay')
            .setDescription('Time in seconds the buzzer is disabled between allowing buzz ins')
            .setMinValue(5)
            .setMaxValue(60)
            .setRequired(true)
        )
    ,
    async execute(interaction: ChatInputCommandInteraction) {
        if (!thisServer.members.cache.get(interaction.user.id)?.roles.cache.has(config.moderatorrole)) {
            await interaction.reply({content: "You do not have permission to use this command.", ephemeral: true});
        }
        const chan = interaction.options.getChannel('channel')!;
        const panel = new EmbedBuilder()
            .setTitle("Buzzer Panel")
        const buzzButton = new ButtonBuilder()
            .setCustomId('buzz')
            .setLabel('Buzz!')
            .setCustomId(`buzzerButton:-:${interaction.options.getInteger('delay')!}`)
            .setStyle(ButtonStyle.Primary);
        const row = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(buzzButton);
        if ("send" in chan) {
            await chan.send({content: "_ _", embeds: [panel], components: [row]})
                .then((res) => {
                    interaction.reply({content: `Buzzer panel created in ${res.url}`, ephemeral: true})
                })
                .catch((err)=>{myLog(err)})
        }
        const connection = joinVoiceChannel({
            channelId: chan.id,
            guildId: interaction.guild!.id,
            adapterCreator: interaction.guild!.voiceAdapterCreator
        });
    },
};