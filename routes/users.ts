import express = require('express');
import {config} from "../config";
const router = express.Router();
import fetch = require('node-fetch');
import {userLogin} from "../db";

/* GET users listing. */
/*router.get('/', (req, res) => {
    res.send('respond with a resource');
});
*/

router.get('/', async ({ query }, response) => {
    const {code} = query;

    if (code) {
        try {
            const oauthResult = await fetch('https://discord.com/api/oauth2/token', {
                method: 'POST',
                // @ts-ignore
                body: new URLSearchParams({
                    client_id: config.clientID,
                    client_secret: config.clientSecret,
                    code,
                    grant_type: 'authorization_code',
                    redirect_uri: `http://localhost:3000/users`,
                    scope: 'identify',
                }),
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            });

            const oauthData = await oauthResult.json();
            console.log(oauthData);
            const userData = await getDiscordUser(oauthData.access_token);
            const uuid = await userLogin(userData);
            return response.send("Please use this number in the upload client as your user id: <br /><br />" + uuid);

        } catch (error) {
            // NOTE: An unauthorized token will not throw an error;
            // it will return a 401 Unauthorized response in the try block above
            console.error(error);
        }

    }
    return response.redirect("https://discord.com/api/oauth2/authorize?client_id=212273476419977216&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fusers&response_type=code&scope=identify")
});

async function getDiscordUser (token: string) {

    const userResult = await fetch('https://discord.com/api/users/@me', {
        headers: {
            authorization: `Bearer ${token}`,
        },
    });
    const json = await userResult.json();
    console.log(json);
    return (json);
}
module.exports = router;
