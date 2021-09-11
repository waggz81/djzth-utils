import {config} from "./config";

//member changed voice channels, check if we have roles assigned to them in the config
//and assign or remove as necessary
export function voiceChanged (oldchannel, newchannel) {

    const memberRoles = oldchannel.member.roles;
    const chans = config.voiceChannels;

    if (chans[oldchannel.channelId]) {
        if (memberRoles.cache.has(chans[oldchannel.channelId])){
            memberRoles.remove(chans[oldchannel.channelId]);
        }
    }
    if (chans[newchannel.channelId]) {
            memberRoles.add(chans[newchannel.channelId]);
    }

}

