const vscode = acquireVsCodeApi();

let state = initialState;
let activeChatId = state.currentChatId || null;
let loading = false; // Add loading state
let attachedFiles = [];

function render() {
  document.body.innerHTML = `
    <div class="container">
      <div class="sidebar" id="sidebar">
        <div class="contacts">
          ${Object.entries(state.chats).map(([id, chat]) => `
            <div class="contact ${id === activeChatId ? 'active' : ''}" data-id="${id}">
              <span class="contact-avatar">
                <span class="codicon ${chat.type === 'group' ? 'codicon-organization' : 'codicon-account'}"></span>
              </span>
              <span class="contact-name">${chat.type === 'group' ? chat.name : id}</span>
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
      <div class="resizer" id="resizer"></div>
      <div class="chatArea">
        <div class="chat-header" id="chatHeader"></div>
        <div id="chatHistory" class="history"></div>
        <!-- Attached files preview ABOVE the input box -->
        <div id="attachedFilePreview" style="margin:0 32px 0 32px;"></div>
        <div class="inputArea">
          <input type="text" id="messageInput" placeholder="Type a message..."/>
          <button id="attachBtn" title="Attach file" style="margin-right:8px;background:#23272e;border:1px solid #2d8cf0;outline:none;cursor:pointer;display:flex;align-items:center;justify-content:center;height:36px;width:36px;border-radius:6px;transition:background 0.2s;">
            <span class="codicon codicon-new-file" style="font-size:22px;color:#2d8cf0;"></span>
          </button>
          <button id="sendBtn">Send</button>
        </div>
      </div>
    </div>
  `;

  // Render chat header
  renderChatHeader();
  if (activeChatId) {
    vscode.postMessage({ command: 'loadHistory', chatId: activeChatId });
  }
  addEventListeners();
  addResizerListeners();
  renderAttachedFiles();
}

function renderAttachedFiles() {
  const preview = document.getElementById('attachedFilePreview');
  if (!preview) return;
  if (attachedFiles.length > 0) {
    preview.innerHTML = `<div class="attached-files-list">${attachedFiles.map((f, i) => `
      <span>${f.name}<span class="codicon codicon-close remove-attached-file" data-index="${i}" title="Remove"></span></span>
    `).join('')}</div>`;
    preview.style.display = 'flex';
    preview.style.flexWrap = 'wrap';
    preview.style.gap = '10px';
    // Add remove listeners
    preview.querySelectorAll('.remove-attached-file').forEach(el => {
      el.onclick = (e) => {
        const idx = parseInt(el.getAttribute('data-index'));
        attachedFiles.splice(idx, 1);
        renderAttachedFiles();
      };
    });
  } else {
    preview.innerHTML = '';
    preview.style.display = 'none';
  }
}

function renderChatHeader() {
  const chatHeader = document.getElementById('chatHeader');
  if (!chatHeader) return;
  if (!activeChatId || !state.chats[activeChatId]) {
    chatHeader.innerHTML = '';
    return;
  }
  const chat = state.chats[activeChatId];
  const isGroup = chat.type === 'group';
  const iconClass = isGroup ? 'codicon-organization' : 'codicon-account';
  const name = isGroup ? chat.name : activeChatId;
  chatHeader.innerHTML = `
    <div class="chat-header-content${isGroup ? ' group-header' : ''}" ${isGroup ? 'tabindex="0" style="cursor:pointer;"' : ''}>
      <span class="chat-header-avatar"><span class="codicon ${iconClass}"></span></span>
      <span class="chat-header-name">${name}</span>
      ${isGroup ? '<span class="codicon codicon-chevron-down chat-header-dropdown"></span>' : ''}
    </div>
  `;
  if (isGroup) {
    chatHeader.querySelector('.chat-header-content').onclick = () => showGroupMembersModal(chat);
  }
}

function showGroupMembersModal(chat) {
  // Remove any existing modal
  const oldModal = document.getElementById('groupMembersModal');
  if (oldModal) oldModal.remove();
  const modal = document.createElement('div');
  modal.id = 'groupMembersModal';
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
      <h2 style="margin:0 0 16px 0;font-size:20px;color:#fff;">Group Members</h2>
      <ul style="list-style:none;padding:0;margin:0;width:100%;">
        ${chat.members.map((member, idx) => `
          <li style="display:flex;align-items:center;gap:10px;padding:8px 0;">
            <span class="codicon codicon-account" style="background:#2d8cf0;border-radius:50%;color:#fff;width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-size:16px;"></span>
            <span style="color:#d4d4d4;font-size:15px;">${member}</span>
            <span class="codicon codicon-remove remove-member-btn" title="Remove member" style="color:#e06c75;cursor:pointer;" data-index="${idx}"></span>
          </li>
        `).join('')}
      </ul>
      <button id="addMembersBtn" style="margin-top:18px;padding:8px 18px;border:none;border-radius:6px;background:#2d8cf0;color:#fff;font-size:15px;font-weight:500;cursor:pointer;">Add members</button>
      <button id="closeGroupMembersModal" style="margin-top:10px;padding:8px 18px;border:none;border-radius:6px;background:#444;color:#fff;font-size:15px;cursor:pointer;">Close</button>
      <div id="addMembersBox" style="display:none;margin-top:18px;width:100%;flex-direction:column;align-items:center;">
        <input id="addMembersInput" type="text" placeholder="Comma separated usernames" style="width:100%;padding:10px 12px;border-radius:6px;border:none;font-size:15px;background:#1e1e1e;color:#d4d4d4;margin-bottom:12px;outline:none;" />
        <div style="display:flex;gap:12px;width:100%;justify-content:flex-end;">
          <button id="cancelAddMembersBtn" style="padding:8px 18px;border:none;border-radius:6px;background:#444;color:#fff;font-size:15px;cursor:pointer;">Cancel</button>
          <button id="confirmAddMembersBtn" style="padding:8px 18px;border:none;border-radius:6px;background:#2d8cf0;color:#fff;font-size:15px;font-weight:500;cursor:pointer;">Add</button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  document.getElementById('closeGroupMembersModal').onclick = () => modal.remove();
  document.getElementById('addMembersBtn').onclick = () => {
    document.getElementById('addMembersBox').style.display = 'flex';
    document.getElementById('addMembersInput').focus();
  };
  document.getElementById('cancelAddMembersBtn').onclick = () => {
    document.getElementById('addMembersBox').style.display = 'none';
  };
  document.getElementById('confirmAddMembersBtn').onclick = () => {
    const input = document.getElementById('addMembersInput').value.trim();
    if (input) {
      const newMembers = input.split(',').map(s => s.trim()).filter(Boolean);
      vscode.postMessage({ command: 'addMembersToGroup', chatId: activeChatId, newMembers });
      modal.remove();
    }
  };
  // Remove member event
  modal.querySelectorAll('.remove-member-btn').forEach(el => {
    el.onclick = () => {
      const idx = parseInt(el.getAttribute('data-index'));
      vscode.postMessage({ command: 'removeMemberFromGroup', chatId: activeChatId, memberIndex: idx });
      modal.remove();
    };
  });
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

  document.getElementById('attachBtn').onclick = () => {
    // Open file picker for multiple files
    vscode.postMessage({ command: 'pickFile', allowMultiple: true });
  };

  document.getElementById('sendBtn').onclick = () => {
    const msg = document.getElementById('messageInput').value.trim();
    if (msg && activeChatId) {
      if (!state.chats[activeChatId].history) state.chats[activeChatId].history = [];
      state.chats[activeChatId].history.push({ role: 'user', content: msg, attachedFiles: attachedFiles.map(f => ({ name: f.name })) });
      updateChat();
      vscode.postMessage({
        command: 'send',
        chatId: activeChatId,
        userMessage: msg,
        attachedFiles: attachedFiles.map(f => ({ name: f.name, content: f.content }))
      });
      document.getElementById('messageInput').value = '';
      attachedFiles = [];
      renderAttachedFiles();
    }
  };

  document.getElementById('messageInput').addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      document.getElementById('sendBtn').click();
    }
  });
}

function addResizerListeners() {
  const resizer = document.getElementById('resizer');
  const sidebar = document.getElementById('sidebar');
  let isDragging = false;

  resizer.addEventListener('mousedown', function(e) {
    isDragging = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  });

  document.addEventListener('mousemove', function(e) {
    if (!isDragging) return;
    let newWidth = e.clientX;
    if (newWidth < 180) newWidth = 180;
    if (newWidth > window.innerWidth - 320) newWidth = window.innerWidth - 320;
    sidebar.style.width = newWidth + 'px';
  });

  document.addEventListener('mouseup', function() {
    if (isDragging) {
      isDragging = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
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
    // Update state and re-render
    state.chats[msg.chatId] = msg.chat;
    activeChatId = msg.chatId;
    render();
    vscode.postMessage({ command: 'loadHistory', chatId: activeChatId });
  }

  if (msg.command === 'filePicked') {
    // Support multiple files
    if (Array.isArray(msg.files)) {
      attachedFiles = attachedFiles.concat(msg.files);
    } else if (msg.file) {
      attachedFiles.push(msg.file);
    }
    renderAttachedFiles();
  }
});

function updateChat() {
  const historyDiv = document.getElementById('chatHistory');
  if (!historyDiv) return;
  const messages = state.chats[activeChatId]?.history || [];
  const chat = state.chats[activeChatId];
  if (chat && chat.type === 'group') {
    historyDiv.innerHTML = messages.map(m => {
      if (m.role === 'info') {
        return `<div style='text-align:center;color:#aaa;font-size:13px;margin:8px 0 4px 0;'>${m.content}</div>`;
      }
      let fileLine = '';
      if (m.attachedFiles && m.attachedFiles.length > 0) {
        fileLine = `<div class='attached-file-chat'>${m.attachedFiles.map(f => `<span class='attached-file-green'><span class='codicon codicon-file-media'></span> ${f.name}</span>`).join('')}</div>`;
      }
      if (m.role === 'assistant') {
        // Split assistant content by shape, expecting format: "**name**: message"
        const parts = m.content.split(/\*\*(.*?)\*\*: /g).filter(Boolean);
        let blocks = [];
        for (let i = 0; i < parts.length; i += 2) {
          const name = parts[i];
          const content = parts[i + 1] || '';
          blocks.push(`
            <div style='display:flex;flex-direction:column;align-items:flex-start;width:100%;'>
              <div style='width:70%;'>
                ${fileLine}
                <div class="assistant group-reply">
                  <span class="shape-icon" title="${name}" style="margin-right:8px;vertical-align:middle;display:inline-block;width:28px;height:28px;background:#2d8cf0;border-radius:50%;color:#fff;text-align:center;line-height:28px;font-weight:bold;font-size:15px;">${name ? name[0].toUpperCase() : '?'}</span>
                  <span class="shape-name" style="font-weight:600;color:#2d8cf0;vertical-align:middle;">${name}</span>
                  <div class="shape-msg" style="margin-left:36px;margin-top:2px;">${renderMarkdown(content)}</div>
                </div>
              </div>
            </div>
          `);
        }
        return blocks.join('');
      } else if (m.role === 'user') {
        return `<div style='display:flex;flex-direction:column;align-items:flex-end;'><div style='width:70%;'>${fileLine}<div class="user">${m.content}</div></div></div>`;
      }
      return '';
    }).join('');
  } else {
    // Normal chat
    historyDiv.innerHTML = messages.map(m => {
      if (m.role === 'info') {
        return `<div style='text-align:center;color:#aaa;font-size:13px;margin:8px 0 4px 0;'>${m.content}</div>`;
      }
      let fileLine = '';
      if (m.attachedFiles && m.attachedFiles.length > 0) {
        fileLine = `<div class='attached-file-chat'>${m.attachedFiles.map(f => `<span class='attached-file-green'><span class='codicon codicon-file-media'></span> ${f.name}</span>`).join('')}</div>`;
      }
      if (m.role === 'user') {
        return `<div style='display:flex;flex-direction:column;align-items:flex-end;'><div style='width:70%;'>${fileLine}<div class="user">${m.content}</div></div></div>`;
      } else {
        return `<div style='display:flex;flex-direction:column;align-items:flex-start;'><div style='width:70%;'>${fileLine}<div class="assistant">${renderMarkdown(m.content)}</div></div></div>`;
      }
    }).join('');
  }
  historyDiv.scrollTop = historyDiv.scrollHeight;
}

function renderMarkdown(text) {
  if (!text) return '';
  // Handle triple backtick code blocks
  text = text.replace(/```([\s\S]*?)```/g, (match, code) => {
    // Use <pre><code> and preserve all whitespace (including leading spaces)
    return `<pre class='chat-code'><code>${escapeHtml(code)}</code></pre>`;
  });
  // Inline code
  text = text.replace(/`([^`]+)`/g, (match, code) => {
    return `<code class='chat-inline-code'>${escapeHtml(code)}</code>`;
  });
  // Basic newlines to <br>
  text = text.replace(/\n/g, '<br>');
  return text;
}

function escapeHtml(str) {
  return str.replace(/[&<>"']/g, function(tag) {
    const chars = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    };
    return chars[tag] || tag;
  });
}

render();
