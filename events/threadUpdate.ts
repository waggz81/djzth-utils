import {ChannelType, Events} from "discord.js";
import {config} from "../config";
import {client, myLog} from "../index";

client.on(Events.ThreadUpdate, async thread => {
    const forums = config.forum_post_auto_mention_roles;
    thread.guild.channels.fetch(thread.id).then(thisThread => {
        if (thisThread) {
            if (thisThread.type === ChannelType.PublicThread && thread.parent?.type === ChannelType.GuildForum && thread.parentId) {
                if (forums[thread.parentId]) {
                    let tags = thread.appliedTags;
                    thread.parent.availableTags.forEach(tag => {
                        if (tag.name === "Pending") {
                            if (thread.appliedTags.includes(tag.id)) {
                                tags = thread.appliedTags.filter(entry => {
                                    return entry !== tag.id;
                                })
                                thread.setAppliedTags(tags).catch(myLog);
                            }
                        }
                    });
                }
            }
        }
    });
});
