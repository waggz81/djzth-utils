import {config} from "../config";
import {Events, ThreadAutoArchiveDuration} from "discord.js";
import {client, myLog} from "../index";

client.on(Events.ThreadCreate, async thread => {
    const forums = config.forum_post_auto_mention_roles;
    if (thread.parentId) {
        if (forums[thread.parentId]) {
            setTimeout(() => {
                thread.messages.fetch().then(msgs => {
                    msgs.last()?.pin();
                }).catch(myLog);
            }, 1000 * 3);
            thread.send(forums[thread.parentId]).catch(myLog);
            thread.setAutoArchiveDuration(ThreadAutoArchiveDuration.OneWeek).catch(myLog);
        }
    }
});
