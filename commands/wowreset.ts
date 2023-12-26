import {config} from "../config";
import {SlashCommandBuilder} from "@discordjs/builders";
import {Colors, CommandInteraction, EmbedBuilder} from "discord.js";
import {myLog} from "../index";
import dayjs = require("dayjs");


var utc = require('dayjs/plugin/utc')
var timezone = require('dayjs/plugin/timezone') // dependent on utc plugin

dayjs.extend(utc)
dayjs.extend(timezone)

module.exports = {
    data: new SlashCommandBuilder()
        .setName("wowreset")
        .setDescription("When does the weekly/daily reset for Retail WoW happen?"),

    async execute(interaction : CommandInteraction) {
        let weeklyresettime = dayjs.unix(1702393200);
        let dailyresettime = weeklyresettime;
        const now = dayjs();
        while (now > weeklyresettime) {
            weeklyresettime = weeklyresettime.add(7,'d');
        }
        while (now > dailyresettime) {
            dailyresettime = dailyresettime.add(1,'d');
        }
        const embed = new EmbedBuilder({
            title: `WoW Retail Resets:`,
            description: ``,
            color: Colors.Blue,
        }).addFields(
            { name: 'Weekly Reset:', value: `<t:${weeklyresettime.unix()}:F>\n(<t:${weeklyresettime.unix()}:R>)` },
            { name: 'Daily Reset:', value: `<t:${dailyresettime.unix()}:F>\n(<t:${dailyresettime.unix()}:R>)` },
        )
        await interaction.deferReply({ephemeral: true});
        await interaction.editReply({embeds: [embed]})
            .catch((err) => myLog(err))
    }
};

