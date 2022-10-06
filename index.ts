import {Client, Collection, Intents, MessageReaction} from "discord.js";
import {REST} from "@discordjs/rest";
import {Routes} from "discord-api-types/v9";
import * as fs from "fs";
import {config} from "./config";
import {checkPendingReactions} from "./db";
import {voiceChanged} from "./tempVoiceChannels";
import {EmbedPagination} from "./embedPagination";

const myIntents = new Intents();
myIntents.add('GUILDS', 'GUILD_PRESENCES', 'GUILD_MEMBERS', 'GUILD_VOICE_STATES', 'GUILD_MESSAGES', 'GUILD_MESSAGE_REACTIONS');

export const client = new Client({ intents: myIntents, partials: ['MESSAGE', 'CHANNEL', 'REACTION'] });

// augment Client to include commands collection for typescript
declare module "discord.js" {
    interface Client {
        commands: Collection<any, any>
    }
}

// add all commands from commands subdir
client.commands = new Collection();
const commands: any[] = [];
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    // tslint:disable-next-line:no-var-requires
    const command = require(`./commands/${file}`);
    // Set a new item in the Collection
    // With the key as the command name and the value as the exported module
    client.commands.set(command.data.name, command);
    commands.push(command.data.toJSON());
}

// client connected and ready
client.once('ready', async () => {
    client.guilds.cache.forEach((thisGuild) => {
        console.log("Bot joined", thisGuild.name, thisGuild.id);
    });
    const guild = client.guilds.cache.get(`${BigInt(config.guildID)}`);
    if (guild) {
        console.log("Designated server is", guild.name, guild.id);

        // push the slash commands
        const rest = new REST({version: '9'}).setToken(config.token);
        try {
            await rest.put(
                Routes.applicationGuildCommands(client.user!.id, guild.id),
                {body: commands},
            );

            console.log('Successfully registered application commands.');
        } catch (error) {
            console.error(error);
        }
    }
    else console.error("Unable to connect to designated config server");
    // load additional modules
    require('./web');
    require('./scheduler');
});

// member changed voice channels
client.on('voiceStateUpdate', (oldVoiceState, newVoiceState) => {
   voiceChanged(oldVoiceState, newVoiceState);
});

// member updated presence
client.on("presenceUpdate", (oldPresence, newPresence) => {
    if (!newPresence.activities) return;
    newPresence.activities.forEach(activity => {
        if (activity.type === "STREAMING") {
            // console.log(`${newPresence.user.tag} is streaming at ${activity.url}.`);
        }
        else {
            // console.log("activity type", activity.type);
        }
    });
});

// member used slash command
client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const command = client.commands.get(interaction.commandName);

    if (!command) return;

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        await interaction.reply({ content: 'There was an error while executing this command!' +
            '```' + error + '```', ephemeral: true });
    }
});

// member used button
client.on('interactionCreate', interaction => {
    if (!interaction.isButton()) return;
    if (interaction.customId.startsWith("nextEmbedPage") || interaction.customId.startsWith("previousEmbedPage")) {
        EmbedPagination(interaction).catch(console.error);
    }
});

// member reacted to a message
client.on('messageReactionAdd', async (reaction, user) => {
    if (user.id === client.user!.id) return;
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
    const guild = await client.guilds.fetch(config.guildID);
    guild.members.fetch(user.id)
        .then ((member) =>{
            checkPendingReactions(reaction as MessageReaction, member);
        }).catch((error) => {
            console.error(error);
            console.log(reaction);
        })

});

client.on("messageCreate", message => {
    if (message.author.id === client.user!.id || message.channel.isThread()) return;
    if (config.removeEmbeds.indexOf(message.channel.id) !== -1) {
        setTimeout(() =>{
            message.suppressEmbeds(true).catch(console.error)
        }, 1000 * 3);
    }
});

client.on("threadCreate", thread => {
    const forums = config.forum_post_auto_mention_roles;
    console.log(thread);
    console.log(thread.parentId);
    if (thread.parentId) {
        console.log(forums[thread.parentId])
        if (forums[thread.parentId]) {
            thread.send(forums[thread.parentId]);
        }
    }
});

client.login(config.token).catch(console.error);

