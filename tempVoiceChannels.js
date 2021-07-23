
function voiceChanged (oldchannel, newchannel) {
    const channelArray = {
        //general / general voice chat
        "859908194914533380": "864392968886550549",
        //chan2 / chan2
        "868200508085657671": "868200587089559552",
        //public voice 1
        "856488880025632778": "868205477438324776",
        //public voice 2
        "856488991305105418": "868205525932843048",
        //public voice 3
        "856489054982897674": "868205560103841842",
        //public voice 4
        "856495994300661780": "868205597596717077"
    }
    const memberRoles = oldchannel.member.roles;

    if (channelArray[oldchannel.channelId]) {
        if (memberRoles.cache.has(channelArray[oldchannel.channelId])){
            memberRoles.remove(channelArray[oldchannel.channelId]);
        }
    }
    if (channelArray[newchannel.channelId]) {
            memberRoles.add(channelArray[newchannel.channelId]);
    }

}

module.exports = {
    voiceChanged
}