class ShapeSidekick {
    constructor() {
        this.settings = null;
        this.overlay = null;
        this.isVisible = false;
        this.lastActivity = Date.now();
        this.pageContext = '';
        this.mood = 'neutral';
        this.commentTimer = null;
        this.idleTimer = null;
        this.mutationObserver = null;
        this.isTyping = false;
        this.isDraggingPostDrag = false;
        this.currentTypingInterval = null;
        this.isConversationActive = false;

        this.isDragging = false;
        this.currentX = 0;
        this.currentY = 0;
        this.initialX = 0;
        this.initialY = 0;

        this.boundTrackActivityListener = this._trackActivityListener.bind(this);
        this.boundOnPageChange = this.onPageChange.bind(this);
        this.boundDragStart = this.dragStart.bind(this);
        this.boundDrag = this.drag.bind(this);
        this.boundDragEnd = this.dragEnd.bind(this);

        this.tools = [
            {
                type: "function",
                function: {
                    name: "open_url",
                    description: "Open a URL in a new tab",
                    parameters: {
                        type: "object",
                        properties: {
                            url: {
                                type: "string",
                                description: "The URL to open"
                            },
                            description: {
                                type: "string",
                                description: "Optional description of why opening this URL"
                            }
                        },
                        required: ["url"]
                    }
                }
            },
            {
                type: "function",
                function: {
                    name: "search_web",
                    description: "Perform a web search",
                    parameters: {
                        type: "object",
                        properties: {
                            query: {
                                type: "string",
                                description: "The search query"
                            },
                            engine: {
                                type: "string",
                                enum: ["google", "bing", "duckduckgo"],
                                description: "Search engine to use (default: google)"
                            }
                        },
                        required: ["query"]
                    }
                }
            },
            {
                type: "function",
                function: {
                    name: "get_page_info",
                    description: "Get information about the current page",
                    parameters: {
                        type: "object",
                        properties: {
                            include_content: {
                                type: "boolean",
                                description: "Whether to include page content (default: false)"
                            }
                        }
                    }
                }
            },
            {
                type: "function",
                function: {
                    name: "scroll_page",
                    description: "Scroll the current page",
                    parameters: {
                        type: "object",
                        properties: {
                            direction: {
                                type: "string",
                                enum: ["up", "down", "top", "bottom"],
                                description: "Direction to scroll"
                            },
                            amount: {
                                type: "number",
                                description: "Amount to scroll in pixels (for up/down)"
                            }
                        },
                        required: ["direction"]
                    }
                }
            }
        ];
    }

    async init() {
        this.cleanup();
        this.settings = await this.getSettings();
        if (!this.settings.enabled || !this.settings.apiKey || !this.settings.shapeUsername) {
            console.log('Shape Sidekick: Disabled or missing API key/username.');
            this.removeGlobalListeners();
            return;
        }
        this.isVisible = true;
        await this.createOverlay();
        this.setupEventListeners();
        this.startCommentary();
        this.startIdleTracking();
    }

    cleanup() {
        console.log("Shape Sidekick: Cleaning up...");
        if (this.commentTimer) clearInterval(this.commentTimer);
        this.commentTimer = null;
        if (this.idleTimer) clearInterval(this.idleTimer);
        this.idleTimer = null;
        if (this.currentTypingInterval) {
            clearInterval(this.currentTypingInterval);
            this.currentTypingInterval = null;
        }

        if (this.overlay) {
            const avatarElement = this.overlay.querySelector('.shape-avatar');
            if (avatarElement) {
                avatarElement.removeEventListener('mousedown', this.boundDragStart);
                avatarElement.removeEventListener('touchstart', this.boundDragStart, { passive: false });
            }
            if (this.overlay.parentElement) {
                this.overlay.remove();
            }
        }
        this.overlay = null;

        document.removeEventListener('mousemove', this.boundDrag);
        document.removeEventListener('mouseup', this.boundDragEnd);
        document.removeEventListener('touchmove', this.boundDrag, { passive: false });
        document.removeEventListener('touchend', this.boundDragEnd);

        this.removeGlobalListeners();
        if (this.mutationObserver) {
            this.mutationObserver.disconnect();
            this.mutationObserver = null;
        }
        this.isConversationActive = false;
    }

    removeGlobalListeners() {
        ['mousedown', 'keydown', 'scroll', 'click'].forEach(event => {
            document.removeEventListener(event, this.boundTrackActivityListener);
        });
    }

    _trackActivityListener() {
        this.lastActivity = Date.now();
        this.resetIdleTimer();
    }

    async getSettings() {
        return new Promise((resolve) => {
            chrome.storage.sync.get({
                enabled: true,
                apiKey: '',
                shapeUsername: 'shaperobot',
                personality: 'snarky',
                voiceEnabled: false,
                commentFrequency: 30000,
                idleThreshold: 300000
            }, resolve);
        });
    }

    async createOverlay() {
        this.overlay = document.createElement('div');
        this.overlay.id = 'shape-sidekick-overlay';
        this.overlay.style.display = this.isVisible ? 'block' : 'none';

        await this.loadPosition();

        this.overlay.innerHTML = `
            <div class="shape-container">
              <div class="controls">
                <button class="settings-btn" title="Settings">⚙️</button>
                <button class="toggle-btn" title="Toggle Shape">👁️</button>
              </div>
              <div class="shape-avatar ${this.mood}">
                <div class="shape-face">
                  <div class="eyes">
                    <div class="eye left"></div>
                    <div class="eye right"></div>
                  </div>
                  <div class="mouth"></div>
                </div>
              </div>
              <div class="speech-bubble hidden">
                <div class="bubble-controls">
                    <button class="stop-generating-btn hidden" title="Stop generating">⏹️</button>
                    <button class="edit-btn hidden" title="Edit text">✏️</button>
                    <button class="copy-btn hidden" title="Copy text">📋</button>
                    <button class="close-btn" title="Close conversation">×</button>
                </div>
                <div class="bubble-content"></div>
                <div class="reply-area hidden">
                  <input type="text" class="reply-input" placeholder="Your reply...">
                  <button class="mic-button">🎤</button>
                  <button class="reply-button">Send</button>
                </div>
                <div class="bubble-tail"></div>
              </div>
            </div>
        `;
        document.body.appendChild(this.overlay);
        this.bindOverlayEvents();
    }

    bindOverlayEvents() {
        const toggleBtn = this.overlay.querySelector('.toggle-btn');
        const settingsBtn = this.overlay.querySelector('.settings-btn');
        const avatar = this.overlay.querySelector('.shape-avatar');
        const replyButton = this.overlay.querySelector('.reply-button');
        const stopGeneratingBtn = this.overlay.querySelector('.stop-generating-btn');
        const editBtn = this.overlay.querySelector('.edit-btn');
        const copyBtn = this.overlay.querySelector('.copy-btn');
        const closeBtn = this.overlay.querySelector('.close-btn');
        const micButton = this.overlay.querySelector('.mic-button');

        toggleBtn.addEventListener('click', () => this.toggleVisibility());
        settingsBtn.addEventListener('click', () => this.openSettings());
        
        avatar.addEventListener('click', (e) => {
            if (this.isDraggingPostDrag) {
                this.isDraggingPostDrag = false;
                return;
            }
            this.getComment();
        });

        if (replyButton) {
            replyButton.addEventListener('click', () => this.handleUserReply());
        }
        const replyInput = this.overlay.querySelector('.reply-input');
        if (replyInput) {
            replyInput.addEventListener('keypress', (event) => {
                if (event.key === 'Enter') {
                    this.handleUserReply();
                }
            });
        }

        if (stopGeneratingBtn) {
            stopGeneratingBtn.addEventListener('click', () => this.stopGeneratingResponse());
        }

        if (editBtn) {
            editBtn.addEventListener('click', () => this.handleEditComment());
        }

        if (copyBtn) {
            copyBtn.addEventListener('click', () => this.handleCopyComment());
        }

        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                const bubble = this.overlay.querySelector('.speech-bubble');
                if (bubble) bubble.classList.add('hidden');
                const content = bubble.querySelector('.bubble-content');
                if (content) content.innerHTML = '';
                this.isConversationActive = false;
            });
        }

        if (micButton) {
            micButton.addEventListener('click', () => this.startVoiceRecognition());
        }

        if (avatar) {
            avatar.addEventListener('mousedown', this.boundDragStart);
            avatar.addEventListener('touchstart', this.boundDragStart, { passive: false });
        }
    }

    startVoiceRecognition() {
        if (!this.overlay || !this.isVisible) return;
        const replyInput = this.overlay.querySelector('.reply-input');
        if (!replyInput) return;

        if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            const recognition = new SpeechRecognition();
            recognition.lang = 'en-US';
            recognition.interimResults = false;
            recognition.maxAlternatives = 1;

            recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                replyInput.value = transcript;
            };

            recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                this.showComment('Voice recognition failed. Try shouting louder next time.', false);
            };

            recognition.onend = () => {
                this.stopAnimation();
            };

            this.animateListening();
            recognition.start();
        } else {
            this.showComment('Your browser doesn’t support voice recognition. Time to upgrade!', false);
        }
    }

    handleEditComment() {
        if (!this.overlay) return;
        const bubbleContent = this.overlay.querySelector('.speech-bubble .bubble-content');
        const lastBotMessage = bubbleContent ? bubbleContent.querySelector('.bot-message:last-child') : null;

        if (lastBotMessage && lastBotMessage.dataset.message) {
            const originalText = lastBotMessage.dataset.message;
            const replyArea = this.overlay.querySelector('.reply-area');
            const replyInput = this.overlay.querySelector('.reply-input');

            if (replyArea && replyInput) {
                replyInput.value = originalText;
                replyArea.classList.remove('hidden');
                replyInput.focus();
                const editBtn = this.overlay.querySelector('.edit-btn');
                const copyBtn = this.overlay.querySelector('.copy-btn');
                if (editBtn) editBtn.classList.add('hidden');
                if (copyBtn) copyBtn.classList.add('hidden');
            }
        }
    }

    handleCopyComment() {
        if (!this.overlay) return;
        const bubbleContent = this.overlay.querySelector('.speech-bubble .bubble-content');
        const lastBotMessage = bubbleContent ? bubbleContent.querySelector('.bot-message:last-child') : null;

        if (lastBotMessage && lastBotMessage.dataset.message) {
            const textToCopy = lastBotMessage.dataset.message;
            navigator.clipboard.writeText(textToCopy)
                .then(() => {
                    console.log('Comment copied to clipboard!');
                    const copyBtn = this.overlay.querySelector('.copy-btn');
                    if (copyBtn) {
                        copyBtn.textContent = 'Copied!';
                        setTimeout(() => {
                            copyBtn.textContent = '📋';
                        }, 1500);
                    }
                })
                .catch(err => {
                    console.error('Failed to copy comment:', err);
                });
        }
    }

    async loadPosition() {
        return new Promise(resolve => {
            chrome.storage.local.get(['shapeSidekickPosition'], (result) => {
                if (result.shapeSidekickPosition && this.overlay) {
                    this.overlay.style.top = result.shapeSidekickPosition.top;
                    this.overlay.style.left = result.shapeSidekickPosition.left;
                    this.overlay.style.right = 'auto';
                    this.overlay.style.bottom = 'auto';
                } else if (this.overlay) {
                    this.overlay.style.top = '20px';
                    this.overlay.style.left = 'auto';
                    this.overlay.style.right = '20px';
                    this.overlay.style.bottom = 'auto';
                }
                resolve();
            });
        });
    }

    async savePosition(top, left) {
        chrome.storage.local.set({ shapeSidekickPosition: { top, left } });
    }

    dragStart(e) {
        if (e.target !== this.overlay.querySelector('.shape-avatar') && e.target.closest('button')) return;

        this.isDragging = true;
        this.overlay.classList.add('dragging');
        const avatarElement = this.overlay.querySelector('.shape-avatar');
        if (avatarElement) avatarElement.style.cursor = 'grabbing';

        if (e.type === 'touchstart') {
            this.initialX = e.touches[0].clientX - this.overlay.offsetLeft;
            this.initialY = e.touches[0].clientY - this.overlay.offsetTop;
        } else {
            this.initialX = e.clientX - this.overlay.offsetLeft;
            this.initialY = e.clientY - this.overlay.offsetTop;
            e.preventDefault();
        }

        document.addEventListener('mousemove', this.boundDrag);
        document.addEventListener('mouseup', this.boundDragEnd);
        document.addEventListener('touchmove', this.boundDrag, { passive: false });
        document.addEventListener('touchend', this.boundDragEnd);
    }

    drag(e) {
        if (this.isDragging) {
            let clientX, clientY;
            if (e.type === 'touchmove') {
                e.preventDefault();
                clientX = e.touches[0].clientX;
                clientY = e.touches[0].clientY;
            } else {
                clientX = e.clientX;
                clientY = e.clientY;
            }

            this.currentX = clientX - this.initialX;
            this.currentY = clientY - this.initialY;

            const overlayWidth = this.overlay.offsetWidth;
            const overlayHeight = this.overlay.offsetHeight;
            const safeOverlayWidth = overlayWidth > 0 ? overlayWidth : 60;
            const safeOverlayHeight = overlayHeight > 0 ? overlayHeight : 60;

            const constrainedX = Math.min(Math.max(0, this.currentX), window.innerWidth - safeOverlayWidth);
            const constrainedY = Math.min(Math.max(0, this.currentY), window.innerHeight - safeOverlayHeight);

            this.overlay.style.left = constrainedX + 'px';
            this.overlay.style.top = constrainedY + 'px';
            this.overlay.style.right = 'auto';
            this.overlay.style.bottom = 'auto';
        }
    }

    dragEnd() {
        if (!this.isDragging) return;
        this.isDragging = false;
        this.overlay.classList.remove('dragging');
        const avatarElement = this.overlay.querySelector('.shape-avatar');
        if (avatarElement) avatarElement.style.cursor = 'grab';

        document.removeEventListener('mousemove', this.boundDrag);
        document.removeEventListener('mouseup', this.boundDragEnd);
        document.removeEventListener('touchmove', this.boundDrag, { passive: false });
        document.removeEventListener('touchend', this.boundDragEnd);

        this.savePosition(this.overlay.style.top, this.overlay.style.left);
        this.isDraggingPostDrag = true;
        setTimeout(() => this.isDraggingPostDrag = false, 50);
    }

    setupEventListeners() {
        ['mousedown', 'keydown', 'scroll', 'click'].forEach(event => {
            document.addEventListener(event, this.boundTrackActivityListener, { passive: true });
        });
        let lastUrl = location.href;
        this.mutationObserver = new MutationObserver(() => {
            const url = location.href;
            if (url !== lastUrl) {
                lastUrl = url;
                this.boundOnPageChange();
            }
        });
        this.mutationObserver.observe(document, { subtree: true, childList: true });
    }

    startCommentary() {
        if (this.commentTimer) clearInterval(this.commentTimer);
        this.commentTimer = setInterval(() => {
            if (this.isVisible && !this.isConversationActive && Math.random() < 0.3) {
                this.getComment();
            }
        }, this.settings.commentFrequency);
    }

    startIdleTracking() {
        if (this.idleTimer) clearInterval(this.idleTimer);
        this.lastActivity = Date.now();
        this.idleTimer = setInterval(() => {
            if (!this.isVisible) return;
            const idleTime = Date.now() - this.lastActivity;
            if (idleTime > this.settings.idleThreshold) {
                this.handleIdle();
            }
        }, 60000);
    }

    resetIdleTimer() {
        this.lastActivity = Date.now();
        if (this.mood === 'sleeping') {
            this.setMood('neutral');
        }
    }

    handleIdle() {
        if (this.mood === 'sleeping' || !this.isVisible) return;
        this.setMood('sleeping');
        const idleComments = [
            "Still there? Your productivity is concerning me...",
            "I can hear you breathing. That's not creepy at all.",
            "Maybe go outside? Touch some grass? Revolutionary concept.",
            "The tab is open but nobody's home...",
            "Are we having a staring contest with the screen?"
        ];
        this.showComment(this.getRandomComment(idleComments));
    }

    async onPageChange() {
        if (!this.settings.enabled || !this.isVisible) return;
        await this.updatePageContext();
        setTimeout(() => {
            if (!this.isConversationActive) this.getComment();
        }, 2000);
    }

    async updatePageContext() {
        const url = window.location.href;
        const title = document.title;
        const domain = window.location.hostname;
        const headings = Array.from(document.querySelectorAll('h1, h2, h3'))
            .slice(0, 3)
            .map(h => h.textContent.trim())
            .filter(text => text.length > 0);
        
        let bodyText = "";
        try {
            bodyText = document.body.innerText.slice(0, 1500);
        } catch (e) {
            bodyText = "Page content not fully accessible.";
        }

        const hasShoppingCart = document.querySelector('[class*="cart"], [id*="cart"]') !== null;
        const hasLogin = document.querySelector('[class*="login"], [id*="login"], [class*="signin"], [id*="signin"]') !== null;
        const hasSearch = document.querySelector('input[type="search"], [class*="search"]') !== null;
        this.pageContext = {
            url, title, domain, headings, bodyText,
            hasShoppingCart, hasLogin, hasSearch,
            timestamp: Date.now()
        };
    }

    parseMarkdown(text) {
        const escapeHtml = (str) => {
            return str
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');
        };

        const allowedTags = ['strong', 'em', 'a', 'code', 'pre', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote'];
        const allowedAttributes = { a: ['href'] };

        let lines = text.split('\n');
        let output = [];
        let inList = false;
        let listType = '';
        let listItems = [];

        const flushList = () => {
            if (listItems.length > 0) {
                output.push(`<${listType}>${listItems.join('')}</${listType}>`);
                listItems = [];
                inList = false;
                listType = '';
            }
        };

        for (let line of lines) {
            let parsedLine = escapeHtml(line);

            if (/^#{1,6}\s/.test(line)) {
                flushList();
                const level = line.match(/^#+/)[0].length;
                const content = line.replace(/^#+\s*/, '').trim();
                parsedLine = `<h${level}>${this.parseInlineMarkdown(content)}</h${level}>`;
            }
            else if (line.startsWith('>')) {
                flushList();
                const content = line.replace(/^>\s*/, '').trim();
                parsedLine = `<blockquote>${this.parseInlineMarkdown(content)}</blockquote>`;
            }
            else if (line.startsWith('```')) {
                flushList();
                let codeLines = [];
                let nextLineIdx = lines.indexOf(line) + 1;
                while (nextLineIdx < lines.length && !lines[nextLineIdx].startsWith('```')) {
                    codeLines.push(escapeHtml(lines[nextLineIdx]));
                    lines[nextLineIdx] = '';
                    nextLineIdx++;
                }
                if (nextLineIdx < lines.length) lines[nextLineIdx] = '';
                parsedLine = `<pre><code>${codeLines.join('\n')}</code></pre>`;
            }
            else if (line.match(/^-+\s/)) {
                const content = line.replace(/^-+\s*/, '').trim();
                if (!inList || listType !== 'ul') {
                    flushList();
                    inList = true;
                    listType = 'ul';
                }
                listItems.push(`<li>${this.parseInlineMarkdown(content)}</li>`);
                parsedLine = '';
            }
            else if (line.match(/^\d+\.\s/)) {
                const content = line.replace(/^\d+\.\s*/, '').trim();
                if (!inList || listType !== 'ol') {
                    flushList();
                    inList = true;
                    listType = 'ol';
                }
                listItems.push(`<li>${this.parseInlineMarkdown(content)}</li>`);
                parsedLine = '';
            }
            else if (line.trim()) {
                flushList();
                parsedLine = `<p>${this.parseInlineMarkdown(parsedLine)}</p>`;
            } else {
                flushList();
                parsedLine = '';
            }

            if (parsedLine) output.push(parsedLine);
        }

        flushList();

        let html = output.join('\n');

        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        const sanitizeNode = (node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
                const tag = node.tagName.toLowerCase();
                if (!allowedTags.includes(tag)) {
                    node.replaceWith(...Array.from(node.childNodes));
                    return;
                }
                for (let attr of Array.from(node.attributes)) {
                    if (!allowedAttributes[tag]?.includes(attr.name)) {
                        node.removeAttribute(attr.name);
                    }
                }
            }
            for (let child of Array.from(node.childNodes)) {
                sanitizeNode(child);
            }
        };
        sanitizeNode(tempDiv);
        return tempDiv.innerHTML;
    }

    parseInlineMarkdown(text) {
        let output = text;
        output = output.replace(/(?:\*\*|__)(.*?)(?:\*\*|__)/g, '<strong>$1</strong>');
        output = output.replace(/(?:\*|_)(.*?)(?:\*|_)/g, '<em>$1</em>');
        output = output.replace(/`([^`]+)`/g, '<code>$1</code>');
        output = output.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
        return output;
    }

    async getComment() {
        if (!this.settings.enabled || !this.settings.apiKey || !this.overlay || this.isTyping || !this.isVisible) return;
        await this.updatePageContext();
        
        try {
            this.animateThinking();
            const response = await this.makeShapeAPICall(this.buildContextPrompt());
            this.stopAnimation();
            
            if (response && response.content) {
                this.showComment(response.content, true);
                this.updateMoodFromComment(response.content);
                if (this.settings.voiceEnabled) {
                    this.speakComment(response.content);
                }
            }
        } catch (error) {
            if (error.name !== 'AbortError') {
                this.showComment("My connection is acting up. Or maybe it's just you... 🙄");
            }
            this.stopAnimation();
        }
    }

    async handleUserReply() {
        if (!this.isVisible) return;
        const replyInput = this.overlay.querySelector('.reply-input');
        const replyText = replyInput ? replyInput.value.trim() : '';
        if (!replyText) return;

        const bubble = this.overlay.querySelector('.speech-bubble');
        const content = bubble.querySelector('.bubble-content');
        const replyArea = bubble.querySelector('.reply-area');

        this.isConversationActive = true;
        const userMessageDiv = document.createElement('div');
        userMessageDiv.className = 'user-message';
        userMessageDiv.innerHTML = this.parseMarkdown(replyText);
        content.appendChild(userMessageDiv);
        if (content.scrollHeight > content.clientHeight) {
            content.scrollTop = content.scrollHeight;
        }

        if (replyInput) replyInput.value = '';
        if (replyArea) replyArea.classList.add('hidden');

        const thinkingDiv = document.createElement('div');
        thinkingDiv.className = 'bot-message thinking';
        thinkingDiv.textContent = 'Thinking...';
        content.appendChild(thinkingDiv);
        if (content.scrollHeight > content.clientHeight) {
            content.scrollTop = content.scrollHeight;
        }

        try {
            this.animateListening();
            
            const messages = [
                { role: 'user', content: this.buildContextPrompt() }
            ];
            
            const botMessages = content.querySelectorAll('.bot-message:not(.thinking)');
            const userMessages = content.querySelectorAll('.user-message');
            
            const allMessages = Array.from(content.children).filter(el => 
                el.classList.contains('bot-message') && !el.classList.contains('thinking') ||
                el.classList.contains('user-message')
            ).slice(-4); 
            
            allMessages.forEach(msg => {
                if (msg.classList.contains('bot-message') && msg.dataset.message) {
                    messages.push({ role: 'assistant', content: msg.dataset.message });
                } else if (msg.classList.contains('user-message')) {
                    messages.push({ role: 'user', content: msg.textContent });
                }
            });
            
            messages.push({ role: 'user', content: replyText });

            const response = await this.makeShapeAPICall(messages);
            this.stopAnimation();
            
            if (thinkingDiv.parentNode === content) {
                content.removeChild(thinkingDiv);
            }
            
            if (response && response.content) {
                this.showComment(response.content, true);
            } else {
                const errorDiv = document.createElement('div');
                errorDiv.className = 'bot-message';
                errorDiv.textContent = 'Hmm, didn\'t get a response.';
                content.appendChild(errorDiv);
            }
        } catch (error) {
            if (thinkingDiv.parentNode === content) {
                content.removeChild(thinkingDiv);
            }
            const errorDiv = document.createElement('div');
            errorDiv.className = 'bot-message';
            errorDiv.textContent = 'Something went wrong with my reply system.';
            content.appendChild(errorDiv);
            this.stopAnimation();
        }
    }

    async makeShapeAPICall(messages) {
        const requestBody = {
            model: `shapesinc/${this.settings.shapeUsername}`,
            messages: Array.isArray(messages) ? messages : [{ role: 'user', content: messages }],
            tools: this.tools,
            tool_choice: "auto" 
        };

        const response = await fetch('https://api.shapes.inc/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.settings.apiKey}`,
                'Content-Type': 'application/json',
                'X-User-Id': 'extension-user',
                'X-Channel-Id': `browser-${this.pageContext.domain}`
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API request failed: ${response.status} ${response.statusText}. Body: ${errorText}`);
        }

        const data = await response.json();
        const choice = data.choices?.[0];
        
        if (!choice) {
            throw new Error('No response choice received');
        }

        if (choice.message.tool_calls && choice.message.tool_calls.length > 0) {
            return await this.handleToolCalls(choice.message, requestBody.messages);
        }

        return {
            content: choice.message.content,
            role: choice.message.role
        };
    }

    async handleToolCalls(assistantMessage, conversationMessages) {
        const toolCalls = assistantMessage.tool_calls;
        const toolResults = [];

        conversationMessages.push({
            role: 'assistant',
            tool_calls: toolCalls.map(tc => ({
                id: tc.id,
                type: tc.type,
                function: {
                    name: tc.function.name,
                    arguments: tc.function.arguments
                }
            }))
        });
        for (const toolCall of toolCalls) {
            try {
                const args = JSON.parse(toolCall.function.arguments);
                let result = null;

                switch (toolCall.function.name) {
                    case 'open_url':
                        result = await this.executeTool_openUrl(args);
                        break;
                    case 'search_web':
                        result = await this.executeTool_searchWeb(args);
                        break;
                    case 'get_page_info':
                        result = await this.executeTool_getPageInfo(args);
                        break;
                    case 'scroll_page':
                        result = await this.executeTool_scrollPage(args);
                        break;
                    default:
                        result = { error: `Unknown tool: ${toolCall.function.name}` };
                }

                conversationMessages.push({
                    role: 'tool',
                    content: JSON.stringify(result),
                    tool_call_id: toolCall.id
                });

                toolResults.push(result);
            } catch (error) {
                console.error(`Error executing tool ${toolCall.function.name}:`, error);
                conversationMessages.push({
                    role: 'tool',
                    content: JSON.stringify({ error: error.message }),
                    tool_call_id: toolCall.id
                });
            }
        }
        const followUpResponse = await fetch('https://api.shapes.inc/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.settings.apiKey}`,
                'Content-Type': 'application/json',
                'X-User-Id': 'extension-user',
                'X-Channel-Id': `browser-${this.pageContext.domain}`
            },
            body: JSON.stringify({
                model: `shapesinc/${this.settings.shapeUsername}`,
                messages: conversationMessages,
                tools: this.tools,
                tool_choice: "none" 
            })
        });

        if (!followUpResponse.ok) {
            throw new Error(`Follow-up API request failed: ${followUpResponse.status}`);
        }

        const followUpData = await followUpResponse.json();
        return {
            content: followUpData.choices?.[0]?.message?.content || 'Tool executed successfully.',
            role: 'assistant',
            toolResults: toolResults
        };
    }

    async executeTool_openUrl(args) {
        const { url, description } = args;
        try {
            chrome.runtime.sendMessage({ action: 'openTab', url: url });
            return { 
                success: true, 
                message: `Opened ${url}${description ? ` (${description})` : ''}` 
            };
        } catch (error) {
            return { 
                success: false, 
                error: `Failed to open URL: ${error.message}` 
            };
        }
    }

    async executeTool_searchWeb(args) {
        const { query, engine = 'google' } = args;
        try {
            let searchUrl;
            switch (engine) {
                case 'bing':
                    searchUrl = `https://www.bing.com/search?q=${encodeURIComponent(query)}`;
                    break;
                case 'duckduckgo':
                    searchUrl = `https://duckduckgo.com/?q=${encodeURIComponent(query)}`;
                    break;
                default:
                    searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
            }
            chrome.runtime.sendMessage({ action: 'openTab', url: searchUrl });
            return { 
                success: true, 
                message: `Searching for "${query}" using ${engine}`,
                url: searchUrl
            };
        } catch (error) {
            return { 
                success: false, 
                error: `Failed to perform search: ${error.message}` 
            };
        }
    }

    async executeTool_getPageInfo(args) {
        const { include_content = false } = args;
        try {
            await this.updatePageContext();
            const info = {
                url: this.pageContext.url,
                title: this.pageContext.title,
                domain: this.pageContext.domain,
                headings: this.pageContext.headings,
                hasShoppingCart: this.pageContext.hasShoppingCart,
                hasLogin: this.pageContext.hasLogin,
                hasSearch: this.pageContext.hasSearch
            };
            
            if (include_content) {
                info.content = this.pageContext.bodyText;
            }
            
            return { success: true, pageInfo: info };
        } catch (error) {
            return { 
                success: false, 
                error: `Failed to get page info: ${error.message}` 
            };
        }
    }

    async executeTool_scrollPage(args) {
        const { direction, amount = 500 } = args;
        try {
            switch (direction) {
                case 'up':
                    window.scrollBy(0, -amount);
                    break;
                case 'down':
                    window.scrollBy(0, amount);
                    break;
                case 'top':
                    window.scrollTo(0, 0);
                    break;
                case 'bottom':
                    window.scrollTo(0, document.body.scrollHeight);
                    break;
                default:
                    return { success: false, error: `Invalid scroll direction: ${direction}` };
            }
            return { 
                success: true, 
                message: `Scrolled ${direction}${amount && (direction === 'up' || direction === 'down') ? ` by ${amount}px` : ''}` 
            };
        } catch (error) {
            return { 
                success: false, 
                error: `Failed to scroll: ${error.message}` 
            };
        }
    }

    buildContextPrompt() {
        const context = this.pageContext;
        let prompt = `You are a ${this.settings.personality} AI sidekick watching the user browse. Be witty, brief (1-2 sentences max), and contextually aware. Use Markdown for formatting when appropriate. Current page: ${context.domain} - "${context.title}".`;
        
        if (context.headings && context.headings.length > 0) {
            prompt += ` The main headings are: ${context.headings.join(', ')}.`;
        }
        
        if (context.bodyText) {
            prompt += ` Some of the page content: "${context.bodyText}...".`;
        }
        
        if (context.domain && (context.domain.includes('amazon') || context.domain.includes('shop'))) {
            prompt += ` They're shopping (again). `;
            if (context.hasShoppingCart)
                prompt += `Cart detected - financial damage incoming. `;
        }
        
        prompt += ` You have access to tools to help users:
- open_url: Open web pages
- search_web: Search the internet  
- get_page_info: Get current page details
- scroll_page: Scroll the current page

Make a comment about their browsing behavior. Use tools when it would be helpful or when the user asks for something specific.`;
        
        return prompt;
    }

    showComment(comment, allowReply = false) {
        if (!this.overlay || !this.isVisible) return;
        if (this.isTyping && this.currentTypingInterval) {
            this.stopGeneratingResponse(false);
        }

        const bubble = this.overlay.querySelector('.speech-bubble');
        const content = bubble.querySelector('.bubble-content');
        const replyArea = bubble.querySelector('.reply-area');
        const stopBtn = bubble.querySelector('.stop-generating-btn');
        const editBtn = this.overlay.querySelector('.edit-btn');
        const copyBtn = this.overlay.querySelector('.copy-btn');

        if (!bubble || !content) return;
        
        bubble.classList.remove('hidden');
        this.isConversationActive = true;

        const messageDiv = document.createElement('div');
        messageDiv.className = 'bot-message';
        content.appendChild(messageDiv);

        if (stopBtn) stopBtn.classList.remove('hidden');
        if (editBtn) editBtn.classList.add('hidden');
        if (copyBtn) copyBtn.classList.add('hidden');

        this.isTyping = true;
        let i = 0;

        const cleanHtml = this.parseMarkdown(comment);
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = cleanHtml;
        const textContent = tempDiv.textContent;

        this.currentTypingInterval = setInterval(() => {
            if (i < textContent.length) {
                const partialText = textContent.slice(0, i + 1);
                const partialMarkdown = comment.slice(0, Math.ceil((i + 1) * (comment.length / textContent.length)));
                messageDiv.innerHTML = this.parseMarkdown(partialMarkdown);
                i++;
                if (content.scrollHeight > content.clientHeight) {
                    content.scrollTop = content.scrollHeight;
                }
            } else {
                messageDiv.innerHTML = cleanHtml;
                messageDiv.dataset.message = comment;
                this.stopGeneratingResponse(true, allowReply);
            }
        }, 30);
    }

    stopGeneratingResponse(naturallyFinished = false, allowReplyIfNatural = false) {
        if (this.currentTypingInterval) {
            clearInterval(this.currentTypingInterval);
            this.currentTypingInterval = null;
        }
        this.isTyping = false;

        const bubble = this.overlay.querySelector('.speech-bubble');
        const stopBtn = bubble.querySelector('.stop-generating-btn');
        const editBtn = this.overlay.querySelector('.edit-btn');
        const copyBtn = this.overlay.querySelector('.copy-btn');
        const replyArea = bubble.querySelector('.reply-area');

        if (stopBtn) stopBtn.classList.add('hidden');
        if (editBtn) editBtn.classList.remove('hidden');
        if (copyBtn) copyBtn.classList.remove('hidden');

        if (naturallyFinished && allowReplyIfNatural) {
            if (replyArea) {
                replyArea.classList.remove('hidden');
                const input = replyArea.querySelector('.reply-input');
                if (input) input.focus();
            }
        } else if (!naturallyFinished) {
            if (replyArea) {
                 replyArea.classList.remove('hidden');
                 const input = replyArea.querySelector('.reply-input');
                 if (input) input.focus();
            }
        }
    }

    updateMoodFromComment(comment) {
        if (!this.overlay) return;
        const lowerComment = comment.toLowerCase();
        if (lowerComment.includes('disappointed') || lowerComment.includes('shame') || lowerComment.includes('sigh')) {
            this.setMood('disappointed');
        } else if (lowerComment.includes('impressed') || lowerComment.includes('good') || lowerComment.includes('nice') || lowerComment.includes('awesome')) {
            this.setMood('happy');
        } else if (lowerComment.includes('concerned') || lowerComment.includes('worried') || lowerComment.includes('careful')) {
            this.setMood('concerned');
        } else {
            this.setMood('snarky');
        }
    }

    setMood(mood) {
        this.mood = mood;
        if (!this.overlay || !this.isVisible) return;
        const avatar = this.overlay.querySelector('.shape-avatar');
        if (avatar) avatar.className = `shape-avatar ${mood}`;
    }

    speakComment(comment) {
        if ('speechSynthesis' in window && window.speechSynthesis && this.settings.voiceEnabled && this.isVisible) {
            try {
                speechSynthesis.cancel();
                const utterance = new SpeechSynthesisUtterance(comment);
                utterance.rate = 0.9;
                utterance.pitch = 1.1;
                utterance.volume = 0.7;
                speechSynthesis.speak(utterance);
            } catch (e) {
                console.error("Speech synthesis error:", e);
            }
        }
    }

    toggleVisibility() {
        this.isVisible = !this.isVisible;
        if (this.overlay) {
            this.overlay.style.display = this.isVisible ? 'block' : 'none';
        }
        if (this.isVisible) {
            this.lastActivity = Date.now();
            this.startCommentary();
            this.startIdleTracking();
        } else {
            if (this.commentTimer) clearInterval(this.commentTimer);
            if (this.idleTimer) clearInterval(this.idleTimer);
            if (this.isTyping && this.currentTypingInterval) {
                this.stopGeneratingResponse(false);
            }
            const bubble = this.overlay?.querySelector('.speech-bubble');
            if (bubble) {
                bubble.classList.add('hidden');
                const content = bubble.querySelector('.bubble-content');
                if (content) content.innerHTML = '';
            }
            if ('speechSynthesis' in window && window.speechSynthesis) {
                speechSynthesis.cancel();
            }
            this.isConversationActive = false;
        }
    }

    openSettings() {
        chrome.runtime.sendMessage({ action: 'openSettings' });
    }

    getRandomComment(comments) {
        return comments[Math.floor(Math.random() * comments.length)];
    }

    async handleRuntimeMessage(message, sender, sendResponse) {
        if (message.action === 'reload') {
            await this.init();
            sendResponse({ status: "reloaded", success: true });
            return true;
        }
        if (message.action === 'tabChanged') {
            sendResponse({ status: "tabChangeNoted", success: true });
            return false;
        }
        return false;
    }

    animateThinking() {
        if (!this.overlay || !this.isVisible) return;
        const avatar = this.overlay.querySelector('.shape-avatar');
        if (avatar) avatar.classList.add('thinking');
    }

    animateListening() {
        if (!this.overlay || !this.isVisible) return;
        const avatar = this.overlay.querySelector('.shape-avatar');
        if (avatar) avatar.classList.add('listening');
    }

    stopAnimation() {
        if (!this.overlay) return;
        const avatar = this.overlay.querySelector('.shape-avatar');
        if (avatar) avatar.classList.remove('thinking', 'listening');
    }
}

let globalSidekickInstance = null;

function initializeGlobalSidekick() {
    if (globalSidekickInstance) {
        globalSidekickInstance.cleanup();
    }
    globalSidekickInstance = new ShapeSidekick();
    globalSidekickInstance.init();
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (globalSidekickInstance && typeof globalSidekickInstance.handleRuntimeMessage === 'function') {
        return globalSidekickInstance.handleRuntimeMessage(message, sender, sendResponse);
    }
    if (message.action === 'openTab' && message.url) {
        chrome.tabs.create({ url: message.url });
        return false; 
    }
    return false;
});

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeGlobalSidekick);
} else {
    initializeGlobalSidekick();
}