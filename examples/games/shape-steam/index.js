require('dotenv').config();
const SteamUser = require('steam-user');
const fs = require('fs');
const path = require('path');
const { OpenAI } = require('openai');

const client = new SteamUser();
const sentryPath = path.join(__dirname, 'sentry.bin');

const openai = new OpenAI({
    apiKey: process.env.SHAPES_API_KEY,
    baseURL: 'https://api.shapes.inc/v1',
});

const logOnOptions = {
    accountName: process.env.STEAM_USERNAME,
    password: process.env.STEAM_PASSWORD,
};

if (fs.existsSync(sentryPath)) {
    logOnOptions.shaSentryfile = fs.readFileSync(sentryPath);
}

client.logOn(logOnOptions);

client.on('steamGuard', (domain, callback) => {
    console.log(`steamGuard code required${domain ? ` @ ${domain}` : ''}`);
    const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    readline.question('enter steam guard code: ', (code) => {
        callback(code);
        readline.close();
    });
});

client.on('sentry', (sentry) => {
    fs.writeFileSync(sentryPath, sentry);
    console.log('âœ… sentry file saved');
});

client.on('loggedOn', () => {
    console.log(`🤖 logged in as ${client.steamID.getSteam3RenderedID()}`);
    client.setPersona(SteamUser.EPersonaState.Online);
    client.gamesPlayed(['shapes steam bot']);
});

client.on('error', (err) => {
    console.error('steam error:', err);
});

// auto-accept friend requests
client.on('friendRelationship', (steamID, relationship) => {
    if (relationship === SteamUser.EFriendRelationship.RequestRecipient) {
        console.log(`ðŸ¤ friend request from ${steamID}`);
        client.addFriend(steamID, () => {
            console.log(`✅️ accepted ${steamID}`);
        });
    }
});

// process friend messages w/ shapes support
client.on('friendMessage', async (steamID, message) => {
  
    let content = [];

    if (/\.(jpg|png|webp|jpeg)$/i.test(message)) {
        content = [
            { type: 'text', text: "what's in this image? and reply in the proper way" },
            { type: 'image_url', image_url: { url: message.trim() } },
        ];
    } else if (/\.(mp3|wav|ogg)$/i.test(message)) {
        content = [
            { type: 'text', text: 'please transcribe and respond to this audio message' },
            { type: 'audio_url', audio_url: { url: message.trim() } },
        ];
    } else {
        content = message;
    }

    try {
        const response = await openai.chat.completions.create({
            model: `shapesinc/${process.env.SHAPES_USERNAME}`,
            messages: [{ role: 'user', content }],
        });
        
        const reply = response.choices?.[0]?.message?.content || 'no response.';
        client.chatMessage(steamID, reply);
    } catch (err) {
        console.error('⚠️ shapesapi error:', err);
        client.chatMessage(steamID, 'shapes.inc is down bad rn, try later');
    }
});
