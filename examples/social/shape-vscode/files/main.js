const vscode = acquireVsCodeApi();

let state = initialState;
let activeChatId = state.currentChatId || null;
let loading = false; // Add loading state

function render() {
  document.body.innerHTML = `
    <div class="container">
      <div class="sidebar">
        <div class="contacts">
          ${Object.entries(state.chats).map(([id, chat]) => `
            <div class="contact ${id === activeChatId ? 'active' : ''}" data-id="${id}">
              <span>${chat.type === 'group' ? chat.name : id}</span>
              <div class="icons">
                <span class="codicon codicon-trash clear-chat" title="Clear Chat" data-id="${id}"></span>
                <span class="codicon codicon-close remove-chat" title="Remove Chat" data-id="${id}"></span>
              </div>
            </div>
          `).join('')}
        </div>
        <div class="buttons">
          <button id="addShapeBtn" ${loading ? 'disabled' : ''}>+ Add Shape</button>
          <button id="makeGroupBtn" ${loading ? 'disabled' : ''}>+ Make new groupchat</button>
          ${loading ? '<div style="color:#2d8cf0;margin-top:8px;">Adding...</div>' : ''}
        </div>
      </div>
      <div class="chatArea">
        <div id="chatHistory" class="history"></div>
        <div class="inputArea">
          <input type="text" id="messageInput" placeholder="Type a message..."/>
          <button id="sendBtn">Send</button>
        </div>
      </div>
    </div>
  `;

  if (activeChatId) {
    vscode.postMessage({ command: 'loadHistory', chatId: activeChatId });
  } else {
    // Clear chat area if no active chat
    const historyDiv = document.getElementById('chatHistory');
    if (historyDiv) historyDiv.innerHTML = '';
  }

  addEventListeners();
}

function addEventListeners() {
  document.querySelectorAll('.contact').forEach(el => {
    el.addEventListener('click', () => {
      activeChatId = el.dataset.id;
      render();
    });
  });

  const addShapeBtn = document.getElementById('addShapeBtn');

  if (addShapeBtn) {
    addShapeBtn.onclick = () => {
      showShapeModal();
    };
  }

  const makeGroupBtn = document.getElementById('makeGroupBtn');

  if (makeGroupBtn) {
    makeGroupBtn.onclick = () => {
      showGroupModal();
    };
  }

  document.querySelectorAll('.clear-chat').forEach(el => {
    el.onclick = (e) => {
      e.stopPropagation();
      const id = el.dataset.id;
      vscode.postMessage({ command: 'clearChat', chatId: id });
    };
  });

  document.querySelectorAll('.remove-chat').forEach(el => {
    el.onclick = (e) => {
      e.stopPropagation();
      const id = el.dataset.id;
      vscode.postMessage({ command: 'removeChat', chatId: id });
      if (id === activeChatId) activeChatId = null;
      render();
    };
  });

  document.getElementById('sendBtn').onclick = () => {
    const msg = document.getElementById('messageInput').value.trim();
    if (msg && activeChatId) {
      // Immediately add the user's message to the chat history and update UI
      if (!state.chats[activeChatId].history) state.chats[activeChatId].history = [];
      state.chats[activeChatId].history.push({ role: 'user', content: msg });
      updateChat();
      vscode.postMessage({
        command: 'send',
        chatId: activeChatId,
        userMessage: msg
      });
      document.getElementById('messageInput').value = '';
    }
  };

  document.getElementById('messageInput').addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      document.getElementById('sendBtn').click();
    }
  });
}

function showShapeModal() {
  // Remove any existing modal
  const oldModal = document.getElementById('shapeModal');
  if (oldModal) oldModal.remove();

  const modal = document.createElement('div');
  modal.id = 'shapeModal';
  modal.style.position = 'fixed';
  modal.style.top = '0';
  modal.style.left = '0';
  modal.style.width = '100vw';
  modal.style.height = '100vh';
  modal.style.background = 'rgba(0,0,0,0.5)';
  modal.style.display = 'flex';
  modal.style.alignItems = 'center';
  modal.style.justifyContent = 'center';
  modal.style.zIndex = '1000';

  modal.innerHTML = `
    <div style="background:#23272e;padding:32px 28px 24px 28px;border-radius:12px;box-shadow:0 4px 32px #0008;min-width:320px;display:flex;flex-direction:column;align-items:center;">
      <h2 style="margin:0 0 16px 0;font-size:20px;color:#fff;">Add Shape</h2>
      <input id="shapeUsernameInput" type="text" placeholder="Shape username" style="width:100%;padding:10px 12px;border-radius:6px;border:none;font-size:15px;background:#1e1e1e;color:#d4d4d4;margin-bottom:18px;outline:none;" autofocus />
      <div style="display:flex;gap:12px;width:100%;justify-content:flex-end;">
        <button id="cancelShapeBtn" style="padding:8px 18px;border:none;border-radius:6px;background:#444;color:#fff;font-size:15px;cursor:pointer;">Cancel</button>
        <button id="confirmShapeBtn" style="padding:8px 18px;border:none;border-radius:6px;background:#2d8cf0;color:#fff;font-size:15px;font-weight:500;cursor:pointer;">Add</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  document.getElementById('cancelShapeBtn').onclick = () => modal.remove();
  document.getElementById('shapeUsernameInput').onkeydown = (e) => {
    if (e.key === 'Enter') document.getElementById('confirmShapeBtn').click();
  };
  document.getElementById('confirmShapeBtn').onclick = () => {
    const username = document.getElementById('shapeUsernameInput').value.trim();
    if (username) {
      vscode.postMessage({ command: 'addShape', username });
      modal.remove();
    } else {
      document.getElementById('shapeUsernameInput').focus();
    }
  };
}

function showGroupModal() {
  // Remove any existing modal
  const oldModal = document.getElementById('groupModal');
  if (oldModal) oldModal.remove();

  const modal = document.createElement('div');
  modal.id = 'groupModal';
  modal.style.position = 'fixed';
  modal.style.top = '0';
  modal.style.left = '0';
  modal.style.width = '100vw';
  modal.style.height = '100vh';
  modal.style.background = 'rgba(0,0,0,0.5)';
  modal.style.display = 'flex';
  modal.style.alignItems = 'center';
  modal.style.justifyContent = 'center';
  modal.style.zIndex = '1000';

  modal.innerHTML = `
    <div style="background:#23272e;padding:32px 28px 24px 28px;border-radius:12px;box-shadow:0 4px 32px #0008;min-width:340px;display:flex;flex-direction:column;align-items:center;">
      <h2 style="margin:0 0 16px 0;font-size:20px;color:#fff;">Create Group Chat</h2>
      <input id="groupNameInput" type="text" placeholder="Group name" style="width:100%;padding:10px 12px;border-radius:6px;border:none;font-size:15px;background:#1e1e1e;color:#d4d4d4;margin-bottom:12px;outline:none;" autofocus />
      <input id="groupMembersInput" type="text" placeholder="Comma separated shape usernames" style="width:100%;padding:10px 12px;border-radius:6px;border:none;font-size:15px;background:#1e1e1e;color:#d4d4d4;margin-bottom:18px;outline:none;" />
      <div style="display:flex;gap:12px;width:100%;justify-content:flex-end;">
        <button id="cancelGroupBtn" style="padding:8px 18px;border:none;border-radius:6px;background:#444;color:#fff;font-size:15px;cursor:pointer;">Cancel</button>
        <button id="confirmGroupBtn" style="padding:8px 18px;border:none;border-radius:6px;background:#2d8cf0;color:#fff;font-size:15px;font-weight:500;cursor:pointer;">Create</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  document.getElementById('cancelGroupBtn').onclick = () => modal.remove();
  document.getElementById('groupNameInput').onkeydown = (e) => {
    if (e.key === 'Enter') document.getElementById('groupMembersInput').focus();
  };
  document.getElementById('groupMembersInput').onkeydown = (e) => {
    if (e.key === 'Enter') document.getElementById('confirmGroupBtn').click();
  };
  document.getElementById('confirmGroupBtn').onclick = () => {
    const name = document.getElementById('groupNameInput').value.trim();
    const membersRaw = document.getElementById('groupMembersInput').value.trim();
    if (name && membersRaw) {
      const members = membersRaw.split(',').map(s => s.trim()).filter(Boolean);
      if (members.length > 0) {
        const groupId = `group_${Date.now()}`;
        vscode.postMessage({ command: 'addGroup', groupId, name, members });
        modal.remove();
        return;
      }
    }
    document.getElementById('groupNameInput').focus();
  };
}

window.addEventListener('message', event => {
  const msg = event.data;

  if (msg.command === 'response') {
    state.chats[activeChatId].history.push({ role: 'assistant', content: msg.text });
    updateChat();
  }

  if (msg.command === 'loadHistory') {
    state.chats[msg.chatId].history = msg.history;
    updateChat();
  }

  if (msg.command === 'cleared') {
    state.chats[msg.chatId].history = [];
    updateChat();
  }

  if (msg.command === 'removed') {
    delete state.chats[msg.chatId];
    if (activeChatId === msg.chatId) activeChatId = null;
    render();
  }

  if (msg.command === 'added') {
    state.chats[msg.chatId] = msg.chat; // Use the chat object from backend
    activeChatId = msg.chatId;
    loading = false;
    render();
  }
});

function updateChat() {
  const historyDiv = document.getElementById('chatHistory');
  if (!historyDiv) return;
  const messages = state.chats[activeChatId]?.history || [];
  const chat = state.chats[activeChatId];
  if (chat && chat.type === 'group') {
    // Render group chat: show each assistant reply as separate blocks with name and icon
    historyDiv.innerHTML = messages.map(m => {
      if (m.role === 'assistant') {
        // Split assistant content by shape, expecting format: "**name**: message"
        const parts = m.content.split(/\*\*(.*?)\*\*: /g).filter(Boolean);
        let blocks = [];
        for (let i = 0; i < parts.length; i += 2) {
          const name = parts[i];
          const content = parts[i + 1] || '';
          blocks.push(`
            <div class="assistant group-reply">
              <span class="shape-icon" title="${name}" style="margin-right:8px;vertical-align:middle;display:inline-block;width:28px;height:28px;background:#2d8cf0;border-radius:50%;color:#fff;text-align:center;line-height:28px;font-weight:bold;font-size:15px;">${name ? name[0].toUpperCase() : '?'}</span>
              <span class="shape-name" style="font-weight:600;color:#2d8cf0;vertical-align:middle;">${name}</span>
              <div class="shape-msg" style="margin-left:36px;margin-top:2px;">${content}</div>
            </div>
          `);
        }
        return blocks.join('');
      } else if (m.role === 'user') {
        return `<div class="user">${m.content}</div>`;
      }
      return '';
    }).join('');
  } else {
    // Normal chat
    historyDiv.innerHTML = messages.map(m =>
      `<div class="${m.role}">${m.content}</div>`
    ).join('');
  }
  historyDiv.scrollTop = historyDiv.scrollHeight;
}

render();
