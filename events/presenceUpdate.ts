// member updated presence
import {client} from "../index";
import {ActivityType, Events} from "discord.js";

client.on(Events.PresenceUpdate, (oldPresence, newPresence) => {
    if (!newPresence.activities) return;
    newPresence.activities.forEach(activity => {
        if (activity.type === ActivityType.Streaming) {
            // myLog(`${newPresence.user.tag} is streaming at ${activity.url}.`);
        } else {
            // myLog("activity type", activity.type);
        }
    });
});
