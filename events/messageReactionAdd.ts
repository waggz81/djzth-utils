import {config} from "../config";
import {checkPendingReactions} from "../db";
import {Events, MessageReaction} from "discord.js";
import {client, myLog} from "../index";

client.on(Events.MessageReactionAdd, async (reaction, user) => {
    if (user.id === client.user!.id) return;
    // When a reaction is received, check if the structure is partial
    if (reaction.partial) {
        // If the message this reaction belongs to was removed, the fetching might result in an API error which should be handled
        try {
            await reaction.fetch();
        } catch (error) {
            myLog(`Something went wrong when fetching the message: ${error}`);
            // Return as `reaction.message.author` may be undefined/null
            return;
        }
    }
    const guild = await client.guilds.fetch(config.guildID);
    guild.members.fetch(user.id)
        .then((member) => {
            checkPendingReactions(reaction as MessageReaction, member);
        }).catch((error) => {
        myLog(error);
        myLog(reaction);
    })
});
