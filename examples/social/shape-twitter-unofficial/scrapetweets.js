// scrapeTweets.js
require('dotenv').config();
const { generateReply } = require('./replyclient');
const { saveRepliedTweetIds, isTweetAlreadyReplied, addRepliedTweetId } = require('./historyManager'); // Import history manager

/**
 * Scrapes tweets based on a search query and attempts to reply to them,
 * avoiding duplicates based on history.
 * Generates AI reply FIRST, then attempts UI interaction by
 * clicking reply, WAITING FOR THE COMPOSER (more reliable), typing, and sending with Ctrl+Enter.
 * @param {object} page - Puppeteer Page object.
 * @param {string} query - The search query string (e.g., "AI news", "@elisabethxbt").
 * @param {string[]} repliedTweetIds - Array of tweet IDs already replied to (passed from main).
 * @returns {Promise<string[]>} - Returns the updated array of replied tweet IDs.
 */
async function scrapeTweets(page, query, repliedTweetIds) {
    console.log(`\n--- Scraping and Replying for Query: "${query}" ---`);

    if (!query) {
        console.warn("⚠️ No search query provided. Skipping tweet scraping and replying for this call.");
        return repliedTweetIds; // Return the list unchanged
    }

    const encodedQuery = encodeURIComponent(query);
    const searchUrl = `https://x.com/search?q=${encodedQuery}&src=typed_query&f=live`; // 'f=live' for latest tweets

    const MAX_TWEETS_TO_PROCESS_PER_QUERY = 10; // How many tweets to look at per search run
    const MAX_REPLIES_PER_QUERY_RUN = 2; // Limit replies per search run to avoid issues
    const REPLY_DELAY_MS = 15000; // Delay between replies (in milliseconds)

    // Selector for the reply textarea within the modal (using the more specific one)
    const composerSelectorSpecific = 'div[role="textbox"][data-testid="tweetTextarea_0"]';
    const modalDialogSelector = '[role="dialog"]'; // Used for confirming modal appearance/disappearance

    let repliedCount = 0;
    let processedCount = 0;

    try {
        console.log(`[Tweets] Navigating to search results for "${query}"...`);
        await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 60000 });

        // Wait for some tweet elements to load
        try {
            await page.waitForSelector('[data-testid="tweet"]', { timeout: 20000 }); // Increased timeout
             console.log("[Tweets] Tweet elements found.");
        } catch (e) {
            console.warn("[Tweets] No tweets found or selector timed out for this query.");
            return repliedTweetIds; // Return if no tweets load
        }

        await new Promise(resolve => setTimeout(resolve, 5000)); // Give page a moment to fully render more

        // Get Puppeteer handles for the tweet elements
        const tweetElements = await page.$$('[data-testid="tweet"]');
        console.log(`[Tweets] Found ${tweetElements.length} potential tweets for "${query}".`);

        // Loop through a limited number of found tweet elements
        for (const tweetElement of tweetElements) {
            if (processedCount >= MAX_TWEETS_TO_PROCESS_PER_QUERY) {
                console.log(`[Tweets] Reached processing limit (${MAX_TWEETS_TO_PROCESS_PER_QUERY}) for query "${query}". Stopping.`);
                break;
            }
             processedCount++;


            if (repliedCount >= MAX_REPLIES_PER_QUERY_RUN) {
                console.log(`[Tweets] Reached reply limit (${MAX_REPLIES_PER_QUERY_RUN}) for query "${query}". Stopping replies for this search.`);
                // Continue processing tweets to potentially mark them as seen if needed,
                // but don't attempt to reply further in this query run.
                continue;
            }


            try {
                // --- Scrape data from the current tweet element handle ---
                const tweetData = await tweetElement.evaluate(el => {
                    const textEl = el.querySelector('[data-testid="tweetText"]');
                    const text = textEl?.textContent?.trim() || '';

                    const userLink = el.querySelector('a[role="link"][href*="/status/"]');
                    const usernameEl = userLink ? userLink.closest('[data-testid="User-Name"]')?.querySelector('span') : null;
                    const username = usernameEl?.textContent?.replace(/^@/, '').trim() || 'UnknownUser';

                    // Get the link to the tweet itself, crucial for the ID
                    const permalinkEl = el.querySelector(`a[href*="/status/"]`);
                    const tweetUrl = permalinkEl ? permalinkEl.href : 'N/A';

                     // Also try to get the tweet ID directly from the link if possible
                    let tweetIdFromUrl = 'N/A';
                    if (tweetUrl !== 'N/A') {
                         const urlParts = tweetUrl.split('/');
                         tweetIdFromUrl = urlParts[urlParts.length - 1];
                    }


                    if (!text && !el.querySelector('[data-testid="tweetPhoto"], [data-testid="videoPlayer"], [data-testid="card.wrapper"]')) {
                         return null; 
                    }

                    return { username, text, tweetUrl, tweetId: tweetIdFromUrl }; // Include tweetId in return
                });

                if (!tweetData || tweetData.tweetUrl === 'N/A' || !tweetData.tweetId || isNaN(tweetData.tweetId)) {
                    // console.log("[Tweets] Skipping element (likely retweet, empty, or no permalink/valid ID).");
                    continue; // Skip invalid or non-linkable tweet elements
                }

                // Use the ID extracted from the element evaluation
                const tweetId = tweetData.tweetId;


                console.log(`\n[Tweets] Processing tweet ${tweetId} from @${tweetData.username}: ${tweetData.text.substring(0, 100)}...`);

                // --- Check if already replied ---
                if (isTweetAlreadyReplied(tweetId, repliedTweetIds)) {
                    console.log(`[Tweets] Already replied to tweet ${tweetId}. Skipping.`);
                    continue; // Skip if we've already replied
                }

                // Decide if you want to reply to this tweet (add custom filtering logic here if needed)
                // ... your filtering logic ...

                // --- Generate Reply using AI FIRST ---
                console.log(`[Tweets] Passing data to generateReply for tweet ${tweetId} (AI First):`, {
                     tweetId: tweetId,
                     username: tweetData.username,
                     text: tweetData.text.substring(0, 200) + (tweetData.text.length > 200 ? '...' : '') // Log first 200 chars
                });

                const aiReply = await generateReply({
                     tweetId: tweetId,
                     username: tweetData.username,
                     text: tweetData.text // <-- The raw tweet text is passed here
                });
                console.log("🟢 AI Reply Generated:", aiReply); // <-- Log the AI Reply here

                if (!aiReply || aiReply.length < 5 || aiReply.length > 280) {
                     console.warn(`[Tweets] Generated AI reply for tweet ${tweetId} is invalid or too long (${aiReply?.length || 0} chars). Skipping UI interaction.`);
                     continue; // Skip UI interaction if AI reply is bad
                }

                // --- If AI reply is valid, proceed to UI interaction ---
                console.log(`[Tweets] AI reply is valid. Attempting UI reply for tweet ${tweetId}.`);

                // --- Find and Click Reply Button ---
                const replyButton = await tweetElement.$('[data-testid="reply"]');
                if (!replyButton) {
                    console.warn(`[Tweets] Reply button not found for tweet ${tweetId}. Skipping UI interaction.`);
                    continue; // Skip if no reply button
                }

                 await new Promise(resolve => setTimeout(resolve, 1000)); // Small delay after getting the button

                await replyButton.click();
                console.log(`[Tweets] Clicked reply button for tweet ${tweetId}.`);

                // --- Wait for Composer and Type/Send (Using more robust wait + type/send logic) ---
                // Integrated logic based on user's proposed attemptReply core steps
                 try {
                     console.log(`[Tweets] Waiting for reply composer element "${composerSelectorSpecific}" for tweet ${tweetId}...`);
                     await page.waitForSelector(composerSelectorSpecific, { visible: true, timeout: 15000 });
                     const replyBox = await page.$(composerSelectorSpecific);

                     if (!replyBox) {
                         throw new Error(`Reply textbox element "${composerSelectorSpecific}" not found after waiting.`);
                     }

                     console.log("[Tweets] Reply composer element found. Typing reply...");
                     await replyBox.click(); // Click to ensure focus
                     await replyBox.focus(); // Ensure focus
                     await page.keyboard.type(aiReply, { delay: 50 }); // Type onto the focused element

                     // Determine platform for Ctrl or Cmd
                     const platform = process.platform;
                     console.log(`[Tweets] Typing complete. Attempting to send via keyboard (${platform})...`);

                     if (platform === 'darwin') { // macOS
                         await page.keyboard.down('Meta'); // Cmd key
                         await page.keyboard.press('Enter');
                         await page.keyboard.up('Meta');
                     } else { // Windows/Linux/Other
                         await page.keyboard.down('Control'); // Ctrl key
                         await page.keyboard.press('Enter');
                         await page.keyboard.up('Control');
                     }

                     console.log(`✅ Reply triggered via keyboard for tweet ${tweetId}.`);
                     repliedCount++; // Increment reply count

                     // --- Add Tweet ID to History and Save ---
                     addRepliedTweetId(tweetId, repliedTweetIds);
                     await saveRepliedTweetIds(repliedTweetIds); // Save history immediately

                      // --- Wait for Modal to Close After Sending ---
                      // Use a short timeout here as we expect it to close quickly
                      try {
                           await page.waitForSelector(modalDialogSelector, { hidden: true, timeout: 5000 });
                           console.log("[Tweets] Reply composer closed after sending.");
                      } catch (e) {
                           console.warn(`[Tweets] Reply composer modal did not disappear for tweet ${tweetId} after sending:`, e.message);
                           await page.keyboard.press('Escape').catch(() => {}); // Fallback escape
                           await new Promise(resolve => setTimeout(resolve, 1000));
                      }


                 } catch (uiInteractionError) {
                     console.error(`❌ Error during UI reply interaction for tweet ${tweetId}:`, uiInteractionError.message);
                      // Capture a screenshot on this UI failure
                      try {
                           await page.screenshot({ path: `ui_reply_fail_${tweetId}_${Date.now()}.png` });
                           console.log(`[Tweets] Screenshot saved: ui_reply_fail_${tweetId}_${Date.now()}.png`);
                      } catch (ssError) {
                           console.error(`[Tweets] Failed to save screenshot for tweet ${tweetId}:`, ssError.message);
                      }
                     // Attempt to close any lingering modal
                      await page.keyboard.press('Escape').catch(() => {});
                      await new Promise(resolve => setTimeout(resolve, 1000));
                     console.log(`[Tweets] Skipping final steps for tweet ${tweetId} due to UI interaction failure.`);
                     continue; // Skip to the next tweet
                 }


                // --- Delay before processing the next tweet ---
                if (repliedCount < MAX_REPLIES_PER_QUERY_RUN && processedCount < MAX_TWEETS_TO_PROCESS_PER_QUERY) {
                     console.log(`[Tweets] Waiting ${REPLY_DELAY_MS / 1000} seconds before next tweet processing.`);
                    await new Promise(resolve => setTimeout(resolve, REPLY_DELAY_MS));
                }

            } catch (tweetError) {
                console.error(`❌ General Error processing tweet ${processedCount} for query "${query}":`, tweetError.message);
                 // Attempt to close any potential open modal before continuing
                 await page.keyboard.press('Escape').catch(() => {});
                 await new Promise(resolve => setTimeout(resolve, 1000));
                 // Note: More specific UI errors are caught in the inner try/catch
            }
        } // End of tweet loop

        console.log(`[Tweets] Finished processing for query "${query}". Replied to ${repliedCount}.`);


    } catch (error) {
        console.error(`❌ General Error during tweet scraping/replying for query "${query}":`, error.message);
    } finally {
        console.log(`--- Finished Tweet Processing for Query: "${query}" ---`);
        return repliedTweetIds; // Always return the (potentially updated) list of IDs
    }
}

module.exports = scrapeTweets;