const {config} = require('../config');

module.exports = {
    name: 'listrole',
    description: 'List all users with a specific role',
    options: [
        {
            name: 'role',
            description: 'Select a role',
            type: 'ROLE',
            required: true,
        },
    ],
    ephemeral: true,
    async execute(interaction) {
        const Role = interaction.options.get('role').role;
        if (config.access_control.includes(interaction.channelId)) {
            const Members = interaction.guild.members.cache.filter(member => member.roles.cache.find(role => role == Role)).map(member => `${member.user.username}  (${member.user.tag})`);
            interaction.reply({ content: `Users with ${Role.name}:\n${Members.join('\n')}`, ephemeral: true});
        }
        else {
            await interaction.reply({ content: "Command disabled in this channel", ephemeral: true });
        }
    }
};
