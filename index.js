const { prefix, token } = require('./config.json');
const {Client, Collection, Intents} = require('discord.js');
const fs = require('fs');
const voiceChannels = require('./tempVoiceChannels');

const myIntents = new Intents();
myIntents.add('GUILDS', 'GUILD_PRESENCES', 'GUILD_MEMBERS', 'GUILD_VOICE_STATES', 'GUILD_MESSAGES');

const client = new Client({ intents: myIntents });
client.commands = new Collection();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(`./commands/${file}`);

    // set a new item in the Collection
    // with the key as the command name and the value as the exported module
    client.commands.set(command.name, command);
}

client.once('ready', async () => {
    console.log('Ready!');
    if (!client.application?.owner) await client.application?.fetch();

    const data = [
        {
            name: 'ping',
            description: 'Replies with Pong!',
        },
        {
            name: 'pong',
            description: 'Replies with Ping!',
        },
    ];

    const commands = await client.guilds.cache.get('859908194914533376')?.commands.set(data);


   // console.log(commands);
});

client.on('messageCreate', async message => {
    if (!message.content.startsWith(prefix) || message.author.bot) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();
    if (!client.commands.has(command)) return;

    try {
        client.commands.get(command).execute(message, args);
    } catch (error) {
        console.error(error);
        message.reply('there was an error trying to execute that command!');
    }
});

client.on('voiceStateUpdate', (oldVoiceState, newVoiceState) => {
   voiceChannels.voiceChanged(oldVoiceState, newVoiceState);
});

client.on("presenceUpdate", (oldPresence, newPresence) => {
    if (!newPresence.activities) return false;
    newPresence.activities.forEach(activity => {
        if (activity.type == "STREAMING") {
            console.log(`${newPresence.user.tag} is streaming at ${activity.url}.`);
        }
        else {
            console.log("activity type", activity.type);
        }
    });
});
client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;
    if (interaction.commandName === 'ping') await interaction.reply({ content: 'Pong!', ephemeral: true });
    if (interaction.commandName === 'pong') await interaction.reply({ content: 'Ping!', ephemeral: true });
});

client.login(token);