import {Client, Collection, Events, GatewayIntentBits, Guild, Message, Partials, TextChannel} from "discord.js";
import {REST} from "@discordjs/rest";
import {Routes} from "discord-api-types/v9";
import * as fs from "fs";
import {config} from "./config";
import * as path from "path";
import * as dayjs from "dayjs";
import {ChannelType} from "discord-api-types/v10";

export const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.GuildVoiceStates
    ],
    partials: [
        Partials.Message,
        Partials.Reaction,
        Partials.GuildMember
    ]
});

export let raidTeamInfoPosts: Message[] = [];
export let raidTeamInfoChannel: TextChannel;
// augment Client to include commands collection for typescript
declare module "discord.js" {
    interface Client {
        commands: Collection<any, any>
    }
}

// add all commands from commands subdir
client.commands = new Collection();
export let commands: any[] = [];


// client connected and ready
client.once(Events.ClientReady, async c => {
    client.guilds.cache.forEach((thisGuild) => {
        myLog(`Bot joined ${thisGuild.name} ${thisGuild.id}`);
    });
    const guild = client.guilds.cache.get(config.guildID);
    if (guild) {
        myLog(`Designated server is ${guild.name} ${guild.id}`);
        await guild.members.fetch().catch(myLog).then(() => {
            myLog('All users fetched')
        });
        guild.channels.cache.forEach(thisChan => {
            if (thisChan.type === ChannelType.GuildText) {
                thisChan.messages.fetch({limit: 100}).then(() => {
                    myLog(`Cached ${thisChan.messages.cache.size} messages from ${thisChan.name}`);
                }).catch(myLog);
            }
        })
        await refreshCommands(guild, false).catch(myLog);
    } else console.error("Unable to connect to designated config server");
    // load additional modules
    const events = path.join(__dirname, 'events');
    fs.readdirSync(events).forEach(file => {
        if (file.endsWith('.js')) {
            myLog(`Including events file: ${file}`);
            require(path.join(events, file));
        }
    });
    require('./web');
    require('./scheduler');
});

client.login(config.token)
    .then(() => {
        // additional requires
    })
    .catch(error => {
        myLog(error)
    });

export async function refreshCommands(guild: Guild, forcedRefresh: boolean) {
    raidTeamInfoChannel = client.channels.cache.get(config.raidteaminfochannel) as TextChannel;
    raidTeamInfoPosts = [];

    const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

    if (forcedRefresh) {
        commands = commands.filter(element => {
            return element.name === "refreshcommands"
        })
    }
    raidTeamInfoChannel.messages.fetch({limit: 100})
        .then(messages => {
            // Iterate through the messages here with the variable "messages".
            messages.forEach(message => {
                raidTeamInfoPosts.push(message);
            });

            for (const file of commandFiles) {
                const command = requireUncached(`./commands/${file}`);
                if (forcedRefresh && command.data.name === "refreshcommands") {
                    continue;
                }
                // Set a new item in the Collection
                // With the key as the command name and the value as the exported module
                client.commands.set(command.data.name, command);
                commands.push(command.data.toJSON());
            }
        }).then(() => {
        // push the slash commands
        const rest = new REST({version: '9'}).setToken(config.token);
        try {
            rest.put(
                Routes.applicationGuildCommands(client.user!.id, guild.id),
                {body: commands},
            );
            myLog('Successfully registered application commands.');
        } catch (error) {
            myLog(error);
        }
    })
}

function requireUncached(module: any) {
    delete require.cache[require.resolve(module)];
    return require(module);
}

export function myLog (log: any) {
    console.log(dayjs().format('YYYY-MM-DDTHH:mm:ssZ'), log);
}
