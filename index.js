
const {config} = require('./config.js');
const {checkPendingReactions} = require('./db');

const {Client, Collection, Intents} = require('discord.js');
const fs = require('fs');
const voiceChannels = require('./tempVoiceChannels');


const myIntents = new Intents();
myIntents.add('GUILDS', 'GUILD_PRESENCES', 'GUILD_MEMBERS', 'GUILD_VOICE_STATES', 'GUILD_MESSAGES', 'GUILD_MESSAGE_REACTIONS');

const client = new Client({ intents: myIntents, partials: ['MESSAGE', 'CHANNEL', 'REACTION'] });
client.commands = new Collection();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    // set a new item in the Collection
    // with the key as the command name and the value as the exported module
    client.commands.set(command.name, command);
}



client.once('ready', async () => {
    // noinspection JSUnresolvedVariable
    const guild = client.guilds.cache.get(`${BigInt(config.guildID)}`);
    // noinspection JSUnresolvedVariable
    await client.guilds.cache.get(`${BigInt(config.guildID)}`)?.commands.set(client.commands.toJSON());
    console.log("Connected to", guild.name, guild.id);
});


client.on('voiceStateUpdate', (oldVoiceState, newVoiceState) => {
   voiceChannels.voiceChanged(oldVoiceState, newVoiceState);
});

client.on("presenceUpdate", (oldPresence, newPresence) => {
    if (!newPresence.activities) return false;
    newPresence.activities.forEach(activity => {
        if (activity.type === "STREAMING") {
            //console.log(`${newPresence.user.tag} is streaming at ${activity.url}.`);
        }
        else {
            //console.log("activity type", activity.type);
        }
    });
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;
    // noinspection JSUnresolvedVariable
    if (!client.commands.has(interaction.commandName)) return;

    try {
        // noinspection JSUnresolvedVariable
        await client.commands.get(interaction.commandName).execute(interaction);
    } catch (error) {
        console.error(error);
        // noinspection JSUnresolvedFunction
        await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true }).catch(console.error)
    }
});

client.on('messageReactionAdd', async (reaction, user) => {
    if (user.id === client.user.id) return;
    // When a reaction is received, check if the structure is partial
    if (reaction.partial) {
        // If the message this reaction belongs to was removed, the fetching might result in an API error which should be handled
        try {
            await reaction.fetch();
        } catch (error) {
            console.error('Something went wrong when fetching the message:', error);
            // Return as `reaction.message.author` may be undefined/null
            return;
        }
    }
    // noinspection JSUnresolvedVariable
    let guild = await client.guilds.fetch(config.guildID);
    guild.members.fetch(user.id)
        .then ((member) =>{
            checkPendingReactions(reaction, member);
        }).catch(console.error)

});

client.on("messageCreate", message => {
    if (message.author.id === client.user.id) return;
    // noinspection JSUnresolvedVariable
    if (config.removeEmbeds.indexOf(message.channel.id) !== -1) {
        message.suppressEmbeds(true).catch(console.error)
    }
});

client.login(config.token).catch(console.error);

module.exports = config;