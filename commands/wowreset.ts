import {SlashCommandBuilder} from "@discordjs/builders";
import {Colors, CommandInteraction, EmbedBuilder} from "discord.js";
import {myLog} from "../index";

import * as utc from 'dayjs/plugin/utc'
import * as dayjs from 'dayjs'

dayjs.extend(utc)

module.exports = {
    data: new SlashCommandBuilder()
        .setName("wowreset")
        .setDescription("When does the weekly/daily reset for Retail WoW happen?"),

    async execute(interaction : CommandInteraction) {
        let now = dayjs.utc();
        let dailyresettime = dayjs.utc();
        let weeklyresettime = dayjs.utc();
        const weeklyresetday = 2;
        const resethour = 15; // utc
        if (now.hour() >= resethour) {
            now = now.add(1,"day");
        }
        const midweek = now.day() > weeklyresetday ? 7 : 0;
        dailyresettime = dayjs.utc(now.set("hour", resethour).set("minutes", 0)).utc();
        weeklyresettime = dayjs.utc(now.add(midweek - now.day() + weeklyresetday, 'd').set("hour", resethour).set("minutes", 0));

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

