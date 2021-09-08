const {config} = require('../config');
const Table = require('easy-table')

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
            let list = [];
            // noinspection EqualityComparisonWithCoercionJS
            const Members = interaction.guild.members.cache.filter(member => member.roles.cache.find(role => role == Role));
            Members.forEach ((member)=> {
                list.push({ "Nickname": member.nickname || member.user.username, "Discord Tag": member.user.tag});
            });
            console.log(list)
                //.map(member => { "Nickname": member.user.username, "Discord Tag": member.user.tag}));
           // interaction.reply({ content: `Users with ${Role.name}:\n${Members.join('\n')}`, ephemeral: true});
            interaction.reply({ content: `Users with \`@${Role.name}\`:\n\`\`\`${Table.print(list)}\`\`\``, ephemeral: true});

        }
        else {
            await interaction.reply({ content: "Command disabled in this channel", ephemeral: true });
        }
    }
};
