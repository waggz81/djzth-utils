import {config} from "../config";
import {SlashCommandBuilder} from "@discordjs/builders";
import {
    ActionRowBuilder,
    CacheType,
    ChannelType,
    CommandInteraction,
    EmbedBuilder,
    ForumChannel,
    GuildForumTagData,
    Interaction,
    ModalBuilder,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
    TextInputBuilder,
    TextInputStyle,
    ThreadChannel
} from "discord.js";
import {client, myLog} from "../index";
import * as dayjs from 'dayjs'

const teams: any[] = [];
const teamInfo: any[] = [];
if (typeof (config.absences) !== undefined) {
    for (const element of Object.entries(config.absences)) {
        // @ts-ignore
        teams.push({ name: element[1].team, value: element[0]});
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

function getNextRaidDaysSelectMenu(validWeekdays: number[], team: number) {
    let day = dayjs();
    let count = 0;
    const options: StringSelectMenuOptionBuilder[] = [];
    while (count < 25) {
        // if (teamInfo[teams[0][0]].raidDays.includes(day.day())) {
        if (validWeekdays.includes(day.day())) {
            const option = new StringSelectMenuOptionBuilder({
                value: `absence-${team}-${day.unix()}`,
                label: day.format('ddd, MMM D'),
            });
            options.push(option);
            count++;
        }
        day = day.add(1, "d")
    }
    return options;
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

    async execute(interaction: CommandInteraction) {
        const team: number = interaction.options.data[0].value as number;
        const role = teamInfo[team].role;

        if (interaction.guild?.members.cache.get(interaction.user.id)?.roles.cache.has(role)) {
            // await interaction.reply({ content: `_ _\nHere are the upcoming raid days for ${teamInfo[team].teamName}. Make your selection(s) and then click outside the box and your absence(s) will be posted automatically.`, ephemeral: true, components: [row] });
            const modal = new ModalBuilder({
                customId: `absence<fieldsep>${team}<fieldsep>modal`,
                title: 'Reason for absence'
            });
            const reasonInput = new TextInputBuilder({
                customId: 'absence-reason-input',
                style: TextInputStyle.Short,
                label: "Add a comment (or press Submit to skip)",
                placeholder: "This field is limited to 70 characters",
                required: false
            });

            const row = new ActionRowBuilder<TextInputBuilder>().addComponents([reasonInput])
            modal.addComponents(row)
            await interaction.showModal(modal)
        } else {
            await interaction.reply({
                content: `_ _\nYou don't have the correct role to submit absences for ${teamInfo[team].teamName}`,
                ephemeral: true
            });
        }
    }
};


client.on('interactionCreate', async (interaction: Interaction<CacheType>) => {
    if (!interaction.isStringSelectMenu() && !interaction.isModalSubmit()) return;
    if (!interaction.customId.startsWith('absence')) return;
    const team = Number(interaction.customId.split('<fieldsep>')[1]);
    const days: number[] = teamInfo[team].raidDays;
    if (interaction.isModalSubmit()) {
        const select = new StringSelectMenuBuilder({
            customId: `absence<fieldsep>${team}<fieldsep>${interaction.fields.getTextInputValue('absence-reason-input').slice(0,70)}`,
            placeholder: 'Select the date(s).',
            minValues: 1,
            maxValues: 20
        }).addOptions(getNextRaidDaysSelectMenu(days, team));
        const row = new ActionRowBuilder<StringSelectMenuBuilder>()
            .addComponents(select);
        const embed = new EmbedBuilder({
            description: `Below are the upcoming raid days for ${teamInfo[team].teamName}. Choose the date(s) you'll be absent and posts will be made for each date selected. Click the \`^\` or outside the selection menu to continue.`
        }).addFields({
            name: 'Reason Entered',
            value: interaction.fields.getTextInputValue('absence-reason-input').slice(0,70) || 'None',
            inline: false
        })
        interaction.reply({content: `_ _`, ephemeral: true, components: [row], embeds: [embed]});
    }
    if (interaction.isStringSelectMenu()) {
        const embed = new EmbedBuilder({
            description: interaction.customId.split('<fieldsep>')[2]
        }).setAuthor({
            name: interaction.guild?.members.cache.get(interaction.user.id)?.displayName as string,
            iconURL: interaction.guild?.members.cache.get(interaction.user.id)?.displayAvatarURL()
        })

        const chan = interaction.guild?.channels.cache.get(teamInfo[team].channel) as ForumChannel;

        if (chan?.type !== ChannelType.GuildForum) {
            interaction.update({
                content: `\`\`\`Unable to create absence post for ${teamInfo[team].teamName}. Tell Waggz.\`\`\``,
                components: []
            });
            return;
        }
        let absences = '';

        await Promise.all(interaction.values.map(async entry => {
            const absence = entry.split('-');
            const date = dayjs.unix(Number(absence[2])).format('ddd, MMM D YYYY');
            absences += `**${date}**\n`;
            createAbsencePost(embed, chan, date).catch(myLog)
        })).then(() => {
            const reply = new EmbedBuilder({
                description: `Absence(s) added to ${teamInfo[team].teamName}:\n\n${absences}`
            });
            interaction.update({
                content: '_ _', embeds: [reply],
                components: []
            });
        })
    }
})

async function createAbsencePost(embed: EmbedBuilder, parentChannel: ForumChannel, date: string) {
    const post = parentChannel.threads.cache.find(x => x.name === date);
    if (post) {
        // add to post
        post.send({embeds: [embed]}).catch(myLog)
    } else {
        await parentChannel.threads.create({
            message: {content: date},
            name: date
        }).then(thisPost => {
            thisPost.send({embeds: [embed]}).catch(myLog);
            addMonthTag(thisPost, dayjs(date).format('MMM'));
        })
    }
    return true;
}

async function addMonthTag(post: ThreadChannel, tagName: string) {
    if (!post.parent) return false;
    if (post.parent.type !== ChannelType.GuildForum) return false;
    const parent = post.parent as ForumChannel;
    let tags = getTags(parent)
    const newTags: string[] = [];
    const tag = tags.find(x => x.name === tagName);
    if (!tag) {
        tags.push({name: tagName})
        parent.setAvailableTags(tags).then(thisChan => {
            tags = getTags(parent);
            newTags.push(tags.find(x => x.name === tagName)?.id as string);
            post.setAppliedTags(newTags).catch(myLog);
        })
    } else {
        newTags.push(tag.id as string);
        post.setAppliedTags(newTags).catch(myLog);
    }
}

function getTags(chan: ForumChannel) {
    const tags: GuildForumTagData[] = [];
    chan.availableTags.forEach(thisTag => {
        tags.push({
            name: thisTag.name,
            id: thisTag.id
        });
    })
    return tags;
}
