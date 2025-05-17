import { getReviewFromShapes } from './services/shapesService.js';

/**
 * Main Probot app to automate PR review and responses.
 * @param {import('probot').Probot} app
 */
export default (app) => {
  app.log.info("🤖 PR Bot loaded!");

  // Log webhook delivery information
  app.onAny(async (context) => {
    const eventName = context.name;
    const deliveryId = context.payload.delivery_id;
    const webhookId = context.payload.webhook_id;
    
    app.log.info(`Received webhook event: ${eventName}`, {
      deliveryId,
      webhookId,
      event: eventName,
      action: context.payload.action,
      repository: context.payload.repository?.full_name
    });
  });

  // === 1. AUTO REVIEW PRs ===
  app.on("pull_request.opened", async (context) => {
    app.log.info("Received pull_request.opened event");

    const pr = context.payload.pull_request;
    app.log.info(`Processing PR #${pr.number} in ${context.payload.repository.full_name}`);

    try {
      // Get the diff of the pull request
      const diff = await context.octokit.pulls.get({
        owner: context.payload.repository.owner.login,
        repo: context.payload.repository.name,
        pull_number: pr.number,
        headers: {
          accept: 'application/vnd.github.v3.diff'
        }
      });
      
      app.log.info(`Successfully retrieved diff for PR #${pr.number}`);
      
      try {
        // Get the review content from the Shapes API
        const reviewText = await getReviewFromShapes(diff.data);
        app.log.info("Successfully received review from Shapes API");

        // Post the review as a comment
        await context.octokit.issues.createComment({
          owner: context.payload.repository.owner.login,
          repo: context.payload.repository.name,
          issue_number: pr.number,
          body: `🤖 Shapes Review:\n\n${reviewText}`,
        });

        app.log.info(`Successfully posted review for PR #${pr.number}`);
      } catch (error) {
        app.log.error("Error during PR review:", error);
        // Notify about the error in the PR
        await context.octokit.issues.createComment({
          owner: context.payload.repository.owner.login,
          repo: context.payload.repository.name,
          issue_number: pr.number,
          body: `❌ Error during review: ${error.message}`,
        });
      }
    } catch (error) {
      app.log.error("Error retrieving PR diff:", error);
      await context.octokit.issues.createComment({
        owner: context.payload.repository.owner.login,
        repo: context.payload.repository.name,
        issue_number: pr.number,
        body: `❌ Error retrieving PR diff: ${error.message}`,
      });
    }
  });

  // === 2. RESPOND TO @MENTIONS ===
  app.on("issue_comment.created", async (context) => {
    const comment = context.payload.comment.body;
    const sender = context.payload.comment.user.login;
    const botUsername = "codegingerai[bot]"; // Bot usernames are in this format

    app.log.info(`Received comment from ${sender} in ${context.payload.repository.full_name}`);

    // 🚫 Ignore comments made by the bot itself
    if (sender === botUsername) {
      app.log.info("Ignoring bot's own comment");
      return;
    }

    if (comment.includes(`@${botUsername}`)) {
      app.log.info(`Processing mention from ${sender}`);
      const issue = context.payload.issue;

      if (!issue.pull_request) {
        app.log.info("Comment was not on a PR, ignoring");
        return;
      }

      try {
        const pr = await context.octokit.pulls.get({
          owner: context.payload.repository.owner.login,
          repo: context.payload.repository.name,
          pull_number: issue.number,
        });

        const allComments = await context.octokit.issues.listComments({
          owner: context.payload.repository.owner.login,
          repo: context.payload.repository.name,
          issue_number: issue.number,
        });

        const contextText = `
📌 PR Title: ${pr.data.title}
📝 PR Body: ${pr.data.body || "No body provided"}
💬 Comments:
${allComments.data.map(c => `- ${c.user.login}: ${c.body}`).join("\n")}
`;

        await context.octokit.issues.createComment({
          owner: context.payload.repository.owner.login,
          repo: context.payload.repository.name,
          issue_number: issue.number,
          body: `👋 Thanks for the mention! Here's what I see:\n\n${contextText}`,
        });

        app.log.info(`Successfully responded to mention from ${sender}`);
      } catch (error) {
        app.log.error("Error processing mention:", error);
        await context.octokit.issues.createComment({
          owner: context.payload.repository.owner.login,
          repo: context.payload.repository.name,
          issue_number: issue.number,
          body: `❌ Error processing your mention: ${error.message}`,
        });
      }
    }
  });
}; 