import {config} from "../config";
import {SlashCommandBuilder} from "@discordjs/builders";
import {
    ActionRowBuilder, Base, BaseInteraction,
    ButtonBuilder,
    ButtonStyle,
    CacheType,
    ChannelType,
    CommandInteraction,
    EmbedBuilder,
    ForumChannel,
    GuildForumTagData,
    Interaction,
    ModalBuilder, ModalMessageModalSubmitInteraction,
    TextInputBuilder,
    TextInputStyle
} from "discord.js";
import {client} from "../index";
import * as dayjs from 'dayjs'

const teams: any[] = [];
const teamInfo: any[] = [];
if (typeof(config.absences) !== undefined) {
    for (const element of Object.entries(config.absences)) {
        // @ts-ignore
        teams.push([element[1].team, element[0]]);
        // @ts-ignore
        teamInfo[element[0]] = {
            // @ts-ignore
            teamName: element[1].team,
            // @ts-ignore
            channel: element[1].channel,
            // @ts-ignore
            raidDays: element[1].raidDays,
            // @ts-ignore
            role: element[1].role
        }
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName("attendance")
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
        const role = teamInfo[team].role;
        const days: number[] = teamInfo[team].raidDays;
        const buttons: ActionRowBuilder<ButtonBuilder>[] = getNextRaidDaysButtons(days, team);
        if (interaction.guild?.members.cache.get(interaction.user.id)?.roles.cache.has(role)) {
            await interaction.reply({ content: `Upcoming raid days for ${teamInfo[team].teamName}`, ephemeral: true, components: buttons });
        }
        else {
            await interaction.reply({ content: `You don't have the correct role to submit absences for ${teamInfo[team].teamName}`, ephemeral: true});
        }
    }
};

function getNextRaidDaysButtons (validWeekdays: number[], team: number) {
    let day = dayjs();
    let count = 0;
    const buttons = [];
    while (count < 25) {
       // if (teamInfo[teams[0][0]].raidDays.includes(day.day())) {
        if (validWeekdays.includes(day.day())) {
            const button = new ButtonBuilder({
                customId: `absence-${team}-${day.unix()}`,
                label: day.format('ddd, MMM D'),
                style: ButtonStyle.Primary,
                emoji: "🗓️"
            });
            buttons.push(button);
            count++;
        }
        day = day.add(1,"d")
    }
    const rows: ActionRowBuilder<ButtonBuilder>[] = [];
    for (let i=0, j=0;i < 25; i+=5, j++) {
        const row = new ActionRowBuilder<ButtonBuilder>();
        buttons.slice(i, i+5).forEach( btn => {
            row.addComponents(btn);
        })
        rows[j] = row;
    }
    return rows;
}

client.on('interactionCreate', async(interaction: Interaction<CacheType>) => {
    if (!interaction.isButton() && !interaction.isModalSubmit()) return;
    if (interaction.customId.startsWith('absence')) {
        const absence: any[] = interaction.customId.split('-');
        if (interaction.isButton()) {
            const modal = new ModalBuilder({
                customId: interaction.customId + '-modal',
                title: 'Comment'
            });
            const reasonInput = new TextInputBuilder({
                customId: 'absence-reason-input',
                style: TextInputStyle.Short,
                label: "Add a comment (or press Submit to skip)",
                placeholder: "Not required, press Submit to continue",
                required: false
            });

            const row = new ActionRowBuilder<TextInputBuilder>().addComponents([reasonInput])
            modal.addComponents(row)
            await interaction.showModal(modal)
        }
        if (interaction.isModalSubmit()) {
            const reason = interaction.fields.getTextInputValue('absence-reason-input');
            const embed = new EmbedBuilder({
                description: reason
            }).setAuthor({
                    name: interaction.guild?.members.cache.get(interaction.user.id)?.displayName as string,
                    iconURL: interaction.guild?.members.cache.get(interaction.user.id)?.displayAvatarURL()
                })

            const message = { embeds: [embed]}
            const chan = interaction.guild?.channels.cache.get(teamInfo[absence[1]].channel) as ForumChannel;
            const date = dayjs.unix(absence[2]).format('ddd, MMM D YYYY');
            const tags: GuildForumTagData[] = [];
            chan.availableTags.forEach(tag => {
                tags.push({
                    name: tag.name,
                    id: tag.id});
            })
            if (chan?.type !== ChannelType.GuildForum) {
                if (interaction.isFromMessage()) {
                    interaction.update({
                        content: `\`\`\`Unable to create absence post for ${teamInfo[absence[1]].teamName}. Tell Waggz.\`\`\``,
                        components: []
                    });
                }
            }
            else {
                const post = chan.threads.cache.find(x => x.name === date);
                if (post) {
                    // add to post
                    post.send(message)
                }
                else {
                    // create new post
                    const newPost = await chan.threads.create({
                        message: {content: date},
                        name: date
                    });
                    newPost.send(message);
                    const newTags = [];
                    const tag = chan.availableTags.find(x => x.name === dayjs(date).format('MMM'));
                    if (!tag) {
                        tags.push({name: dayjs(date).format('MMM')})
                        await chan.setAvailableTags(tags).then( () => {
                            newTags.push (chan.availableTags.find(x => x.name === dayjs(date).format('MMM'))?.id);
                        })
                    }
                    else {
                        newTags.push(tag.id);
                    }
                    await newPost.setAppliedTags(newTags)
                }
                const reply = new EmbedBuilder({
                    description: `Absence for ${date} added to ${teamInfo[absence[1]].teamName}`
                });
                if (interaction.isFromMessage()) {
                    interaction.update({
                        content: '_ _', embeds: [reply],
                        components: []
                    });
                }
            }

        }
    }
})