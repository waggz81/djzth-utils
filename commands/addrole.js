const config = require('../config.json');
const {addRolePending} = require('../db.js');

module.exports = {
    name: 'addrole',
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
        if (interaction.channelId == config.access_control) {
            if (config.approved_roles.indexOf(roleID) === 0) {
                await interaction.defer({ephemeral: false});
                interaction.options.get('target').member.roles.add(roleID)
                .then((value) => {
                    console.log(value);
                    interaction.editReply({content: `_ _\n${interaction.member.displayName} gave the \`@${interaction.options.get('role').role.name}\` role to \`${target}\`!`, ephemeral: false});
                })
                .catch((error) =>{
                    console.log(error);
                    interaction.editReply({content: `Error: ${error.name} - ${error.message}`, ephemeral: false});
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
                                be granted the \`@${interaction.options.get('role').role.name}\` role`,
                "color": null
            }
        ]

    })
        .then((message) => {
            message.react('✅');
            message.react('🚫');
            addRolePending(message.id, interaction);
        })
}