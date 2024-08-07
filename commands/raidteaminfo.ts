import {SlashCommandBuilder, SlashCommandStringOption} from "@discordjs/builders";
import {APIApplicationCommandOptionChoice, CommandInteraction, EmbedBuilder, GuildMember} from "discord.js";
import {myLog, raidTeamInfoChannel, raidTeamInfoPosts} from "../index";
import {config} from "../config";


const choices: APIApplicationCommandOptionChoice<string> | { name: string; value: string; }[] = [];
raidTeamInfoPosts.forEach(post => {
    if (post.embeds[0] && post.embeds[0].title && post.id) {
        choices.push({ name: post.embeds[0].title, value: post.id})
    }
})

module.exports = {
    data: new SlashCommandBuilder()
        .setName("raidteaminfo")
        .setDescription("Update Raid Team Info Embeds")
        .addSubcommand(subcommand =>
            subcommand
                .setName('edit')
                .setDescription('Edit an existing raid team info embed')
                .addStringOption(option =>
                    option.setName('teamname')
                        .setDescription('Raid Team Name')
                        .setRequired(true)
                        // @ts-ignore
                        .addChoices(choices))
                .addStringOption(option =>
                    option.setName('schedule')
                        .setDescription("What is the raid team's schedule?")
                        .setRequired(false))
                .addStringOption(option =>
                    option.setName('progression')
                        .setDescription("What is the raid team's current progression?")
                        .setRequired(false))
                .addStringOption(option =>
                    option.setName('requirements')
                        .setDescription("What are the requirements to be a team member?")
                        .setRequired(false))
                .addStringOption(option =>
                    option.setName('contacts')
                        .setDescription("Who should be contacted for recruitment?")
                        .setRequired(false))
                .addStringOption(option =>
                    option.setName('currentneeds')
                        .setDescription("What roles or classes is the team in need of?")
                        .setRequired(false))
                .addStringOption(option =>
                    option.setName('description')
                        .setDescription("Enter a short description of the team/goals")
                        .setRequired(false))
                .addStringOption(option =>
                    option.setName('game')
                        .setDescription('game')
                        .setRequired(false)
                        .addChoices(
                            {name: 'Retail', value: 'retail'},
                            {name:'Classic', value: 'classic'},
                            {name:'FFXIV', value: 'ffxiv'}
                        )))

        .addSubcommand(subcommand =>
            subcommand
                .setName('new')
                .setDescription('Add a raid team info new embed')
                .addStringOption(option =>
                    option.setName('teamname')
                        .setDescription("What is the raid team name?")
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('schedule')
                        .setDescription("What is the raid team's schedule?")
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('progression')
                        .setDescription("What is the raid team's current progression?")
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('requirements')
                        .setDescription("What are the requirements to be a team member?")
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('contacts')
                        .setDescription("Who should be contacted for recruitment?")
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('currentneeds')
                        .setDescription("What roles or classes is the team in need of?")
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('description')
                        .setDescription("Enter a short description of the team/goals")
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('game')
                        .setDescription('game')
                        .setRequired(true)
                        .addChoices(
                            {name: 'Retail', value: 'retail'},
                            {name:'Classic', value: 'classic'},
                            {name:'FFXIV', value: 'ffxiv'}))
        ),

    async execute(interaction: CommandInteraction) {
        if (config.raidteaminfochannel.includes(interaction.channelId)) {
            let member: GuildMember;
            interaction.guild?.members.fetch(interaction.user.id)
                .then((res) => {
                    member = res;
                    const submission = interaction.options.data[0];
                    let thumbnail: string;
                    switch (interaction.options.get('game')?.value as string) {
                        case 'retail':
                            thumbnail = 'https://i.imgur.com/8jYTKiX.png';
                            break;
                        case 'classic':
                            thumbnail = 'https://i.imgur.com/cJdv6dH.png';
                            break;
                        case 'ffxiv':
                            thumbnail = 'https://i.imgur.com/7gkXva9.png';
                            break;
                        default:
                            thumbnail = '';
                    }

                    if (submission.name === "new") {
                        myLog("new");
                        const embed = new EmbedBuilder({
                            title: interaction.options.get('teamname')?.value as string,
                            description: interaction.options.get('description')?.value as string,
                            footer: {text: "Last Updated by " + member.displayName},
                            timestamp: Date.now(),
                            thumbnail: {url: thumbnail}
                        }).addFields(
                                {
                                    name: 'Schedule',
                                    value: interaction.options.get('schedule')?.value as string
                                },
                                {
                                    name: 'Current Progression',
                                    value: interaction.options.get('progression')?.value as string
                                },
                                {
                                    name: 'Recruitment Contacts',
                                    value: interaction.options.get('contacts')?.value as string
                                },
                                {
                                    name: 'Requirements',
                                    value: interaction.options.get('requirements')?.value as string
                                },
                                {
                                    name: 'Currently Recruiting',
                                    value: interaction.options.get('currentneeds')?.value as string
                                },
                            );
                        raidTeamInfoChannel.send({embeds: [embed]})

                    } else {
                        myLog("edit");
                        raidTeamInfoChannel.messages.fetch(interaction.options.get('teamname')?.value as string)
                            .then(message => {
                                myLog(message)
                                const embed = new EmbedBuilder({
                                    title: message.embeds[0].title as string,
                                    description: interaction.options.get('description')?.value as string || message.embeds[0].description as string,
                                    footer: {text: "Last Updated by " + member.displayName},
                                    timestamp: Date.now(),
                                    thumbnail: {url:thumbnail || message.embeds[0].thumbnail?.url || ''}
                                }).addFields(
                                        {
                                            name: 'Schedule',
                                            value: interaction.options.get('schedule')?.value as string || message.embeds[0].fields[0].value
                                        },
                                        {
                                            name: 'Current Progression',
                                            value: interaction.options.get('progression')?.value as string || message.embeds[0].fields[1].value
                                        },
                                        {
                                            name: 'Recruitment Contacts',
                                            value: interaction.options.get('contacts')?.value as string || message.embeds[0].fields[2].value
                                        },
                                        {
                                            name: 'Requirements',
                                            value: interaction.options.get('requirements')?.value as string || message.embeds[0].fields[3].value
                                        },
                                        {
                                            name: 'Currently Recruiting',
                                            value: interaction.options.get('currentneeds')?.value as string || message.embeds[0].fields[4].value
                                        },
                                    )

                                message.edit({embeds: [embed]})
                            })
                    }

                    interaction.reply({content: 'Done!', ephemeral: true});
                })
        } else {
            await interaction.reply({content: "Command disabled in this channel", ephemeral: true});
        }
    }
};
