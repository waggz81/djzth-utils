module.exports = {
    name: 'removerole',
    description: 'Remove a role from a user',
    options: [
        {
            name: 'target',
            description: 'Select a user',
            type: 'USER',
            required: true,
        },
        {
            name: 'role',
            description: 'Select a role',
            type: 'ROLE',
            required: true,
        },
    ],
    ephemeral: true,
    async execute(interaction) {
        console.log(interaction.options.get('target').member);
        const target = interaction.options.get('target').user.username + '#' + interaction.options.get('target').user.discriminator;
        await interaction.reply({content: `Removed \`@${interaction.options.get('role').role.name}\` from \`${target}\`!`, ephemeral: true});
    },
};