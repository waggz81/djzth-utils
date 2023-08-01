import {config} from "../config";
import {TextChannel, VoiceChannel} from "discord.js";
import {client, myLog} from "../index";

client.on("voiceStateUpdate", async (oldstate, newstate) => {
    const channel = await oldstate.guild.channels.fetch(config.auditLogChannels.channel) as TextChannel;
    const member = oldstate.member || newstate.member;
    const oldchannel = await member!.guild.channels.fetch(oldstate.channelId as string) as VoiceChannel
    const newchannel = await member!.guild.channels.fetch(newstate.channelId as string) as VoiceChannel
    channel.threads.fetch(config.auditLogChannels.voice).then(thread => {
        if (thread && member) {
                thread.setArchived(false).then(() => {
                    if (oldstate.channelId) {
                        // left a channel
                        thread.send(`:red_circle: ${member.displayName} (${member.user.tag}) left channel ${oldchannel}`).catch(myLog);
                    }
                    if (newstate.channelId) {
                        // joined a channel
                        thread.send(`:green_circle: ${member.displayName} (${member.user.tag}) joined channel ${newchannel}`).catch(myLog);
                    }
                }).catch(myLog);
        } else myLog('Error: Missing voice audit log channel.');
    });
});
