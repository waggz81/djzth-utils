import {truncateKeystones} from "./db";

import schedule = require('node-schedule');
import {dadjoke} from "./dadjoke";
import {config} from "./config";
import {client, myLog} from "./index";
import {ForumChannel} from "discord.js";
import dayjs = require("dayjs");

// returns epoch time of last server reset
// optional parameter to specify a date
export function getLastReset(current: Date = new Date()) {
    // if it's before 1500 UTC set hours to 0
    current.setUTCHours((current.getUTCHours() < 15) ? 0 : 16)
    // 2 = Tuesday
    current.setDate(current.getDate() + (2 - current.getDay() - 7) % 7);
    // create a new date
    const tues = new Date(current.getFullYear(), current.getMonth(), current.getDate())
    tues.setUTCHours(15)
    return tues.getTime() / 1000;
}

// schedule a truncate job for each weekly reset
const job = schedule.scheduleJob(
    "truncateKeystones",
    {
        minute: 1,
        hour: 15,
        dayOfWeek: 2,
        tz: 'Etc/UTC'
    },
    () => {
        truncateKeystones(getLastReset());
        myLog('Truncating keystones table from database.');
    });
// in case we weren't online during last reset, run once on startup
truncateKeystones(getLastReset());
myLog(`Scheduled job: ${job.name}`);

const dadjokejob = schedule.scheduleJob(
    "dadjokes",
    {
        hour: 13,
        minute: 15,
        tz: 'Etc/UTC'
    },
    () => {
        dadjoke().catch(myLog);
    }
);
myLog(`Scheduled job: ${dadjokejob.name}`);

function cleanupAttendancePosts() {
    const teams: any[] = [];
    const teamInfo: any[] = [];
    const guild = client.guilds.cache.get(config.guildID);
    if (typeof (config.absences) !== undefined) {
        for (const element of Object.entries(config.absences)) {
            // @ts-ignore
            teams.push([element[1].team, element[0]]);
            // @ts-ignore
            teamInfo[element[0]] = {
                // @ts-ignore
                teamName: element[1].team,
                // @ts-ignore
                channel: element[1].channel,
            }
        }
        teamInfo.forEach(team => {
            const posts = (guild?.channels.cache.get(team.channel) as ForumChannel).threads.cache;
            posts.forEach(post => {
                const date = dayjs(post.name);
                const now = dayjs();
                if (date.isBefore(now) && !post.locked && !post.archived) {
                    post.setLocked(true, 'Past Event').catch(myLog);
                    post.setArchived(true, 'Past Event').catch(myLog);
                }
            })
        })
    }
}

const attendancePostsCleanup = schedule.scheduleJob(
    "cleanupAttendancePosts",
    {
        hour: 9,
        minute: 0,
        tz: 'Etc/UTC'
    },
    () => {
        // cleanup function
        cleanupAttendancePosts();
    }
);
myLog(`Scheduled job: ${attendancePostsCleanup.name}`);
cleanupAttendancePosts();
