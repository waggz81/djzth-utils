
import express = require('express');
const router = express.Router();
import {uploadKeystones, getKeystones} from "../db";

/*
function rateScore (score) {
    return score == 0 ? "n/a" : "★".repeat((score+500)/500);
}
*/

/* GET home page. */
router.get('/', (req, res) => {
    // console.log(req);
        getKeystones().then((rows) => {
            let content = "";
            rows.forEach((row) => {
                console.log(row)
                content += JSON.stringify(row) + "<br />";
            });
            res.send( content);
        })
});

interface KeystoneEntry {
    character: string,
    name: string,
    playerclass: string,
    spec: string,
    role: string,
    score_all: string,
    score_tank: string,
    score_healer: string,
    score_dps: string,
    guild: string,
    key_level: number,
    dungeon_name: string,
    timestamp: number,
    uploader: string
}

router.post('/upload', (req, res) => {
    // console.log((req));
    req.body.keystones.forEach((keystone) => {
        const scores = keystone.RIOProfile.mythic_plus_scores_by_season[0].scores;
        const entry : KeystoneEntry = {
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
        uploadKeystones(entry);
    })

    res.send("OK");
});

module.exports = router;
