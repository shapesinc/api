// main.js
require('dotenv').config();
// Import puppeteer-extra and the stealth plugin
const puppeteerExtra = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs/promises');
const checkDMs = require('./checkdm');
const scrapeTweets = require('./scrapetweets');
const { loadRepliedTweetIds, saveRepliedTweetIds } = require('./historyManager'); // Import history manager functions

// Use the stealth plugin
puppeteerExtra.use(StealthPlugin());

const COOKIE_FILE = './cookies.json'; // Define cookie file path

(async () => {
    let browser;
    let repliedTweetIds = [];
    let loggedIn = false; // Flag to track login status

    try {
        // --- Load Reply History ---
        repliedTweetIds = await loadRepliedTweetIds();

        // --- Launch Browser using puppeteer-extra ---
        // Note: Use puppeteerExtra.launch instead of puppeteer.launch
        browser = await puppeteerExtra.launch({
            headless: false, // Set to true for production when debugging is done
            args: [
                 '--no-sandbox',
                 '--disable-setuid-sandbox',
                 '--disable-infobars',
                 '--window-position=0,0',
                 '--ignore-certificate-errors', // Corrected typo
                 '--ignore-certificate-errors-spki-list',
                 '--disable-extensions',
                 '--start-maximized' // Start browser maximized
               ],
             defaultViewport: null // Allow the viewport to be the full page size
        });
        const page = await browser.newPage();
        page.setDefaultTimeout(45000);

        // --- Cookie Loading and Initial Navigation ---
        try {
            await fs.access(COOKIE_FILE); // Check if cookie file exists
            console.log(`Cookie file found at ${COOKIE_FILE}. Attempting to load cookies.`);
            const cookiesString = await fs.readFile(COOKIE_FILE, 'utf8');
            const cookies = JSON.parse(cookiesString);

            if (cookies && cookies.length > 0) {
                await page.setCookie(...cookies); // Set cookies on the page
                console.log("Cookies loaded successfully. Navigating directly to X.");

                // Navigate to main site using cookies
                await page.goto('https://x.com', { waitUntil: 'networkidle2' });

                // Verify if login was successful using cookies by waiting for a logged-in element
                try {
                    // Wait for a common element on the feed to confirm login
                    await page.waitForSelector('[data-testid="primaryColumn"]', { timeout: 15000 }); // Shorter timeout for cookie verification
                    console.log("Logged in successfully using cookies.");
                    loggedIn = true;
                } catch (e) {
                    console.warn("⚠️ Cookies did not result in a logged-in session within timeout. Proceeding with standard login.");
                    // Cookies failed, need to proceed to standard login page
                    await page.goto('https://x.com/login', { waitUntil: 'networkidle2' }); // Go to login page if cookies failed
                }
            } else {
                console.warn("⚠️ Cookie file is empty or invalid. Proceeding with standard login.");
                 await page.goto('https://x.com/login', { waitUntil: 'networkidle2' }); // Go to login page if file empty/invalid
            }

        } catch (e) {
            // Catch errors like file not found, read errors, parse errors, or initial cookie verification timeout
            console.warn(`⚠️ Failed to load or use cookies (${e.message}). Proceeding with standard login.`);
            await page.goto('https://x.com/login', { waitUntil: 'networkidle2' }); // Ensure we are on the login page
        }


        // --- Standard Login Logic (Only if not logged in via cookies) ---
        if (!loggedIn) {
            console.log("Attempting standard login...");
            try {
                 await page.waitForSelector('input[name="text"]', { visible: true, timeout: 15000 });
                 await page.type('input[name="text"]', process.env.USERNAME, { delay: 50 });
                 await page.keyboard.press('Enter');

                 // Wait for the password field or potential verification step
                 // Use a more general selector that covers both password and potential username re-entry/verification
                 await page.waitForSelector('input[name="password"], input[data-testid="ocfEnterText"], input[name="text"]', { visible: true, timeout: 15000 });

                 // Check which field appeared
                 const passwordField = await page.$('input[name="password"]');
                 const verificationField = await page.$('input[data-testid="ocfEnterText"]');
                 const usernameRetryField = await page.$('input[name="text"]');


                 if (passwordField) {
                    console.log("Password field found.");
                    await page.type('input[name="password"]', process.env.PASSWORD, { delay: 50 });
                    await page.keyboard.press('Enter'); // Press Enter after typing password

                 } else if (verificationField) {
                     console.log("Verification step input field found. Manual intervention may be required.");
                      await page.screenshot({ path: 'login_verification_step.png' });
                      // Wait for manual intervention. You might want a much longer timeout here.
                      console.log("Waiting 60 seconds for manual verification step...");
                      await new Promise(resolve => setTimeout(resolve, 60000)); // Wait 60 seconds
                      // After manual intervention, you might need to check if login succeeded or if you're still stuck
                      // This is a complex scenario and might need more sophisticated handling or exiting.
                      // For now, we'll assume manual step was done and try to proceed, but it might fail.
                      console.log("Assuming manual step completed. Attempting to continue...");


                 } else if (usernameRetryField) {
                      console.log("Username re-entry or alternative verification step found. Manual intervention may be required.");
                       await page.screenshot({ path: 'login_username_retry_step.png' });
                       // Similar to verification, manual step needed.
                       console.log("Waiting 60 seconds for manual intervention...");
                       await new Promise(resolve => setTimeout(resolve, 60000));
                       console.log("Assuming manual step completed. Attempting to continue...");

                 } else {
                      // Should not happen if waitForSelector succeeded, but as a fallback
                      console.error("❌ Login failed: Unexpected field appeared after username entry.");
                      await page.screenshot({ path: 'login_unexpected_field.png' });
                      loggedIn = false;
                      await browser.close();
                      return;
                 }


                 console.log("Waiting for navigation after standard login...");
                 // Wait for navigation to the main feed after successful standard login
                 try {
                      await page.waitForSelector('[data-testid="primaryColumn"]', { timeout: 30000 }); // Wait for the main content column
                      console.log("Login successful via standard method.");
                      loggedIn = true; // Set loggedIn flag

                      // --- Save Cookies After Successful Standard Login ---
                      console.log("Saving cookies...");
                      const cookies = await page.cookies('https://x.com');
                      const cookiesString = JSON.stringify(cookies, null, 2);
                       try {
                            await fs.writeFile(COOKIE_FILE, cookiesString);
                           console.log(`Cookies saved to ${COOKIE_FILE}`);
                       } catch (saveError) {
                           console.error("❌ Failed to save cookies:", saveError);
                       }


                 } catch (e) {
                      console.error("❌ Standard login successful, but failed to load main feed.", e);
                       await page.screenshot({ path: 'login_success_feed_fail.png' });
                       // If we can't reach the feed after standard login, something is wrong. Exit.
                       loggedIn = false; // Ensure flag is false
                       await browser.close();
                       return;
                 }

            } catch (e) {
                 console.error("❌ Standard login process failed:", e);
                 await page.screenshot({ path: 'standard_login_process_failure.png' });
                 loggedIn = false; // Ensure flag is false
                 await browser.close();
                 return; // Exit if standard login failed
            }
        }

        // --- Main Workflow (Only if loggedIn is true) ---
        if (loggedIn) {
             console.log("Executing main automation workflow...");
             // 1. Execute the DM checking and replying logic
             // Note: checkDMs needs to handle being on the main feed already
             await checkDMs(page);

             // 2. Execute tweet scraping and replying logic for general query
             if (process.env.SEARCH_QUERY) {
                  console.log(`Running tweet scraping for general query: "${process.env.SEARCH_QUERY}"`);
                  repliedTweetIds = await scrapeTweets(page, process.env.SEARCH_QUERY, repliedTweetIds);
             } else {
                  console.warn("⚠️ process.env.SEARCH_QUERY is not set. Skipping general tweet search.");
             }


             // 3. Execute tweet scraping and replying logic for specific mentions
             const mentionsQuery = '@elisabethxbt'; // Define the specific user query
             console.log(`Running tweet scraping for mentions query: "${mentionsQuery}"`);
             repliedTweetIds = await scrapeTweets(page, mentionsQuery, repliedTweetIds);


             console.log("\n--- Automation Complete ---");
        } else {
             console.error("❌ Not logged in after all attempts. Skipping main automation workflow.");
        }


    } catch (error) {
        console.error('❌ An unhandled error occurred during main execution:', error); // Log full error object
        if (browser) {
             const pages = await browser.pages();
             const page = pages[pages.length - 1]; // Get the last active page
             if (page) {
                  await page.screenshot({ path: 'main_unhandled_error_screenshot.png' });
             }
        }
    } finally {
        // --- Save Reply History ---
        // Save the history one last time when the script is finishing
        await saveRepliedTweetIds(repliedTweetIds);

        // Ensure the browser is closed even if errors occur
        if (browser) {
          await browser.close();
          console.log("Browser closed.");
        }
    }
})();
