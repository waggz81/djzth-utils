import {SlashCommandBuilder} from "@discordjs/builders";
import {CommandInteraction, Message, MessageEmbed} from "discord.js";
import {raidTeamInfoChannel, raidTeamInfoPosts} from "../index";
import {config} from "../config";


const choices: (string | null)[][] = [];
raidTeamInfoPosts.forEach(post => {
    // console.log(post.embeds[0].title)
    choices.push([post.embeds[0].title, post.id])
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
                        .setRequired(false)))

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
        ),

    async execute(interaction: CommandInteraction) {
        if (config.raidteaminfochannel.includes(interaction.channelId)) {
            const submission = interaction.options.data[0];
            if (submission.name === "new") {
                console.log("new");
                const embed = new MessageEmbed()
                    .setTitle(interaction.options.get('teamname')?.value as string)
                    .setDescription(interaction.options.get('description')?.value as string)
                    .addFields(
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
                    )
                    .setFooter({text: "Last Updated by " + interaction.user.tag})
                    .setTimestamp(Date.now())

                await raidTeamInfoChannel.send({embeds: [embed]})

            } else {
                console.log("edit");
                raidTeamInfoChannel.messages.fetch(interaction.options.get('teamname')?.value as string)
                    .then(message => {
                        console.log(message)
                        const embed = new MessageEmbed()
                            .setTitle(message.embeds[0].title as string)
                            .setDescription(interaction.options.get('description')?.value as string || message.embeds[0].description as string)
                            .addFields(
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
                            .setFooter({text: "Last Updated by " + interaction.user.tag})
                            .setTimestamp(Date.now())
                        message.edit({embeds: [embed]})
                    })
            }

            await interaction.reply({content: 'Done!', ephemeral: true});
        }
        else {
            await interaction.reply({ content: "Command disabled in this channel", ephemeral: true });
        }
    }
};
