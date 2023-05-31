import {config} from "../config";
import {SlashCommandBuilder} from "@discordjs/builders";
import {
    CommandInteraction,
    GuildMember,
    Client,
    MessageReaction,
    CacheType,
    Interaction,
    MessageButton, MessageActionRow, Modal, TextInputComponent
} from "discord.js";
import {client, refreshCommands} from "../index";
import * as dayjs from 'dayjs'

const teams: any[] = [];
const teamInfo: any[] = [];
for (const element of Object.entries(config.absences)) {
    console.log(element);
    // @ts-ignore
    teams.push([element[1].team,element[0]]);
    // @ts-ignore
    teamInfo[element[0]] = {teamName: element[1].team, channel: element[1].channel, raidDays: element[1].raidDays, role: element[1].role}
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName("absence")
        .setDescription("Post an absence to your raid team's attendance channel")
        .addStringOption(option =>
            option.setName('team')
                .setDescription('The raid team to post the absence to')
                .setRequired(true)
                .addChoices(teams))
    ,

    async execute(interaction : CommandInteraction) {
        // do stuff
        const team: number = interaction.options.data[0].value as number;
        const days: number[] = teamInfo[team].raidDays;
        const buttons: MessageActionRow[] = getNextRaidDaysButtons(days, team);
        await interaction.reply({ content: `Upcoming raid days for ${teamInfo[team].teamName}`, ephemeral: true, components: buttons });
    }
};

function getNextRaidDaysButtons (validWeekdays: number[], team: number) {
    let day = dayjs();
    let count = 0;
    const buttons = [];
    while (count < 25) {
       // if (teamInfo[teams[0][0]].raidDays.includes(day.day())) {
        if (validWeekdays.includes(day.day())) {
            const button = new MessageButton()
                .setCustomId(`absence-${team}-${day.unix()}`)
                .setLabel(day.format('ddd, MMM D'))
                .setStyle("PRIMARY")
                .setEmoji("🗓️")
            buttons.push(button);
            count++;
        }
        day = day.add(1,"d")
    }
    const rows: MessageActionRow[] = [];
    for (let i=0, j=0;i < 25; i+=5, j++) {
        const row = new MessageActionRow();
        buttons.slice(i, i+5).forEach( btn => {
            row.addComponents(btn);
        })
        rows[j] = row;
    }
    return rows;
}

client.on('interactionCreate', async(interaction: Interaction<CacheType>) => {
    if (!interaction.isButton() && !interaction.isModalSubmit()) return;
    console.log(interaction);
    if (interaction.customId.startsWith('absence')) {
        const absence: any[] = interaction.customId.split('-');
        if (interaction.isButton()) {
            const modal = new Modal()
                .setCustomId(interaction.customId + '-modal')
                .setTitle('Reason');
            const reasonInput = new TextInputComponent()
                .setCustomId('absence-reason-input')
                .setStyle("SHORT")
                .setLabel("Notes")
            // @ts-ignore
            const row = new MessageActionRow().addComponents([reasonInput])
            // @ts-ignore
            modal.addComponents(row)
            await interaction.showModal(modal)
        }
        if (interaction.isModalSubmit()) {
            interaction.update({
                content: `Absence for ${dayjs(absence[2]).format('ddd, MMM D')} added to ${teamInfo[absence[1]].teamName}`,
                components: []
            });
        }
    }
})