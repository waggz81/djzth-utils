import {SlashCommandBuilder} from "@discordjs/builders";
import {CommandInteraction} from "discord.js";
import {refreshCommands} from "../index";

module.exports = {
    data: new SlashCommandBuilder()
        .setName("refreshcommands")
        .setDescription("Update Bot Commands"),

    async execute(interaction : CommandInteraction) {
        await refreshCommands(interaction.guild!, true);
        await interaction.reply({ content: 'Done!', ephemeral: true });
    }
};
