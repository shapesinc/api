// historyManager.js
const fs = require('fs').promises;
const path = require('path');

// File path for storing replied tweet IDs
const HISTORY_FILE_PATH = path.join(__dirname, 'repliedTweets.json');

/**
 * Loads the list of already replied tweet IDs from the history file.
 * @returns {Promise<string[]>} Array of tweet IDs that have been replied to.
 */
async function loadRepliedTweetIds() {
    try {
        // Check if the history file exists
        try {
            await fs.access(HISTORY_FILE_PATH);
        } catch (error) {
            // If file doesn't exist, create it with an empty array
            console.log('💾 No history file found. Creating new history file.');
            await fs.writeFile(HISTORY_FILE_PATH, JSON.stringify([], null, 2));
            return [];
        }

        // Read and parse the file
        const data = await fs.readFile(HISTORY_FILE_PATH, 'utf8');
        const repliedIds = JSON.parse(data);
        
        console.log(`💾 Loaded ${repliedIds.length} replied tweet IDs from history.`);
        return repliedIds;
    } catch (error) {
        console.error('❌ Error loading replied tweet IDs:', error.message);
        // Return an empty array in case of errors
        return [];
    }
}

/**
 * Saves the current list of replied tweet IDs to the history file.
 * @param {string[]} repliedTweetIds - Array of tweet IDs to save.
 * @returns {Promise<void>}
 */
async function saveRepliedTweetIds(repliedTweetIds) {
    try {
        await fs.writeFile(
            HISTORY_FILE_PATH, 
            JSON.stringify(repliedTweetIds, null, 2)
        );
        console.log(`💾 Saved ${repliedTweetIds.length} replied tweet IDs to history.`);
    } catch (error) {
        console.error('❌ Error saving replied tweet IDs:', error.message);
    }
}

/**
 * Checks if a tweet has already been replied to.
 * @param {string} tweetId - The ID of the tweet to check.
 * @param {string[]} repliedTweetIds - Array of tweet IDs already replied to.
 * @returns {boolean} True if the tweet has already been replied to.
 */
function isTweetAlreadyReplied(tweetId, repliedTweetIds) {
    return repliedTweetIds.includes(tweetId);
}

/**
 * Adds a tweet ID to the list of replied tweets.
 * @param {string} tweetId - The ID of the tweet to add.
 * @param {string[]} repliedTweetIds - Array of tweet IDs already replied to.
 * @returns {string[]} The updated array of replied tweet IDs.
 */
function addRepliedTweetId(tweetId, repliedTweetIds) {
    if (!repliedTweetIds.includes(tweetId)) {
        repliedTweetIds.push(tweetId);
        console.log(`💾 Added tweet ${tweetId} to replied history.`);
    }
    return repliedTweetIds;
}

module.exports = {
    loadRepliedTweetIds,
    saveRepliedTweetIds,
    isTweetAlreadyReplied,
    addRepliedTweetId
};