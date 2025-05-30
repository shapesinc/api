const dotenv = require('dotenv');
dotenv.config();
const SHAPES_API_KEY = process.env.SHAPESINC_API_KEY;
const SHAPES_USERNAME = process.env.SHAPESINC_SHAPE_USERNAME;
const SUB_REDDIT = process.env.REDDIT_SUBREDDIT;
const POLL_TIME = parseInt(process.env.POLL_TIME, 10) || 5000; 
const LIMIT = parseInt(process.env.LIMIT, 10) || 10;
if (!SHAPES_API_KEY) {
    console.error('SHAPESINC_API_KEY not found in environment variables!');
    process.exit(1);
}
if (!SHAPES_USERNAME) {
    console.error('SHAPESINC_SHAPE_USERNAME not found in environment variables!');
    process.exit(1);
}
if (!SUB_REDDIT) {
    console.error('REDDIT_SUBREDDIT not found in environment variables!');
    process.exit(1);
}

const Snoowrap = require('snoowrap');
const { CommentStream } = require('snoostorm');
const { OpenAI } = require('openai');

const shapes = new OpenAI({
    apiKey: SHAPES_API_KEY,
    baseURL: "https://api.shapes.inc/v1"
});

async function processWithShapes(content, userId, channelId) {
    try {
        console.log('Sending to Shapes API:', content);
        const headers = {
            "X-User-Id": userId
        };
        if (channelId) {
            headers["X-Channel-Id"] = channelId;
        }

        const response = await shapes.chat.completions.create({
            model: `shapesinc/${SHAPES_USERNAME}`,
            messages: [{ role: "user", content }],
            extra_headers: headers
        });

        const shaperesponseText = response.choices[0].message.content;
        console.log('Shapes Response:', shaperesponseText);

        return shaperesponseText?.trim() || "Sorry, the AI did not return a response.";

    } catch (error) {
        console.error('Error processing with Shapes API:', error.message);
        return `Sorry, I encountered an error while processing your request with the AI: ${error.message}`;
    }
}

const redditConfig = {
    userAgent: process.env.SHAPESINC_SHAPE_USERNAME || '',
    clientId: process.env.REDDIT_CLIENT_ID || '',
    clientSecret: process.env.REDDIT_CLIENT_SECRET || '',
    username: process.env.REDDIT_USERNAME || '',
    password: process.env.REDDIT_PASSWORD || ''
};

if (!redditConfig.clientId || !redditConfig.clientSecret || !redditConfig.username || !redditConfig.password) {
    console.error('Reddit credentials not fully configured!');
    process.exit(1);
}

const client = new Snoowrap(redditConfig);
const BOT_START = Date.now() / 1000;

const canSummon = (msg) => {
    if (typeof msg !== 'string') return false;
    const lowerMsg = msg.toLowerCase();
    const lowerUsername = redditConfig.username.toLowerCase();
    return lowerMsg.includes(`u/${lowerUsername}`) || lowerMsg.includes(`/u/${lowerUsername}`);
};

const comments = new CommentStream(client, {
    subreddit: SUB_REDDIT,
    limit: LIMIT,
    pollTime: POLL_TIME
});

comments.on('item', async (item) => {
    if (item.created_utc < BOT_START) return;
    if (!canSummon(item.body)) return;
    if (item.author.name.toLowerCase() === redditConfig.username.toLowerCase()) return;

    console.log(`Summon detected in comment ID: ${item.id} by ${item.author.name} in r/${item.subreddit.display_name}`);
    console.log(`Comment body: "${item.body.substring(0, 100)}..."`);

    try {
        const replyText = await processWithShapes(item.body, item.author.name, item.subreddit.display_name);
        console.log(`Attempting to reply to comment ID: ${item.id}`);
        await item.reply(replyText);
        console.log(`Replied successfully to comment ID: ${item.id}`);
    } catch (err) {
        console.error(`Error processing or replying to comment ID: ${item.id}:`, err);
        try {
            await item.reply("Sorry, I encountered an error processing your request.");
        } catch (replyErr) {
            console.error(`Failed to send error reply to comment ID: ${item.id}:`, replyErr);
        }
    }
});

comments.on('error', (err) => {
    console.error('Comment stream error:', err);
});
console.log('Reddit bot started.');
console.log(`Listening for mentions of u/${redditConfig.username} in r/${SUB_REDDIT}`);