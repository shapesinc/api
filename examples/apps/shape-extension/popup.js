class SettingsManager {
    constructor() {
        this.form = document.getElementById('settingsForm');
        this.status = document.getElementById('status');
        this.init();
    }

    async init() {
        await this.loadSettings();
        this.bindEvents();
    }

    async loadSettings() {
        const settings = await new Promise(resolve => {
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

        document.getElementById('enabledToggle').classList.toggle('active', settings.enabled);
        document.getElementById('apiKey').value = settings.apiKey;
        document.getElementById('shapeUsername').value = settings.shapeUsername;
        document.getElementById('personality').value = settings.personality;
        document.getElementById('voiceToggle').classList.toggle('active', settings.voiceEnabled);
        
        const freqSlider = document.getElementById('commentFrequency');
        freqSlider.value = settings.commentFrequency / 1000;
        this.updateFrequencyDisplay(settings.commentFrequency / 1000);
        
        const idleSlider = document.getElementById('idleThreshold');
        idleSlider.value = settings.idleThreshold / 1000;
        this.updateIdleDisplay(settings.idleThreshold / 1000);
    }

    bindEvents() {
        document.getElementById('enabledToggle').addEventListener('click', (e) => {
            e.target.classList.toggle('active');
        });

        document.getElementById('voiceToggle').addEventListener('click', (e) => {
            e.target.classList.toggle('active');
        });
        document.getElementById('commentFrequency').addEventListener('input', (e) => {
            this.updateFrequencyDisplay(e.target.value);
        });

        document.getElementById('idleThreshold').addEventListener('input', (e) => {
            this.updateIdleDisplay(e.target.value);
        });

        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveSettings();
        });

        document.getElementById('testBtn').addEventListener('click', () => {
            this.testShape();
        });
    }

    updateFrequencyDisplay(seconds) {
        const display = document.getElementById('frequencyValue');
        if (seconds < 60) {
            display.textContent = `Every ${seconds} seconds`;
        } else {
            const minutes = Math.round(seconds / 60);
            display.textContent = `Every ${minutes} minute${minutes > 1 ? 's' : ''}`;
        }
    }

    updateIdleDisplay(seconds) {
        const display = document.getElementById('idleValue');
        if (seconds < 60) {
            display.textContent = `After ${seconds} seconds`;
        } else {
            const minutes = Math.round(seconds / 60);
            display.textContent = `After ${minutes} minute${minutes > 1 ? 's' : ''}`;
        }
    }

    async saveSettings() {
        const settings = {
            enabled: document.getElementById('enabledToggle').classList.contains('active'),
            apiKey: document.getElementById('apiKey').value.trim(),
            shapeUsername: document.getElementById('shapeUsername').value.trim() || 'shaperobot',
            personality: document.getElementById('personality').value,
            voiceEnabled: document.getElementById('voiceToggle').classList.contains('active'),
            commentFrequency: parseInt(document.getElementById('commentFrequency').value) * 1000,
            idleThreshold: parseInt(document.getElementById('idleThreshold').value) * 1000
        };

        try {
            await new Promise((resolve, reject) => {
                chrome.storage.sync.set(settings, () => {
                    if (chrome.runtime.lastError) {
                        reject(chrome.runtime.lastError);
                    } else {
                        resolve();
                    }
                });
            });

            this.showStatus('Settings saved successfully!', 'success');
            
            this.reloadContentScripts();
            
        } catch (error) {
            this.showStatus('Error saving settings: ' + error.message, 'error');
        }
    }

    async testShape() {
        const apiKey = document.getElementById('apiKey').value.trim();
        const shapeUsername = document.getElementById('shapeUsername').value.trim() || 'shaperobot';

        if (!apiKey) {
            this.showStatus('Please enter an API key first', 'error');
            return;
        }

        try {
            const response = await fetch('https://api.shapes.inc/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                    'X-User-Id': 'settings-test',
                    'X-Channel-Id': 'settings-test'
                },
                body: JSON.stringify({
                    model: `shapesinc/${shapeUsername}`,
                    messages: [{
                        role: 'user',
                        content: 'Say hello and introduce yourself briefly!'
                    }]
                })
            });

            if (!response.ok) {
                const errorData = await response.text();
                throw new Error(`API Error: ${response.status} ${response.statusText}. Response: ${errorData}`);
            }

            const data = await response.json();
            const reply = data.choices?.[0]?.message?.content;

            if (reply) {
                this.showStatus(`✅ Shape responded: "${reply}"`, 'success');
            } else {
                this.showStatus('❌ No response from Shape or unexpected format', 'error');
            }

        } catch (error) {
            this.showStatus('❌ Test failed: ' + error.message, 'error');
            console.error("Test Shape Error:", error);
        }
    }

    showStatus(message, type) {
        this.status.textContent = message;
        this.status.className = `status ${type}`;
        this.status.style.display = 'block';

        setTimeout(() => {
            this.status.style.display = 'none';
        }, 5000);
    }

    async reloadContentScripts() {
        try {
            const tabs = await chrome.tabs.query({url: ["http://*/*", "https://*/*"]}); // Query only relevant tabs
            for (const tab of tabs) {
                if (tab.id) { 
                    chrome.tabs.sendMessage(tab.id, { action: 'reload' }).catch((error) => {
                        console.log(`Could not send reload to tab ${tab.id}: ${error.message}`);
                    });
                }
            }
        } catch (error) {
            console.error('Error querying tabs for reloading content scripts:', error);
        }
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new SettingsManager();
    });
} else {
    new SettingsManager();
}
