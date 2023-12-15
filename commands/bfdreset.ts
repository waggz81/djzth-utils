import {config} from "../config";
import {SlashCommandBuilder} from "@discordjs/builders";
import {Colors, CommandInteraction, EmbedBuilder} from "discord.js";
import {myLog} from "../index";
import dayjs = require("dayjs");

let resettime = dayjs.unix(1701874800);
let lastreset = resettime;
const now = dayjs();


while (now > resettime) {
    lastreset = resettime;
    resettime = resettime.add(3,'d')
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName("bfdreset")
        .setDescription("When does BFD reset for Classic Season of Discovery?"),

    async execute(interaction : CommandInteraction) {
        const embed = new EmbedBuilder({
            title: `Blackfathom Deeps resets:`,
            description: ``,
            color: Colors.Blue,
        }).addFields(
            { name: 'Next Reset:', value: `<t:${resettime.unix()}:F>\n(<t:${resettime.unix()}:R>)` },
            { name: 'Last Reset:', value: `<t:${lastreset.unix()}:F>\n(<t:${lastreset.unix()}:R>)` },
        )
        await interaction.deferReply({ephemeral: false});
        await interaction.editReply({embeds: [embed]})
            .catch((err) => myLog(err))
    }
};

