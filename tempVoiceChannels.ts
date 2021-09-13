import {config} from "./config";
import {VoiceState} from "discord.js";

// member changed voice channels, check if we have roles assigned to them in the config
// and assign or remove as necessary
export function voiceChanged (oldchannel: VoiceState, newchannel: VoiceState) {
    const member = oldchannel.member || newchannel.member;
    const memberRoles = member!.roles;
    const chans = config.voiceChannels;

    if (oldchannel.channelId) {
        if (chans[oldchannel.channelId]) {
            if (memberRoles.cache.has(chans[oldchannel.channelId])) {
                memberRoles.remove(chans[oldchannel.channelId]).catch(console.error);
            }
        }
    }
    if (newchannel.channelId) {
        if (chans[newchannel.channelId]) {
            memberRoles.add(chans[newchannel.channelId]).catch(console.error);
        }
    }

}

