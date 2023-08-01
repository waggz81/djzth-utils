import express = require('express');

const router = express.Router();
import {uploadKeystones, getKeystones, getAuthorizedUsers} from "../db";
import {KeystoneEntry, KeystonelistEntry} from "../typings/types";
import {getLastReset} from "../scheduler";
import {myLog} from "../index";

/*
function rateScore (score) {
    return score == 0 ? "n/a" : "★".repeat((score+500)/500);
}
*/

/* GET home page. */
router.get('/', (req, res) => {
     myLog(req.headers.host);
     myLog(req);
    getKeystones().then((rows) => {
        let content = "";
        rows.forEach((row: KeystoneEntry) => {
            content += JSON.stringify(row) + "<br />";
        });
        res.send(content);
    })
});


router.post('/upload', async (req, res) => {
    myLog(req);
    new Promise((resolve, reject) => {
        const valid: KeystonelistEntry[]= [];
        req.body.keystones.forEach((keystone: any) => {
            const scores = keystone.RIOProfile.mythic_plus_scores_by_season[0].scores;
            const entry: KeystoneEntry = {
                character: keystone.character,
                name: keystone.RIOProfile.name,
                playerclass: keystone.RIOProfile.class,
                spec: keystone.RIOProfile.active_spec_name,
                role: keystone.RIOProfile.active_spec_role,
                score_all: scores.all,
                score_tank: scores.tank,
                score_healer: scores.healer,
                score_dps: scores.dps,
                guild: keystone.RIOProfile.guild.name,
                key_level: keystone.key_level,
                dungeon_name: keystone.dungeon_name,
                timestamp: keystone.time_stamp,
                uploader: req.body.user
            }

            getAuthorizedUsers().then((authorizedUsers) => {
                let found = false;
                for (const user of authorizedUsers) {
                    if (user.uuid === entry.uploader) {
                        found = true;
                    }
                }
                if (!found) {
                    reject("Unauthorized user token");
                }
                myLog(`last reset = ${getLastReset()} timestamp = ${entry.timestamp}`);
                if (entry.timestamp > getLastReset()) {
                    uploadKeystones(entry);
                    valid.push({Name: entry.name, Level:entry.key_level, Dungeon: entry.dungeon_name });
                }
                else valid.push({Name: entry.name, Level:entry.key_level, Dungeon: entry.dungeon_name + " expired, not added" });
            });
        })
            resolve(valid);


    }).then((response) => {
        res.send(response);
    }).catch((message) => {
        res.status(401).send({ error: message });
    });
});

module.exports = router;
