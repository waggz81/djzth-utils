module.exports = {
    name: 'ping',
    description: 'Replies with Pong!',
    options: [{
        name: 'input',
        type: 'STRING',
        description: 'The input to echo back',
        required: true,
    }],
    async execute(interaction) {
        console.log(interaction);
        await interaction.reply('Pong!');
    },
};