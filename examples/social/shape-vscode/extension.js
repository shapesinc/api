const vscode = require('vscode');
const path   = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

/* ───────── EXTENSION BACKEND ───────── */
function activate(context) {
  context.subscriptions.push(
    vscode.commands.registerCommand('shapeschat.openChat', () => {
      const panel = vscode.window.createWebviewPanel(
        'shapesChat',
        'Shapes Chat',
        vscode.ViewColumn.Beside,
        { enableScripts: true }
      );

      /* all chat histories, keyed by shapeId */
      const chatHistories = {};
      let currentShapeId  = null;

      panel.webview.html = getWebviewContent();

      panel.webview.onDidReceiveMessage(
        async (msg) => {
          /* ---------- send message ---------- */
          if (msg.command === 'send') {
            const shapeId     = msg.shapeId.trim();
            const userMessage = msg.userMessage.trim();
            if (!shapeId || !userMessage) return;

            currentShapeId = shapeId;
            if (!chatHistories[shapeId]) chatHistories[shapeId] = [];
            chatHistories[shapeId].push({ role:'user', content:userMessage });

            try {
              const res  = await fetch('https://api.shapes.inc/v1/chat/completions', {
                method : 'POST',
                headers: {
                  'Authorization': `Bearer ${process.env.SHAPESINC_API_KEY}`,
                  'Content-Type' : 'application/json'
                },
                body: JSON.stringify({
                  model   : `shapesinc/${shapeId}`,
                  messages: chatHistories[shapeId]
                })
              });

              const json = await res.json();
              const botReply = json?.choices?.[0]?.message?.content
                             ?? '⚠️ Unexpected API response.';
              chatHistories[shapeId].push({ role:'assistant', content:botReply });

              panel.webview.postMessage({ command:'response', text:botReply });

            } catch (err) {
              panel.webview.postMessage({ command:'response',
                                          text:`🚫 Error: ${err.message||'Something went wrong'}`});
            }
          }

          /* ---------- load history on tab switch ---------- */
          if (msg.command === 'loadHistory') {
            const shapeId = msg.shapeId.trim();
            currentShapeId = shapeId;
            if (!chatHistories[shapeId]) chatHistories[shapeId] = [];
            panel.webview.postMessage({
              command:'loadHistory',
              shapeId,
              history: chatHistories[shapeId]
            });
          }

          /* ---------- clear chat ---------- */
          if (msg.command === 'clearChat') {
            const shapeId = msg.shapeId.trim();
            chatHistories[shapeId] = [];                // wipe backend history
            panel.webview.postMessage({ command:'cleared', shapeId });
          }
        },
        undefined,
        context.subscriptions
      );
    })
  );
}

/* ───────── WEBVIEW HTML ───────── */
function getWebviewContent(){
return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>
 body{font-family:Segoe UI,Tahoma,Geneva,Verdana,sans-serif;margin:0;height:100vh;display:flex;flex-direction:column;background:#1e1e1e;color:#ddd}
 #tab-bar{display:flex;align-items:center;background:#2d2d30;padding:4px 8px;gap:4px;border-bottom:1px solid #444}
 .tab{padding:6px 12px;background:#3c3c3c;border-radius:6px;cursor:pointer;color:#ddd}
 .tab.active{background:#0a84ff;color:#fff}
 #add-tab{background:#444;font-weight:bold}
 #info-message{font-size:12px;color:#999;padding:4px 8px}
 #chat-container{flex:1;overflow-y:auto;padding:10px;background:#252526;display:flex;flex-direction:column}
 .message{max-width:70%;margin:5px 0;padding:12px 16px;border-radius:15px;white-space:pre-wrap;word-wrap:break-word;font-size:14px}
 .user{align-self:flex-end;background:#0a84ff;color:#fff;border-bottom-right-radius:0}
 .bot {align-self:flex-start;background:#3c3c3c;color:#ddd;border-bottom-left-radius:0}
 #input-area{padding:10px;border-top:1px solid #333;background:#1e1e1e;display:flex;flex-direction:column;gap:8px}
 #userMessage{width:100%;padding:8px;font-size:14px;border:none;border-radius:6px;background:#333;color:#ddd;height:60px;resize:none}
 .btn{padding:10px;border:none;border-radius:6px;background:#0a84ff;color:#fff;font-weight:600;cursor:pointer}
 .btn:hover{background:#006fcc}
 /* modal */
 #modal{position:fixed;inset:0;background:rgba(0,0,0,.7);display:none;justify-content:center;align-items:center;z-index:10}
 #modalContent{background:#2d2d30;padding:20px;border-radius:10px;text-align:center}
 #modalContent input{width:200px;padding:8px;border-radius:6px;border:none;margin-top:10px;font-size:14px}
 #modalContent button{margin-top:10px;width:100px}
</style>
</head>
<body>
 <div id="tab-bar"><div id="add-tab" class="tab">+</div></div>
 <div id="info-message">To change shape, switch tabs.</div>
 <div id="chat-container"></div>

 <div id="input-area">
   <textarea id="userMessage" placeholder="Type your message..."></textarea>


    <div style="display:flex;justify-content:space-between;align-items:center">
        <button class="btn" style="background:#e75454" onclick="clearChat()">Clear Chat</button>
        <button class="btn" onclick="sendMessage()">Send</button>
    </div>



 </div>

 <!-- modal -->
 <div id="modal">
  <div id="modalContent">
    <div style="margin-bottom:8px">Enter shape username:</div>
    <input id="shapeInput" placeholder="e.g., sassydev">
    <br><button class="btn" onclick="confirmShape()">OK</button>
  </div>
 </div>

<script>
const vscode = acquireVsCodeApi();
let shapeTabs={},currentShapeId=null,pendingTab=null;

function addMessage(text,isUser){
  const chat=document.getElementById('chat-container');
  const m=document.createElement('div');
  m.className='message '+(isUser?'user':'bot');
  m.innerText=text;
  chat.appendChild(m);
  chat.scrollTop=chat.scrollHeight;
}
function renderHistory(hist){const c=document.getElementById('chat-container');c.innerHTML='';hist.forEach(m=>addMessage(m.content,m.role==='user'));}

function sendMessage(){
  const txt=document.getElementById('userMessage').value.trim();
  if(!currentShapeId||!txt) return;
  addMessage(txt,true);
  document.getElementById('userMessage').value='';
  vscode.postMessage({command:'send',shapeId:currentShapeId,userMessage:txt});
}

function clearChat(){
  if(!currentShapeId) return;
  document.getElementById('chat-container').innerHTML='';
  vscode.postMessage({command:'clearChat',shapeId:currentShapeId});
}

window.addEventListener('message',e=>{
  const msg=e.data;
  if(msg.command==='response') addMessage(msg.text,false);
  else if(msg.command==='loadHistory'&&msg.shapeId===currentShapeId) renderHistory(msg.history);
  else if(msg.command==='cleared'&&msg.shapeId===currentShapeId) renderHistory([]);
});

function switchToShape(id){
  currentShapeId=id;
  document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
  shapeTabs[id].classList.add('active');
  vscode.postMessage({command:'loadHistory',shapeId:id});
}
function createNewTab(){
  pendingTab=document.createElement('div');
  pendingTab.className='tab';pendingTab.textContent='...';
  document.getElementById('tab-bar').insertBefore(pendingTab,document.getElementById('add-tab'));
  document.getElementById('modal').style.display='flex';
  document.getElementById('shapeInput').value='';
}
function confirmShape(){
  const id=document.getElementById('shapeInput').value.trim();
  if(!id||shapeTabs[id]){document.getElementById('modal').style.display='none';pendingTab.remove();pendingTab=null;return;}
  pendingTab.textContent=id;pendingTab.onclick=()=>switchToShape(id);
  shapeTabs[id]=pendingTab;pendingTab=null;
  document.getElementById('modal').style.display='none';
  switchToShape(id);
}
document.getElementById('add-tab').onclick=createNewTab;
</script>
</body>
</html>`;
}

function deactivate(){}

module.exports={activate,deactivate};
