import {config} from "../config";
import {SlashCommandBuilder} from "@discordjs/builders";
import {APIApplicationCommandOptionChoice,
    Colors,
    CommandInteraction,
    EmbedBuilder,
    GuildMember,
    Message,
    MessagePayload,
    TextChannel
} from "discord.js";
import {myLog} from "../index";

const teams: APIApplicationCommandOptionChoice<string> | { name: string; value: string; }[] = []
for (const element of Object.entries(config.suggestionChannels)) {
    teams.push({ name: element[0], value: element[0]});
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName("suggestion")
        .setDescription("Submit a suggestion to a leadership team. Submit a pastebin/google doc link if necessary.")
        .addStringOption(option =>
            option.setName('team')
                .setDescription('The leadership team to post the suggestion to')
                .setRequired(true)
                .addChoices(teams))
        .addStringOption(option =>
            option.setName('suggestion')
                .setDescription('What is your suggestion?')
                .setRequired(true)),

    async execute(interaction : CommandInteraction) {
        const embed = new EmbedBuilder({
            title: `New Suggestion for <${interaction.options.getString('team')}>`,
            description: interaction.options.getString('suggestion'),
            color: Colors.Blue,
            footer: {
                "text": "Suggested by: " + (interaction.member as GuildMember).user.tag + " (" + (interaction.member as GuildMember).displayName + ")"
            },
            timestamp: Date.now()
        })
        const chanID = config.suggestionChannels[interaction.options.getString('team')]
        await interaction.deferReply({ephemeral: true});
        (interaction.guild?.channels.cache.get(chanID) as TextChannel)?.send({
            content: "_ _",
            embeds: [embed]
        })
            .then(() => {
                interaction.editReply({content: "Suggestion submitted!", embeds: [embed]})
            })
            .catch((err) => {
                myLog(err)
                interaction.editReply({content: "Error: Notify Waggz"})
            })

    }
};

