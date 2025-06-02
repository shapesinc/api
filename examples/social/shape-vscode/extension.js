const vscode = require('vscode');
const path = require('path');

let fetch;
try {
  fetch = global.fetch || require('node-fetch');
} catch (e) {
  fetch = (...args) => Promise.reject(new Error('Fetch not available'));
}
  
require('dotenv').config({ path: path.join(__dirname, '.env') });

function activate(context) {
  let chats = context.workspaceState.get('shapesChats', {});
  let currentChatId = context.workspaceState.get('currentChatId', null);

  context.subscriptions.push(
    vscode.commands.registerCommand('shapeschat.openChat', () => {
      const panel = vscode.window.createWebviewPanel(
        'shapesChat',
        'Shapes Chat',
        vscode.ViewColumn.Beside,
        {
          enableScripts: true,
          localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, 'files')]
        }
      );

      const scriptUri = panel.webview.asWebviewUri(
        vscode.Uri.joinPath(context.extensionUri, 'files', 'main.js')
      );
      const styleUri = panel.webview.asWebviewUri(
        vscode.Uri.joinPath(context.extensionUri, 'files', 'style.css')
      );

      panel.webview.html = getWebviewContent(chats, currentChatId, scriptUri, styleUri);

      panel.webview.onDidReceiveMessage(
        async (msg) => {
          const { command } = msg;

          try {
            if (command === 'pickFile') {
              // Open file picker dialog
              const uris = await vscode.window.showOpenDialog({
                canSelectMany: msg.allowMultiple === true,
                openLabel: 'Attach',
                filters: { 'All files': ['*'] }
              });
              if (uris && uris.length > 0) {
                const files = [];
                for (const fileUri of uris) {
                  const fileName = fileUri.path.split('/').pop();
                  const fileContent = await vscode.workspace.fs.readFile(fileUri);
                  const contentStr = Buffer.from(fileContent).toString('utf8');
                  files.push({ name: fileName, content: contentStr });
                }
                if (files.length > 1) {
                  panel.webview.postMessage({ command: 'filePicked', files });
                } else {
                  panel.webview.postMessage({ command: 'filePicked', file: files[0] });
                }
              }
              return;
            }

            if (command === 'send') {
              const { chatId, userMessage, attachedFile, attachedFiles } = msg;
              if (!chatId || !userMessage) return;

              currentChatId = chatId;
              if (!chats[chatId]) chats[chatId] = { type: 'shape', history: [] };
              let userMsgContent = userMessage;
              let filesToAttach = attachedFiles || (attachedFile ? [attachedFile] : []);
              // Do NOT append file content to userMsgContent for UI, only for API
              if (filesToAttach && filesToAttach.length > 0) {
                userMsgContent += filesToAttach.map(f => `\n\n[Attached file: ${f.name}]`).join('');
              }
              // Store only the user message (with file names) in history
              chats[chatId].history.push({ role: 'user', content: userMsgContent });

              // Prepare messages for API: always include all history, including system messages
              const apiMessages = chats[chatId].history.map(m => {
                if (m.role === 'user' && filesToAttach && filesToAttach.length > 0) {
                  // For API, append file content to the user message
                  return {
                    role: m.role,
                    content: userMessage + filesToAttach.map(f => `\n\n[Attached file: ${f.name}]\n\n———\n${f.content}\n———`).join('')
                  };
                }
                return m;
              });

              if (chats[chatId].type === 'group') {
                const replies = [];
                for (const member of chats[chatId].members) {
                  try {
                    const res = await fetch('https://api.shapes.inc/v1/chat/completions', {
                      method: 'POST',
                      headers: {
                        'Authorization': `Bearer ${process.env.SHAPESINC_API_KEY}`,
                        'Content-Type': 'application/json'
                      },
                      body: JSON.stringify({
                        model: `shapesinc/${member}`,
                        messages: apiMessages
                      })
                    });
                    const json = await res.json();
                    console.log('Shapes API response:', JSON.stringify(json, null, 2));
                    const reply = json?.choices?.[0]?.message?.content || '⚠️ No reply.';
                    replies.push(`**${member}**: ${reply}`);
                  } catch (err) {
                    replies.push(`**${member}**: 🚫 ${err.message || 'Error'}`);
                  }
                }
                chats[chatId].history.push({ role: 'assistant', content: replies.join('\n\n') });
                panel.webview.postMessage({ command: 'response', text: replies.join('\n\n') });
              } else {
                try {
                  const res = await fetch('https://api.shapes.inc/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                      'Authorization': `Bearer ${process.env.SHAPESINC_API_KEY}`,
                      'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                      model: `shapesinc/${chatId}`,
                      messages: apiMessages
                    })
                  });

                  const json = await res.json();
                  console.log('Shapes API response:', JSON.stringify(json, null, 2));
                  const botReply = json?.choices?.[0]?.message?.content || '⚠️ Unexpected API response.';
                  chats[chatId].history.push({ role: 'assistant', content: botReply });

                  panel.webview.postMessage({ command: 'response', text: botReply });
                } catch (err) {
                  panel.webview.postMessage({
                    command: 'response',
                    text: `🚫 Error: ${err.message || 'Something went wrong'}`
                  });
                }
              }
            }

            if (command === 'loadHistory') {
              const { chatId } = msg;
              currentChatId = chatId;
              if (!chats[chatId]) chats[chatId] = { type: 'shape', history: [] };
              panel.webview.postMessage({
                command: 'loadHistory',
                chatId,
                history: chats[chatId].history
              });
            }

            if (command === 'clearChat') {
              const { chatId } = msg;
              if (chats[chatId]) chats[chatId].history = [];
              panel.webview.postMessage({ command: 'cleared', chatId });
            }

            if (command === 'removeChat') {
              const { chatId } = msg;
              delete chats[chatId];
              panel.webview.postMessage({ command: 'removed', chatId });
            }

            if (command === 'addShape') {
              const { username } = msg;
              chats[username] = { type: 'shape', history: [] };
              panel.webview.postMessage({ command: 'added', chatId: username, chat: chats[username] });
            }

            if (command === 'addGroup') {
              const { groupId, name, members } = msg;
              chats[groupId] = { type: 'group', name, members, history: [] };
              panel.webview.postMessage({ command: 'added', chatId: groupId, chat: chats[groupId] });
            }

            if (command === 'switchChat') {
              const { chatId } = msg;
              currentChatId = chatId;
              panel.webview.postMessage({
                command: 'loadHistory',
                chatId,
                history: chats[chatId]?.history || []
              });
            }

            // Handle group member add/remove
            if (msg.command === 'addMembersToGroup') {
              const { chatId, newMembers } = msg;
              if (chats[chatId] && chats[chatId].type === 'group') {
                const addedMembers = newMembers.filter(m => !(chats[chatId].members || []).includes(m));
                chats[chatId].members = Array.from(new Set([...(chats[chatId].members || []), ...newMembers]));
                // Add system message for each new member
                for (const member of addedMembers) {
                  chats[chatId].history.push({ role: 'system', content: `${member} was added to the gc` });
                }
                panel.webview.postMessage({ command: 'added', chatId, chat: chats[chatId] });
              }
            }
            if (msg.command === 'removeMemberFromGroup') {
              const { chatId, memberIndex } = msg;
              if (chats[chatId] && chats[chatId].type === 'group') {
                const removedMember = chats[chatId].members[memberIndex];
                chats[chatId].members.splice(memberIndex, 1);
                // Add system message for removed member
                if (removedMember) {
                  chats[chatId].history.push({ role: 'system', content: `${removedMember} was removed from the gc` });
                }
                panel.webview.postMessage({ command: 'added', chatId, chat: chats[chatId] });
              }
            }

            await context.workspaceState.update('shapesChats', chats);
            await context.workspaceState.update('currentChatId', currentChatId);
          } catch (err) {
            vscode.window.showErrorMessage('Shapes Chat error: ' + (err.message || err));
            panel.webview.postMessage({ command: 'error', message: err.message || String(err) });
          }
        },
        undefined,
        context.subscriptions
      );
    })
  );
}

function getWebviewContent(chats, currentChatId, scriptUri, styleUri) {
  const initialState = {
    chats,
    currentChatId
  };

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <script>
    const initialState = ${JSON.stringify(initialState)};
  </script>
  <link href="https://cdn.jsdelivr.net/npm/@vscode/codicons/dist/codicon.css" rel="stylesheet">
  <link href="${styleUri}" rel="stylesheet">
  <script defer src="${scriptUri}"></script>
</head>
<body></body>
</html>`;
}

function deactivate() {}

module.exports = { activate, deactivate };
