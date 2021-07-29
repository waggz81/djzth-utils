const config = require('../config.json');
const {addRolePending} = require('../db.js');

module.exports = {
    name: 'removerole',
    description: 'Add a role to a user',
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
        const target = interaction.options.get('target').user.username + '#' + interaction.options.get('target').user.discriminator;
        const roleID = interaction.options.get('role').role.id.toString();
        if (interaction.channelId === config.access_control) {
            const targetHasRole = interaction.options.get('target').member.roles.cache.has(interaction.options.get('role').role.id);
            if (!targetHasRole) {
                await interaction.reply({ content: "Error: the selected user does not have the selected role!", ephemeral: true });
                return;
            }

            if (config.approved_roles.indexOf(roleID) !== -1 || interaction.member.permissions.has('MANAGE_ROLES')) {
                await interaction.defer({ephemeral: false});
                interaction.options.get('target').member.roles.remove(roleID)
                    .then(() => {
                        interaction.editReply({content: `_ _\n${interaction.member.displayName} removed the \`@${interaction.options.get('role').role.name}\` role from \`${target}\``, ephemeral: false});
                    })
                    .catch(error =>{
                        console.error(error);
                        interaction.editReply({
                            content: `Error: ${error.name} - ${error.message}\n_ _\n` +
                                `Role: ${interaction.options.get('role').role.name}\n` +
                                `Target: ${target}\n`+
                                `Submitter: ${interaction.member.displayName}`,
                            ephemeral: false
                        });
                    })
            }
            else {
                await interaction.reply({content: "This role is not auto approved and is pending review. You will be notified when it has been approved or denied.", ephemeral: true});

                createPendingEmbed(interaction);
            }
        }
        else {
            await interaction.reply({ content: "Command disabled in this channel", ephemeral: true });
        }
    }
};

function createPendingEmbed (interaction) {
    interaction.channel.send({
        "content": null,
        "embeds": [
            {
                "title": "Pending Access Request",
                "description": `${interaction.member.displayName} requests \`${interaction.options.get('target').user.username}#${interaction.options.get('target').user.discriminator}\` \
                                be removed from the \`@${interaction.options.get('role').role.name}\` role`,
                "color": null
            }
        ]
    })
        .then((message) => {
            message.react('✅').catch(console.error);
            message.react('🚫').catch(console.error);
            addRolePending(message.id, interaction);
        })
}