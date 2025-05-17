// checkdm.js
const { generateReply } = require('./replyclient'); // Import the AI function

/**
 * Sends a reply in the current DM conversation.
 * @param {object} page - Puppeteer Page object.
 * @param {string} replyText - The text to send.
 * @returns {Promise<void>}
 */
async function sendReply(page, replyText) {
    try {
        console.log("Attempting to send reply...");
        // Wait for the input box to be visible and enabled
        const inputBox = await page.waitForSelector('[data-testid="dmComposerTextInput"]', { visible: true, timeout: 10000 });

        if (inputBox) {
            await inputBox.type(replyText, { delay: 20 }); // Add a small delay for typing realism
            console.log("Typed reply into input box.");

            // Wait for the send button to become clickable (it enables when text is typed)
            const sendButton = await page.waitForSelector('[data-testid="dmComposerSendButton"]:not([aria-disabled="true"])', { timeout: 5000 });
             if (sendButton) {
                 await sendButton.click();
                 console.log("✅ Reply sent.");
             } else {
                 console.log("❌ Send button did not become enabled.");
             }
        } else {
            console.log("❌ DM input box not found.");
        }
    } catch (error) {
        console.error("❌ Error sending reply:", error.message);
        // You might want to take a screenshot here on error
         await page.screenshot({ path: 'send_reply_error_screenshot.png' });
    }
}


/**
 * Checks for and processes unread Direct Messages.
 * @param {object} page - Puppeteer Page object.
 * @returns {Promise<void>}
 */
async function checkAndScrapeUnreadDMs(page) {
    try {
        console.log("\n--- Checking X DMs ---");
        console.log("Navigating to X DMs...");
        await page.goto('https://x.com/messages', { waitUntil: 'networkidle2' });
        await new Promise(resolve => setTimeout(resolve, 5000)); // Give page elements time to render

        async function countUnreadConversations() {
             // This selector is specific and might break. It looks for an element
             // often used as an unread indicator within the conversation list item.
             // A more robust method might involve checking aria attributes or text styles.
            return await page.evaluate(() => {
                return document.querySelectorAll('[data-testid="conversation"] .css-175oi2r.r-sdzlij.r-lrvibr.r-615f2u.r-u8s1d.r-3sxh79.r-1xc7w19.r-1phboty.r-rs99b7.r-l5o3uw.r-1or9b2r.r-1lg5ma5.r-5soawk').length;
            });
        }

        let initialUnreadCount = await countUnreadConversations();
        console.log(`Initial total unread conversations: ${initialUnreadCount}`);

        if (initialUnreadCount === 0) {
            console.log('No unread messages found.');
            return;
        }

        let processedCount = 0;

        // Loop while there are potential unread conversations to process
        // We will recount inside the loop after processing each one
        while (true) {
            const conversations = await page.$$('[data-testid="conversation"]');
            let foundUnreadInIteration = false;

            for (const conversation of conversations) {
                try {
                    // Check if this specific conversation element has the unread indicator
                    const hasUnread = await conversation.$('.css-175oi2r.r-sdzlij.r-lrvibr.r-615f2u.r-u8s1d.r-3sxh79.r-1xc7w19.r-1phboty.r-rs99b7.r-l5o3uw.r-1or9b2r.r-1lg5ma5.r-5soawk');

                    if (hasUnread) {
                        foundUnreadInIteration = true;
                        processedCount++;
                        console.log(`Opening unread conversation... (Processing ${processedCount})`);

                        // Get conversation partner handle (optional, for logging or potential future use)
                        const userHandleElement = await conversation.$('a[role="link"] span');
                        let userHandle = 'UnknownUser';
                         if (userHandleElement) {
                             userHandle = await userHandleElement.evaluate(el => el.textContent.replace(/^@/, '').trim());
                             console.log(`Conversation with: @${userHandle}`);
                         }


                        await conversation.click();
                        // Wait for the message scroller container to indicate conversation is loaded
                        await page.waitForSelector('[data-testid="DmScrollerContainer"]', { timeout: 15000 });
                        await new Promise(resolve => setTimeout(resolve, 3000)); // Additional short wait for messages to render

                        // Scrape the last few messages
                        const msgElements = await page.$$('[data-testid="tweetText"]');
                        const lastMessages = msgElements.slice(-5); // Get last 5 messages
                        const conversationHistory = [];

                        for (const msgEl of lastMessages) {
                            const messageText = await msgEl.evaluate(el => el.textContent.trim());
                            if (!messageText) continue; // Skip empty messages

                            // Determine sender based on parent element's background color
                            // WARNING: This is fragile and depends heavily on current X UI CSS.
                            // Light/Dark mode or UI updates can break this.
                            const parentEl = await msgEl.evaluateHandle(el => el.closest('[data-testid="tweet"]')); // Find the message container
                            let sender = 'Them'; // Default to Them
                            if (parentEl) {
                                try {
                                    const backgroundColor = await parentEl.evaluate(el => window.getComputedStyle(el).backgroundColor);
                                     // Check for X blue color (common for sent messages)
                                    if (backgroundColor.includes('rgb(29, 155, 240)')) {
                                        sender = 'You';
                                    }
                                     // You might need additional checks for different themes/colors
                                } catch (cssError) {
                                    console.warn("Could not get background color to determine sender:", cssError.message);
                                }
                            }

                            conversationHistory.push({ sender, text: messageText });
                        }

                        console.log("Recent conversation history:", conversationHistory);

                        // Find the last message from "Them" to reply to
                        const lastMessageFromThem = conversationHistory.slice().reverse().find(msg => msg.sender === 'Them');

                        if (!lastMessageFromThem) {
                            console.log("🤷 No message from 'Them' in recent history to reply to.");
                        } else {
                             console.log("Generating reply for message:", lastMessageFromThem.text);
                            // Generate AI reply
                            const aiReply = await generateReply(conversationHistory); // Use the imported function
                            console.log("🟢 AI Reply:", aiReply);

                            if (aiReply && aiReply.length > 0 && aiReply.length <= 280) { // Basic length check
                                await sendReply(page, aiReply); // Use the sendReply function
                                await new Promise(resolve => setTimeout(resolve, 2000)); // Wait after sending
                            } else {
                                 console.warn("Generated reply is empty or too long:", aiReply);
                            }
                        }

                        // Go back to the DM list
                        console.log("Going back to DM list...");
                        await page.goBack();
                        // Wait for the conversation list element to reappear
                        await page.waitForSelector('[data-testid="DmList"]', { timeout: 10000 });
                        await new Promise(resolve => setTimeout(resolve, 3000)); // Give list time to render fully

                        // After going back and waiting, re-evaluate the unread count to exit the loop if done
                        const currentUnreadCount = await countUnreadConversations();
                         console.log(`Current unread conversations remaining: ${currentUnreadCount}`);

                         // If the count hasn't decreased, something might be wrong or
                         // the UI hasn't updated. We might break or retry.
                         // For now, the loop structure relies on finding *an* unread conversation.
                         // Finding one and processing it will hopefully reduce the count eventually.

                    } // End if(hasUnread)

                } catch (convError) {
                    console.error(`❌ Error processing a conversation: ${convError.message}`);
                    // Attempt to go back if we are stuck inside a conversation
                     try {
                         console.log("Attempting to recover by going back...");
                         await page.goBack();
                          await page.waitForSelector('[data-testid="DmList"]', { timeout: 10000 });
                     } catch (backError) {
                         console.error("❌ Failed to go back:", backError.message);
                         // If we can't even go back, the page might be in a bad state.
                         // Consider navigating directly to the DM list again.
                         console.log("Navigating directly back to DMs for recovery.");
                         await page.goto('https://x.com/messages', { waitUntil: 'networkidle2' }).catch(navErr => console.error("Failed direct navigation:", navErr));
                         await new Promise(resolve => setTimeout(resolve, 5000));
                     }
                    await page.screenshot({ path: `conv_error_screenshot_${processedCount}.png` });
                }
            } // End for loop through conversations

            // Re-check unread count after iterating through visible conversations
            const remainingUnread = await countUnreadConversations();
            console.log(`Re-evaluated unread count: ${remainingUnread}`);

            // If no unread conversations were found in this iteration OR
            // if the re-evaluated count is 0, we can break the while loop.
            // The `foundUnreadInIteration` flag handles cases where the list might be partially loaded
            // and we processed some but didn't find *any* unread in the current scan.
            if (remainingUnread === 0 || !foundUnreadInIteration) {
                 console.log(`✅ DM processing loop finished. Total processed in this run: ${processedCount}.`);
                 break; // Exit the while loop
            }

             // Optional: Scroll down the DM list to load more conversations if needed
             // This adds complexity as scrolling logic is platform-specific.
             // For simplicity now, we assume all unread are visible initially or load by scrolling.
             // Implementing scrolling would require finding the scrollable element and evaluating window.scrollBy or element.scrollTop.
             // await page.evaluate(() => {
             //     const dmList = document.querySelector('[data-testid="DmList"]'); // Find your scrollable container
             //     if (dmList) {
             //         dmList.scrollTop = dmList.scrollHeight;
             //     }
             // });
             // await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for new items to load


        } // End while loop

    } catch (error) {
        console.error('❌ General Error during DM check:', error.message);
        await page.screenshot({ path: 'dm_general_error_screenshot.png' });
    } finally {
        console.log("--- Finished DM Checking ---");
    }
}


module.exports = checkAndScrapeUnreadDMs; // Export the main function
// sendReply is kept internal to this module as it's a helper for checkAndScrapeUnreadDMs