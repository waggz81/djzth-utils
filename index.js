const { token, guildID  } = require('./config.json');
const {checkPendingReactions} = require('./db.js');

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

    console.log('Ready!');

    const command = await client.guilds.cache.get(guildID)?.commands.set(client.commands.toJSON());


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

    if (!client.commands.has(interaction.commandName)) return;

    try {
        await client.commands.get(interaction.commandName).execute(interaction);
    } catch (error) {
        console.error(error);
        await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
    }
});

client.on('messageReactionAdd', async (reaction, user) => {
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
    let guild = await client.guilds.fetch(guildID);
    guild.members.fetch(user.id)
        .then ((member) =>{
            //console.log(member.permissions.has('MANAGE_ROLES'));
            checkPendingReactions(reaction, member);
        })

});

client.login(token);