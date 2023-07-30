import {
    ActivityType,
    ChannelType,
    Client,
    Collection,
    Colors,
    EmbedBuilder,
    Events,
    GatewayIntentBits,
    Guild,
    Message,
    MessageReaction,
    PermissionsBitField,
    TextChannel,
    ThreadAutoArchiveDuration,
    VoiceChannel
} from "discord.js";
import {REST} from "@discordjs/rest";
import {Routes} from "discord-api-types/v9";
import * as fs from "fs";
import {config} from "./config";
import {checkPendingReactions} from "./db";
import {EmbedPagination} from "./embedPagination";


export const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.GuildVoiceStates
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
        console.log("Bot joined", thisGuild.name, thisGuild.id);
    });
    const guild = client.guilds.cache.get(`${BigInt(config.guildID)}`);
    if (guild) {
        console.log("Designated server is", guild.name, guild.id);
        await guild.members.fetch().catch(console.log).then(()=>{
            console.log('All users fetched')
        });

        await refreshCommands(guild, false).catch(console.log);
    } else console.error("Unable to connect to designated config server");
    // load additional modules
    require('./web');
    require('./scheduler');
});

// member updated presence
client.on("presenceUpdate", (oldPresence, newPresence) => {
    if (!newPresence.activities) return;
    newPresence.activities.forEach(activity => {
        if (activity.type === ActivityType.Streaming) {
            // console.log(`${newPresence.user.tag} is streaming at ${activity.url}.`);
        } else {
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
        console.log(error);
        await interaction.reply({
            content: 'There was an error while executing this command!' +
                '```' + error + '```', ephemeral: true
        });
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
        .then((member) => {
            checkPendingReactions(reaction as MessageReaction, member);
        }).catch((error) => {
        console.error(error);
        console.log(reaction);
    })

});

client.on("messageCreate", message => {
    if (message.author.id === client.user!.id || message.channel.isThread()) return;
    if (message.mentions.roles) {
        let filterMention = false;
        let unapprovedRole = '';
        message.mentions.roles.forEach(thisRole => {
            const author = message.guild!.members.cache.get(message.author.id);
            if (config.approved_roles.indexOf(thisRole.id) !== -1 && !author!.roles.cache.has(thisRole.id) && !author!.permissions.has(PermissionsBitField.Flags.MentionEveryone)) {
                filterMention = true;
                unapprovedRole += `, \`@${thisRole.name}\``;
            }
        });
        if (filterMention) {
            message.delete()
                .then(msg => {
                    msg.channel.send(`Sorry <@${msg.author.id}>, your message was removed for containing a designated role mention you are not a member of. The following roles were identified: ${unapprovedRole.substring(2)}`);
                    return false;
                })
        }
    }
    if (config.removeEmbeds.indexOf(message.channel.id) !== -1) {
        setTimeout(() => {
            message.suppressEmbeds(true).catch(console.error)
        }, 1000 * 3);
    }
});

client.on("threadCreate", async thread => {
    const forums = config.forum_post_auto_mention_roles;
    if (thread.parentId) {
        if (forums[thread.parentId]) {
            setTimeout(() => {
                thread.messages.fetch().then(msgs => {
                    msgs.last()?.pin();
                });
            }, 1000 * 3);
            thread.send(forums[thread.parentId]).catch(err => {
                console.log(err)
            })
            thread.setAutoArchiveDuration(ThreadAutoArchiveDuration.OneWeek).catch(err => {
                console.log(err)
            })
        }
    }
});

client.on(Events.ThreadUpdate, async thread => {
    const forums = config.forum_post_auto_mention_roles;
    thread.guild.channels.fetch(thread.id).then(thisThread => {
        if (thisThread?.type === ChannelType.PublicThread && thread.parent?.type === ChannelType.GuildForum && thread.parentId) {
            if (forums[thread.parentId!]) {
                let tags = thread.appliedTags;
                thread.parent.availableTags.forEach(tag => {
                    if (tag.name === "Pending") {
                        if (thread.appliedTags.includes(tag.id)) {
                            tags = thread.appliedTags.filter(entry => {
                                return entry !== tag.id
                            })
                            thread.setAppliedTags(tags).catch(console.log);
                        }
                    }
                })
            }
        }
    })
})

client.on("guildMemberAdd", async (member) => {
    const channel = member.guild.channels.cache.get(config.auditLogChannels.channel) as TextChannel;
    const embed1 = new EmbedBuilder()
        .setColor(Colors.Green)
        .setTitle(`_${member.user.tag}_ joined the discord`)
    channel.threads.fetch(config.auditLogChannels.joinsparts).then(thread => {
        thread!.send({embeds: [embed1]})
    })
});

client.on("guildMemberRemove", async (member) => {
    const channel = member.guild.channels.cache.get(config.auditLogChannels.channel) as TextChannel;
    let roles = '';
    member.roles.cache.forEach(role => {
        if (role.name !== '@everyone') {
            roles += role.name + '\n'
        }
    });
    roles = roles === '' ? 'no roles' : roles;
    const embed1 = new EmbedBuilder({
        title: `${member.displayName} _(${member.user.tag})_ left the discord`,
        description: `**__Roles:__**\n${roles}`,
        color: Colors.Red
    });
    channel.threads.fetch(config.auditLogChannels.joinsparts).then(thread => {
        thread!.send({embeds: [embed1]})
    })
});
client.on("voiceStateUpdate", async (oldstate, newstate) => {
    const channel = oldstate.guild.channels.cache.get(config.auditLogChannels.channel) as TextChannel;
    const member = oldstate.member || newstate.member;
    const oldchannel = await member!.guild.channels.fetch(oldstate.channelId as string) as VoiceChannel
    const newchannel = await member!.guild.channels.fetch(newstate.channelId as string) as VoiceChannel
    channel.threads.fetch(config.auditLogChannels.voice).then(thread => {
        if (thread!.archived) {
            thread!.setArchived(false)
        }
        if (oldstate.channelId) {
            // left a channel
            thread!.send(`:red_circle: ${member!.user.tag} (${member!.displayName}) left channel ${oldchannel}`);
        }
        if (newstate.channelId) {
            // joined a channel
            thread!.send(`:green_circle: ${member!.user.tag} (${member!.displayName}) joined channel ${newchannel}`);
        }

    });
});

client.on('messageDelete', async (message) => { // messagedelete is the event which gets triggered if somebody deletes a discord textmessage
    const guild = await client.guilds.fetch(config.guildID);
    const author = message.author ? `${guild.members.cache.get(message.author?.id)?.user.tag} (${guild.members.cache.get(message.author?.id)?.displayName})` : 'unknown user';
    const authorURL = message.author?.avatarURL() ? message.author?.avatarURL()! : 'https://i.imgur.com/pGIb1qm.png';
    const embed1 = new EmbedBuilder()
        .setColor(Colors.Red)
        .setAuthor({name: author, iconURL: authorURL})
        .setTitle(`had a message deleted in ${message.channel}`)
        .setDescription('Check the audit log for details. Original message is below:')
    const msgContent = message.cleanContent ? message.cleanContent : message.content;
    const embed2 = new EmbedBuilder({
        description: msgContent || 'uncached message content, unable to display',
        footer: {text: `Message ID: ${message.id}`},
        timestamp: '',
        color: Colors.Red
    });
    const channel = message.guild!.channels.cache.get(config.auditLogChannels.channel) as TextChannel;
    const threadchannel = channel.threads.cache.get(config.auditLogChannels.messages);
    await threadchannel!.send({embeds: [embed1, embed2]})
});

client.on("guildMemberUpdate", async (oldMember, newMember) => {
    const guild = await client.guilds.fetch(config.guildID);
    let changes = '';
    let rolechanges = false;
    let nickchanges = false;
    let changedroles = '';
    const channel = guild!.channels.cache.get(config.auditLogChannels.channel) as TextChannel;
    const threadchannel = channel.threads.cache.get(config.auditLogChannels.userupdates);
    const author = `${oldMember.user.tag} (${oldMember.displayName})`;

    if (oldMember.nickname !== newMember.nickname) {
        changes += `**__Nickname:__**\n~~${oldMember.nickname}~~ => ${newMember.nickname || 'server nickname removed'}\n`;
        nickchanges = true;
    }
    const ignoredroles = config.ignoredUserUpdateRoles;
    oldMember.roles.cache.forEach(role => {
        if (!newMember.roles.cache.has(role.id) && !ignoredroles.includes(role.id)) {
            changedroles += `~~_${role.name}_~~ removed\n`;
            rolechanges = true;
        }
    })
    newMember.roles.cache.forEach(role => {
        if (!oldMember.roles.cache.has(role.id) && !ignoredroles.includes(role.id)) {
            changedroles += `_${role.name}_ added`;
            rolechanges = true;
        }
    })
    if (rolechanges) {
        changes += `**__Role Changes:__**\n${changedroles}`
    }
    if (rolechanges || nickchanges) {
        const embed1 = new EmbedBuilder({
            color: Colors.Blue,
            title: `${author} was updated`,
            description: `${changes}`
        });
        await threadchannel!.send({embeds: [embed1]})
    }
});

client.login(config.token)
    .then(() => {
        // additional requires
    })
    .catch(error => {
        console.log(error)
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
            console.log('Successfully registered application commands.');
        } catch (error) {
            console.log(error);
        }
    })

}

function requireUncached(module: any) {
    delete require.cache[require.resolve(module)];
    return require(module);
}