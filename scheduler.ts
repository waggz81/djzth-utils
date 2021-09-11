import {truncateKeystones} from "./db";

import schedule = require('node-schedule');

const job = schedule.scheduleJob(
    {
        minute: 0,
        hour: 15,
        dayOfWeek: 2,
        tz: 'Etc/UTC'
    },
    function(){
        truncateKeystones();
        console.log('Truncating keystones table from database.');
    });

console.log("Scheduled job ", job.name)