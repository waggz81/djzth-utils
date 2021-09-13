import {truncateKeystones} from "./db";

import schedule = require('node-schedule');


// returns epoch time of last server reset
// optional parameter to specify a date
export function getLastReset (current: Date = new Date()) {
    // if it's before 1500 UTC set hours to 0
    current.setUTCHours ((current.getUTCHours() < 15) ? 0 : 16)
    // 2 = Tuesday
    current.setDate(current.getDate() + (2 - current.getDay() - 7) % 7);
    // create a new date
    const tues = new Date(current.getFullYear(), current.getMonth(), current.getDate())
    tues.setUTCHours(15)
    return tues.getTime()/1000;
}

// schedule a truncate job for each weekly reset
const job = schedule.scheduleJob(
    {
        minute: 1,
        hour: 15,
        dayOfWeek: 2,
        tz: 'Etc/UTC'
    },
    () => {
        truncateKeystones(getLastReset());
        console.log('Truncating keystones table from database.');
    });

// in case we weren't online during last reset, run once on startup
truncateKeystones(getLastReset());
// truncateKeystones(1631500156);
console.log("Scheduled job ", job.name)


