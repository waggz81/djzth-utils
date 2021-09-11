import {Client, Collection, Intents} from "discord.js";
import {REST} from "@discordjs/rest";
import {Routes} from "discord-api-types/v9";
import * as fs from "fs";
import {config} from "./config";
import {checkPendingReactions} from "./db";
import {voiceChanged} from "./tempVoiceChannels";

const myIntents = new Intents();
myIntents.add('GUILDS', 'GUILD_PRESENCES', 'GUILD_MEMBERS', 'GUILD_VOICE_STATES', 'GUILD_MESSAGES', 'GUILD_MESSAGE_REACTIONS');

const client = new Client({ intents: myIntents, partials: ['MESSAGE', 'CHANNEL', 'REACTION'] });

//augment Client to include commands collection for typescript
declare module "discord.js" {
    interface Client {
        commands: Collection<any, any>
    }
}

//add all commands from commands subdir
client.commands = new Collection();
const commands = [];
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    // Set a new item in the Collection
    // With the key as the command name and the value as the exported module
    client.commands.set(command.data.name, command);
    commands.push(command.data.toJSON());
}

//client connected and ready
client.once('ready', async () => {
    const guild = client.guilds.cache.get(`${BigInt(config.guildID)}`);
    console.log("Connected to", guild.name, guild.id);

    //push the slash commands
    const rest = new REST({ version: '9' }).setToken(config.token);
    try {
        await rest.put(
            Routes.applicationGuildCommands(client.user.id, guild.id),
            { body: commands },
        );

        console.log('Successfully registered application commands.');
    } catch (error) {
        console.error(error);
    }
    //load additional modules
    require('./web');
    require('./scheduler');
});

//member changed voice channels
client.on('voiceStateUpdate', (oldVoiceState, newVoiceState) => {
   voiceChanged(oldVoiceState, newVoiceState);
});

//member updated presence
client.on("presenceUpdate", (oldPresence, newPresence) => {
    if (!newPresence.activities) return;
    newPresence.activities.forEach(activity => {
        if (activity.type === "STREAMING") {
            //console.log(`${newPresence.user.tag} is streaming at ${activity.url}.`);
        }
        else {
            //console.log("activity type", activity.type);
        }
    });
});

//member used slash command
client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const command = client.commands.get(interaction.commandName);

    if (!command) return;

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
    }
});

//member reacted to a message
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
    let guild = await client.guilds.fetch(config.guildID);
    guild.members.fetch(user.id)
        .then ((member) =>{
            checkPendingReactions(reaction, member);
        }).catch(console.error)

});

client.on("messageCreate", message => {
    if (message.author.id === client.user.id) return;
    if (config.removeEmbeds.indexOf(message.channel.id) !== -1) {
        message.suppressEmbeds(true).catch(console.error)
    }
});

client.login(config.token).catch(console.error);

module.exports = config;