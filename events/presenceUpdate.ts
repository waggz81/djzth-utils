// member updated presence
import {client, myLog, thisServer} from "../index";
import {ActivityType, Events, GuildMember, Snowflake} from "discord.js";
import {config} from "../config";

client.on(Events.PresenceUpdate, (oldPresence, newPresence) => {
    if (!newPresence.user) return;

    thisServer.members.fetch(newPresence.user)
        .then((thisUser) => {
            if (!newPresence.activities) {
                removeStreamingRole(thisUser);
                return;
            }
            let streaming = false;
            newPresence.activities.forEach(activity => {
                if (activity.type === ActivityType.Streaming) {
                    myLog(`${thisUser.displayName} is streaming at ${activity.url}.`);
                    thisUser.roles.add(config.livestreamrole as string)
                        .then(()=>{
                            myLog(`added live streaming role to ${thisUser.displayName}`);
                        })
                        .catch(myLog);
                    streaming = true;
                }
                /* else {
                    myLog(`${newPresence.user.tag} activity type - ${ActivityType[activity.type]}`);
                }*/
            });
            if (!streaming) {
                removeStreamingRole(thisUser);
            }
        })
});

function removeStreamingRole (user: GuildMember) {
    if (user.roles.cache.has(config.livestreamrole)) {
        user.roles.remove(config.livestreamrole)
            .then(() => {
                myLog(`removed live streaming role from ${user.displayName}`);
            })
            .catch(myLog);
    }
}