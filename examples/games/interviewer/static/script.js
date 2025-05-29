document.addEventListener('DOMContentLoaded', () => {
    const setupSection = document.getElementById('setup-section');
    const interviewSection = document.getElementById('interview-section');
    const startInterviewBtn = document.getElementById('start-interview');
    const sendMessageBtn = document.getElementById('send-message');
    const userInput = document.getElementById('user-input');
    const chatMessages = document.getElementById('chat-messages');
    const codeEditorContainer = document.getElementById('code-editor-container');
    const codeInput = document.getElementById('code-input');
    const sendCodeBtn = document.getElementById('send-code');
    const codePanel = document.getElementById('code-panel');
    const toggleCodePanelBtn = document.getElementById('toggle-code-panel');
    const header = document.querySelector('header');
    const micButton = document.getElementById('mic-button');
    const sampleAudioButton = document.getElementById('sample-audio-button');
    const interviewModeSelect = document.getElementById('interview-mode-select');

    let codeMirrorEditor = null;
    let questionCount = 0;
    let interviewFinished = false;
    let isTyping = false;
    let expectingAnswer = true; // Flag to track if we're expecting an answer (vs code submission)
    let currentInterviewMode = 'text'; // Added: 'text' or 'voice'
    let totalScore = 0; // Track the user's total score
    let remainingQuestions = 5; // Start with 5 questions
    let mediaRecorder = null; // For recording audio
    let audioChunks = []; // Store audio chunks during recording
    let isRecording = false; // Track recording state

    // Don't hide mic button in voice mode
    if (micButton) {
        micButton.style.display = 'none'; // Initially hidden, will show in voice mode
    }

    // Removed debug buttons and scripts

    // Modify the interview mode select to only show text and voice options
    // Voice mode now only affects AI responses, not user input
    if (interviewModeSelect) {
        // Keep only text and voice options
        Array.from(interviewModeSelect.options).forEach(option => {
            if (option.value !== 'text' && option.value !== 'voice') {
                option.remove();
            }
        });
        // No need to add description text here as it's now in the HTML
    }

    // Language mode mapping for CodeMirror
    const languageModes = {
        python: 'python',
        c: 'text/x-csrc',
        cpp: 'text/x-c++src',
        javascript: 'javascript'
    };

    const languageNames = {
        python: 'Python',
        c: 'C',
        cpp: 'C++',
        javascript: 'JavaScript'
    };

    const languageSelect = document.getElementById('language-select');
    let selectedLanguage = languageSelect ? languageSelect.value : 'python';

    if (languageSelect) {
        languageSelect.addEventListener('change', (e) => {
            selectedLanguage = e.target.value;
            if (codeMirrorEditor) {
                codeMirrorEditor.setOption('mode', languageModes[selectedLanguage]);
            }
        });
    }

    // Set initial mode
    if (codeMirrorEditor) {
        codeMirrorEditor.setOption('mode', languageModes[selectedLanguage]);
    }

    // Start interview
    startInterviewBtn.addEventListener('click', async () => {
        currentInterviewMode = interviewModeSelect ? interviewModeSelect.value : 'text';
        
        // Reset the score
        totalScore = 0;
        remainingQuestions = 5;
        interviewFinished = false;

        // Show/hide mic button based on mode
        if (micButton) {
            if (currentInterviewMode === 'voice') {
                micButton.style.display = 'flex';
                // Check microphone permission
                try {
                    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                    stream.getTracks().forEach(track => track.stop()); // Stop the stream after permission check
                    console.log("Microphone permission granted");
                } catch (err) {
                    console.error("Microphone permission denied:", err);
                    alert("Microphone permission is required for voice mode. Please allow microphone access and try again.");
                    return;
                }
            } else {
                micButton.style.display = 'none';
            }
        }

        try {
            // Show typing indicator while starting the interview
            addTypingIndicator();
            
            const response = await fetch('/start_interview', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    interview_mode: currentInterviewMode
                })
            });

            if (!response.ok) {
                removeTypingIndicator();
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.error) {
                removeTypingIndicator();
                throw new Error(data.error);
            }

            // Update UI for interview mode
            setupSection.classList.add('hidden');
            header.classList.add('hidden');
            interviewSection.classList.remove('hidden');
            interviewSection.classList.add('active');

            // Reset question counter
            questionCount = 1;
            expectingAnswer = true; // We're now expecting an answer to the first question
            updateQuestionStatus();

            // Initialize code editor and show toggle button
            initializeCodeMirror();
            toggleCodePanelBtn.style.display = 'flex';
            
            // Remove typing indicator and add interviewer's first message
            removeTypingIndicator();
            addMessage(data.choices[0].message.content, 'interviewer');
        } catch (error) {
            removeTypingIndicator();
            console.error('Error starting interview:', error);
            alert('Error starting interview: ' + error.message);
        }
    });

    // Typing indicator functions
    function addTypingIndicator() {
        if (isTyping) return; // Don't add if already typing
        
        isTyping = true;
        const typingDiv = document.createElement('div');
        typingDiv.id = 'typing-indicator';
        typingDiv.classList.add('typing-indicator', 'interviewer-message');
        
        const dotContainer = document.createElement('div');
        dotContainer.classList.add('typing-dots');
        
        for (let i = 0; i < 3; i++) {
            const dot = document.createElement('span');
            dot.classList.add('typing-dot');
            dotContainer.appendChild(dot);
        }
        
        typingDiv.appendChild(dotContainer);
        chatMessages.appendChild(typingDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    function removeTypingIndicator() {
        const typingIndicator = document.getElementById('typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
        isTyping = false;
    }

    // Reset and restart
    function restartInterview() {
        // Clear all messages
        chatMessages.innerHTML = '';
        
        // Reset score
        totalScore = 0;
        remainingQuestions = 5;
        interviewFinished = false;
        
        // Show setup section again
        setupSection.classList.remove('hidden');
        header.classList.remove('hidden');
        interviewSection.classList.remove('active');
        interviewSection.classList.add('hidden');
        
        // Reset state
        questionCount = 0;
        expectingAnswer = true;
        updateQuestionStatus();
        
        // Enable inputs
        userInput.disabled = false;
        sendMessageBtn.disabled = false;
        if (micButton) micButton.disabled = false;
        if (sendCodeBtn) sendCodeBtn.disabled = false;
    }

    // Update the question status display
    function updateQuestionStatus() {
        // Create or update question counter display
        let statusBar = document.getElementById('question-status');
        if (!statusBar) {
            statusBar = document.createElement('div');
            statusBar.id = 'question-status';
            statusBar.classList.add('question-status');
            interviewSection.insertBefore(statusBar, interviewSection.firstChild);
        }

        if (interviewFinished) {
            statusBar.innerHTML = `
                <div class="status-content">
                    <span>Interview complete</span>
                    <button id="restart-btn" class="secondary-button">Start New Interview</button>
                </div>
            `;
            // Add event listener to the restart button
            document.getElementById('restart-btn').addEventListener('click', restartInterview);
        } else {
            // Different status display based on interview mode
            if (currentInterviewMode === 'voice') {
                // For voice mode, only show question count (no score)
                statusBar.innerHTML = `
                    <div class="status-content">
                        <span>Voice Interview - Question ${questionCount}</span>
                        <button id="end-btn" class="secondary-button">End Interview</button>
                    </div>
                `;
                // Add event listener to the end button
                const endBtn = document.getElementById('end-btn');
                if (endBtn) {
                    endBtn.addEventListener('click', () => {
                        interviewFinished = true;
                        updateQuestionStatus();
                    });
                }
            } else {
                // For text mode, show question count and score
                statusBar.innerHTML = `
                    <div class="status-content">
                        <span>Question ${questionCount} of 5</span>
                        <div class="center-score">
                            <span class="score-display">Score: ${totalScore}/50</span>
                        </div>
                    </div>
                `;
            }
        }
    }

    // Display interview results (pass/fail)
    function displayInterviewResult(status, totalScore, evaluationMessage) {
        interviewFinished = true;
        
        // Create result container
        const resultDiv = document.createElement('div');
        resultDiv.classList.add('interview-result');
        
        // Add appropriate class based on pass/fail
        if (status === 'passed') {
            resultDiv.classList.add('result-passed');
        } else {
            resultDiv.classList.add('result-failed');
        }
        
        // Add content to the result container
        resultDiv.innerHTML = `
            <div class="result-header">
                <h3>Interview ${status === 'passed' ? 'Passed!' : 'Failed'}</h3>
                <div class="result-score">Final Score: ${totalScore}/50</div>
            </div>
            <p class="result-message">${evaluationMessage}</p>
            <button class="retry-button primary-button">Try Again</button>
        `;
        
        // Add to chat
        chatMessages.appendChild(resultDiv);
        
        // Scroll to the result
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        // Update status bar
        updateQuestionStatus();
        
        // Add event listener to the retry button
        resultDiv.querySelector('.retry-button').addEventListener('click', restartInterview);
        
        // Disable inputs
        userInput.disabled = true;
        sendMessageBtn.disabled = true;
        if (micButton) micButton.disabled = true;
        if (sendCodeBtn) sendCodeBtn.disabled = true;
    }

    // Handle interview status response from server
    function handleInterviewStatus(data) {
        // Skip status handling for voice mode
        if (currentInterviewMode === 'voice') {
            return;
        }
        
        if (data.interview_status && data.interview_status.complete) {
            // Interview is complete, show result
            displayInterviewResult(
                data.interview_status.status,
                data.interview_status.total_score,
                data.evaluation_message
            );
        } else if (data.interview_status) {
            // Update remaining questions
            remainingQuestions = 5 - data.interview_status.questions_answered;
            questionCount = data.interview_status.questions_answered;
            updateQuestionStatus();
        }
    }

    // Send message
    sendMessageBtn.addEventListener('click', sendMessage);
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // Initialize CodeMirror for Python code editor
    function initializeCodeMirror() {
        if (!codeMirrorEditor) {
            codeMirrorEditor = CodeMirror.fromTextArea(document.getElementById('code-input'), {
                mode: 'python',
                theme: 'monokai',
                lineNumbers: true,
                indentUnit: 4,
                tabSize: 4,
                lineWrapping: true,
                autofocus: true,
                matchBrackets: true,
                autoCloseBrackets: true
            });
        }
    }

    // Initialize code editor on page load
    initializeCodeMirror();

    // Set initial state of the toggle button
    if (codePanel.classList.contains('visible')) {
        document.querySelector('.toggle-arrow').style.transform = 'rotate(180deg)';
    }

    sendCodeBtn.addEventListener('click', async () => {
        if (interviewFinished) {
            alert('The interview has ended. Please start a new one.');
            return;
        }

        const code = codeMirrorEditor ? codeMirrorEditor.getValue().trim() : '';
        if (!code) return;
        
        // Add user's code to the chat
        addFormattedCode(code, selectedLanguage);
        
        // Reset for next answer
        if (codeMirrorEditor) {
            codeMirrorEditor.setValue('');
        }

        try {
            addTypingIndicator();
            
            const response = await fetch('/send_code', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    code: code,
                    language: selectedLanguage
                })
            });

            if (!response.ok) {
                removeTypingIndicator();
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            removeTypingIndicator();
            
            if (data.error) {
                throw new Error(data.error);
            }

            // Get score if available (only in text mode)
            if (currentInterviewMode !== 'voice' && data.user_score) {
                const questionScore = data.user_score.question_score || 0;
                totalScore = data.user_score.total_score || totalScore;
                
                // Display score notification
                displayScoreNotification(questionScore);
                
                // Update the status bar with the new score
                updateQuestionStatus();
            } else {
                // For voice mode, increment the question counter but don't track score
                if (currentInterviewMode === 'voice') {
                    questionCount++;
                    updateQuestionStatus();
                }
            }

            // Check if interview is complete (only in text mode)
            if (currentInterviewMode !== 'voice' && data.interview_status) {
                handleInterviewStatus(data);
            }

            // Add the interviewer's response
            const messageContent = data.choices[0].message.content;
            addMessage(messageContent, 'interviewer');
            
        } catch (error) {
            removeTypingIndicator();
            console.error('Error sending code:', error);
            alert('Error: ' + error.message);
        }
    });

    function displayScoreNotification(score) {
        // Only display score notifications in text mode
        if (currentInterviewMode === 'voice') {
            return;
        }
        
        const scoreDiv = document.createElement('div');
        scoreDiv.classList.add('score-notification');
        scoreDiv.textContent = `Score: ${score}/10`;
        
        // Style based on score value
        if (score >= 8) {
            scoreDiv.classList.add('score-excellent');
        } else if (score >= 6) {
            scoreDiv.classList.add('score-good');
        } else if (score >= 4) {
            scoreDiv.classList.add('score-fair');
        } else {
            scoreDiv.classList.add('score-poor');
        }
        
        chatMessages.appendChild(scoreDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        // Remove after a few seconds
        setTimeout(() => {
            scoreDiv.classList.add('fade-out');
            setTimeout(() => {
                scoreDiv.remove();
            }, 1000);
        }, 5000);
    }

    // Toggle code panel visibility
    toggleCodePanelBtn.addEventListener('click', () => {
        codePanel.classList.toggle('visible');
        
        // Toggle arrow direction
        const arrow = document.querySelector('.toggle-arrow');
        if (codePanel.classList.contains('visible')) {
            arrow.style.transform = 'rotate(90deg)';
        } else {
            arrow.style.transform = 'rotate(0deg)';
        }
    });

    function addFormattedCode(code, language) {
        // Create message container with avatar
        const messageContainer = document.createElement('div');
        messageContainer.classList.add('message-with-avatar');
        
        // Create the message bubble
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('user-message');
        
        // Create avatar
        const avatar = document.createElement('div');
        avatar.classList.add('avatar', 'user-avatar');
        avatar.innerHTML = '<svg class="avatar-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="5"></circle><path d="M20 21a8 8 0 0 0-16 0"></path></svg>';
        
        const messageContent = document.createElement('div');
        messageContent.classList.add('message-content');
        
        // Create a pre and code element for the code
        const pre = document.createElement('pre');
        pre.classList.add('code-block');
        
        const codeElement = document.createElement('code');
        codeElement.textContent = code;
        codeElement.classList.add(`language-${language}`);
        
        pre.appendChild(codeElement);
        messageContent.appendChild(pre);
        
        // Add timestamp
        const timestamp = document.createElement('span');
        timestamp.classList.add('message-timestamp');
        const now = new Date();
        timestamp.textContent = now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        messageContent.appendChild(timestamp);
        
        messageDiv.appendChild(messageContent);
        messageContainer.appendChild(messageDiv);
        messageContainer.appendChild(avatar);
        
        // Add to chat
        chatMessages.appendChild(messageContainer);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function updateQuestionCounter() {
        fetch('/get_score')
            .then(response => response.json())
            .then(data => {
                // Only update counter for text mode
                if (currentInterviewMode !== 'voice') {
                    questionCount = data.question_count;
                    totalScore = data.total_score;
                }
                updateQuestionStatus();
            })
            .catch(error => {
                console.error('Error updating question counter:', error);
            });
    }

    async function sendMessage() {
        if (interviewFinished) {
            alert('The interview has ended. Please start a new one.');
            return;
        }

        const message = userInput.value.trim();
        if (!message) return;

        // Clear input
        userInput.value = '';
        
        // Add user message to chat
        addMessage(message, 'user');

        try {
            addTypingIndicator();
            
            // Make the API call
            const response = await fetch('/continue_interview', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: message
                })
            });

            if (!response.ok) {
                removeTypingIndicator();
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            removeTypingIndicator();
            
            if (data.error) {
                throw new Error(data.error);
            }

            // Get score if available (only in text mode)
            if (currentInterviewMode !== 'voice' && data.user_score) {
                const questionScore = data.user_score.question_score || 0;
                totalScore = data.user_score.total_score || totalScore;
                
                // Display score notification
                displayScoreNotification(questionScore);
                
                // Update the status bar with the new score
                updateQuestionStatus();
            } else {
                // For voice mode, increment the question counter but don't track score
                if (currentInterviewMode === 'voice') {
                    questionCount++;
                    updateQuestionStatus();
                }
            }

            // Check if interview is complete (only in text mode)
            if (currentInterviewMode !== 'voice' && data.interview_status) {
                handleInterviewStatus(data);
            }

            // Check for direct audio URL in the response
            if (currentInterviewMode === 'voice' && data.audio_url) {
                // Use the audio URL directly
                addMessage(data.audio_url, 'interviewer');
                return;
            }

            // Add interviewer's response
            const messageContent = data.choices[0].message.content;
            
            // Check if we're in voice mode - if so, process as audio
            if (currentInterviewMode === 'voice') {
                // Try to extract audio URL from response if present
                let audioContent = extractAudioContent(data, messageContent);
                if (audioContent) {
                    addMessage(audioContent, 'interviewer');
                } else {
                    // Check if the content itself is an audio URL or contains one
                    if (isAudioUrl(messageContent) || extractAudioUrlFromText(messageContent)) {
                        addMessage(messageContent, 'interviewer');
                    } else {
                        // Fallback to text if no audio found
                        addMessage(messageContent, 'interviewer');
                    }
                }
            } else {
                addMessage(messageContent, 'interviewer');
            }

        } catch (error) {
            removeTypingIndicator();
            console.error('Error continuing interview:', error);
            alert('Error: ' + error.message);
        }
    }

    // Helper function to extract audio content from the API response
    function extractAudioContent(responseData, fallbackText) {
        // Try different known response formats to find audio URL
        try {
            // Check for audio content in different possible locations
            let audioUrl = null;
            
            // Check in choices[0].message.content if it's an object with audio data
            if (responseData.choices && 
                responseData.choices[0] && 
                responseData.choices[0].message) {
                
                const message = responseData.choices[0].message;
                
                // Format 1: content is an array with audio_url objects
                if (Array.isArray(message.content)) {
                    for (const item of message.content) {
                        if (item.type === 'audio_url' && item.audio_url && item.audio_url.url) {
                            audioUrl = item.audio_url.url;
                            break;
                        }
                    }
                }
                
                // Format 2: content has audio_urls property
                else if (typeof message.content === 'object' && message.content.audio_urls) {
                    audioUrl = message.content.audio_urls[0];
                }
            }
            
            // Check directly in responseData for audio_url
            if (!audioUrl && responseData.audio_url) {
                audioUrl = responseData.audio_url;
            }
            
            if (audioUrl) {
                return {
                    audio_urls: [audioUrl],
                    text: fallbackText // Keep the text as a fallback
                };
            }
        } catch (e) {
            console.error("Error extracting audio content:", e);
        }
        
        return null;
    }

    function addMessage(content, sender) {
        // Create message container with avatar
        const messageContainer = document.createElement('div');
        messageContainer.classList.add('message-with-avatar');
        
        // Create the message bubble
        const messageDiv = document.createElement('div');
        messageDiv.classList.add(sender + '-message');
        
        // Create avatar
        const avatar = document.createElement('div');
        avatar.classList.add('avatar');
        
        if (sender === 'interviewer') {
            avatar.classList.add('interviewer-avatar');
            avatar.innerHTML = '<svg class="avatar-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z"></path><path d="M8 9l4 4 4-4"></path></svg>';
        } else {
            avatar.classList.add('user-avatar');
            avatar.innerHTML = '<svg class="avatar-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="5"></circle><path d="M20 21a8 8 0 0 0-16 0"></path></svg>';
        }
        
        // Create inner content container
        const messageContent = document.createElement('div');
        messageContent.classList.add('message-content');
        
        // Helper function to create and add audio element
        function createAudioElement(url) {
            // Convert relative URLs to absolute if needed
            const fullUrl = url.startsWith('http') 
                ? url 
                : window.location.origin + url;
                
            console.log(`Creating audio element with URL: ${fullUrl}`);
            
            const audioElement = document.createElement('audio');
            audioElement.controls = true;
            audioElement.autoplay = currentInterviewMode === 'voice'; // Auto-play in voice mode
            audioElement.src = fullUrl;
            audioElement.classList.add('message-audio');
            
            // Add event listener to verify if audio can play
            audioElement.addEventListener('error', (e) => {
                console.error('Audio element error:', e);
                console.error('Audio error code:', audioElement.error ? audioElement.error.code : 'unknown');
                console.error('Audio error message:', audioElement.error ? audioElement.error.message : 'unknown');
                
                // Try playing a reloaded version or proxy
                setTimeout(() => {
                    if (fullUrl.includes('shapes.inc')) {
                        // Use proxy for external files
                        const proxyUrl = `/proxy_audio?url=${encodeURIComponent(fullUrl)}`;
                        console.log('Using proxy URL:', proxyUrl);
                        audioElement.src = proxyUrl;
                    } else {
                        // Add cache-busting for local files
                        console.log('Reloading audio URL with timestamp:', fullUrl + '?t=' + Date.now());
                        audioElement.src = fullUrl + '?t=' + Date.now();
                    }
                }, 1000);
            });
            
            return audioElement;
        }
        
        // Handle audio content (for Shapes API audio responses)
        if (typeof content === 'object' && content.audio_urls && content.audio_urls.length > 0) {
            // This is an audio response
            const audioUrl = content.audio_urls[0];
            const audioElement = createAudioElement(audioUrl);
            messageContent.appendChild(audioElement);
            
            // Add transcription if available
            if (content.text) {
                const textP = document.createElement('p');
                textP.textContent = content.text;
                textP.classList.add('audio-transcription');
                messageContent.appendChild(textP);
            }
        } 
        // Handle content that might have code blocks
        else if (typeof content === 'string') {
            // Special handling for voice mode - check if content is just an audio URL
            if (currentInterviewMode === 'voice' && sender === 'interviewer' && isAudioUrl(content)) {
                // Create an audio element for the URL
                const audioElement = createAudioElement(content.trim());
                messageContent.appendChild(audioElement);
                
                // Add a small note below the audio
                const noteP = document.createElement('p');
                noteP.textContent = "Audio response";
                noteP.classList.add('audio-transcription');
                messageContent.appendChild(noteP);
            } 
            else {
                // Check if the content contains an audio URL (for partial handling)
                const audioUrlMatch = extractAudioUrlFromText(content);
                if (currentInterviewMode === 'voice' && sender === 'interviewer' && audioUrlMatch) {
                    // Create an audio element for the URL found in the text
                    const audioElement = createAudioElement(audioUrlMatch);
                    messageContent.appendChild(audioElement);
                    
                    // Display the remaining text without the URL
                    const cleanedText = content.replace(audioUrlMatch, '').trim();
                    if (cleanedText) {
                        const textP = document.createElement('p');
                        textP.textContent = cleanedText;
                        textP.classList.add('audio-transcription');
                        messageContent.appendChild(textP);
                    }
                } 
                else {
                    // Regular text processing with code blocks
                    // Split by potential code blocks marked with ```
                    const parts = content.split(/(```[\s\S]*?```)/g);
                    
                    for (const part of parts) {
                        if (part.startsWith('```') && part.endsWith('```')) {
                            // This is a code block
                            // Extract language info if present
                            let codeContent = part.slice(3, -3);
                            let language = 'python'; // Default language
                            
                            // Check for language specifier in the first line
                            const firstLineBreak = codeContent.indexOf('\n');
                            if (firstLineBreak > 0) {
                                const possibleLang = codeContent.substring(0, firstLineBreak).trim().toLowerCase();
                                if (['python', 'javascript', 'js', 'c', 'cpp', 'c++'].includes(possibleLang)) {
                                    language = possibleLang === 'js' ? 'javascript' : possibleLang;
                                    codeContent = codeContent.substring(firstLineBreak + 1);
                                }
                            }
                            
                            const pre = document.createElement('pre');
                            pre.classList.add('code-block');
                            
                            const code = document.createElement('code');
                            code.textContent = codeContent.trim();
                            code.classList.add(`language-${language}`);
                            
                            pre.appendChild(code);
                            messageContent.appendChild(pre);
                        } else if (part.trim()) {
                            // This is regular text
                            const p = document.createElement('p');
                            p.innerHTML = part.replace(/\n/g, '<br>');
                            messageContent.appendChild(p);
                        }
                    }
                }
            }
        } else {
            // Fallback for any other type of content
            const p = document.createElement('p');
            p.textContent = JSON.stringify(content);
            messageContent.appendChild(p);
        }
        
        // Add timestamp
        const timestamp = document.createElement('span');
        timestamp.classList.add('message-timestamp');
        const now = new Date();
        timestamp.textContent = now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        messageContent.appendChild(timestamp);
        
        messageDiv.appendChild(messageContent);
        messageContainer.appendChild(messageDiv);
        messageContainer.appendChild(avatar);
        chatMessages.appendChild(messageContainer);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Helper function to check if a string is an audio URL
    function isAudioUrl(text) {
        if (!text) return false;
        text = text.trim();
        
        // Check for various audio URL patterns
        const audioPatterns = [
            // Shapes.inc URLs
            /https?:\/\/(?:files\.)?shapes\.inc\/[a-zA-Z0-9_-]+\.(mp3|wav|ogg)/i,
            // Azure blob storage URLs
            /https?:\/\/[a-zA-Z0-9_-]+\.blob\.core\.windows\.net\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+\.(mp3|wav|ogg)/i,
            // Local server URLs
            /\/serve_audio\/[a-zA-Z0-9_-]+\.(mp3|wav|ogg)/i,
            // AWS S3 URLs
            /https?:\/\/[a-zA-Z0-9_-]+\.s3\.[a-zA-Z0-9_-]+\.amazonaws\.com\/[a-zA-Z0-9_/-]+\.(mp3|wav|ogg)/i
        ];
        
        return audioPatterns.some(pattern => pattern.test(text));
    }
    
    // Helper function to extract audio URLs from text content
    function extractAudioUrlFromText(text) {
        if (!text) return null;
        
        // Check for various audio URL patterns
        const audioPatterns = [
            // Shapes.inc URLs
            /(https?:\/\/(?:files\.)?shapes\.inc\/[a-zA-Z0-9_-]+\.(mp3|wav|ogg))/i,
            // Azure blob storage URLs
            /(https?:\/\/[a-zA-Z0-9_-]+\.blob\.core\.windows\.net\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+\.(mp3|wav|ogg))/i,
            // Local server URLs
            /(\/serve_audio\/[a-zA-Z0-9_-]+\.(mp3|wav|ogg))/i,
            // AWS S3 URLs
            /(https?:\/\/[a-zA-Z0-9_-]+\.s3\.[a-zA-Z0-9_-]+\.amazonaws\.com\/[a-zA-Z0-9_/-]+\.(mp3|wav|ogg))/i
        ];
        
        for (const pattern of audioPatterns) {
            const match = text.match(pattern);
            if (match) return match[1];
        }
        
        return null;
    }

    // Add microphone recording functionality
    if (micButton) {
        micButton.addEventListener('click', toggleRecording);
    }

    // Toggle recording state
    async function toggleRecording() {
        if (!isRecording) {
            // Start recording
            startRecording();
        } else {
            // Stop recording
            stopRecording();
        }
    }

    // Start audio recording
    async function startRecording() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            // Update UI
            isRecording = true;
            micButton.classList.add('is-recording');
            
            // Create media recorder
            mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
            audioChunks = [];
            
            // Handle data available event
            mediaRecorder.addEventListener('dataavailable', event => {
                if (event.data.size > 0) {
                    audioChunks.push(event.data);
                }
            });
            
            // Handle recording stop event
            mediaRecorder.addEventListener('stop', processRecording);
            
            // Start recording
            mediaRecorder.start();
            
            // Add recording indicator
            const recordingIndicator = document.createElement('div');
            recordingIndicator.id = 'recording-indicator';
            recordingIndicator.innerHTML = `
                <div class="recording-pulse"></div>
                <span>Recording...</span>
            `;
            micButton.appendChild(recordingIndicator);
            
        } catch (error) {
            console.error("Error starting audio recording:", error);
            alert("Could not access microphone. Please ensure you have granted permission.");
        }
    }

    // Stop audio recording
    function stopRecording() {
        if (mediaRecorder && isRecording) {
            mediaRecorder.stop();
            
            // Update UI
            isRecording = false;
            micButton.classList.remove('is-recording');
            
            // Remove recording indicator
            const recordingIndicator = document.getElementById('recording-indicator');
            if (recordingIndicator) {
                recordingIndicator.remove();
            }
        }
    }
    
    // Process recorded audio
    async function processRecording() {
        try {
            // Convert audio chunks to blob
            const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
            
            // Upload to Cloudinary via our server endpoint
            const formData = new FormData();
            formData.append('audio', audioBlob);
            
            const response = await fetch('/process_audio', {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) {
                throw new Error(`Server error: ${response.status}`);
            }
            
            const result = await response.json();
            
            if (result.error) {
                throw new Error(result.error);
            }
            
            // Add the audio message to the chat
            addAudioMessage(result.audio_url);
            
            // Show typing indicator AFTER the user's message
            addTypingIndicator();
            
            // Send the Cloudinary URL to continue the interview
            await sendAudioMessage(result.cloudinary_url);
            
        } catch (error) {
            console.error("Error processing audio:", error);
            removeTypingIndicator();
            alert("Error processing audio: " + error.message);
        }
    }
    
    // Add audio message to chat
    function addAudioMessage(audioUrl) {
        // Create message container with avatar
        const messageContainer = document.createElement('div');
        messageContainer.classList.add('message-with-avatar');
        
        // Create the message bubble
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('user-message');
        
        // Create avatar
        const avatar = document.createElement('div');
        avatar.classList.add('avatar', 'user-avatar');
        avatar.innerHTML = '<svg class="avatar-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="5"></circle><path d="M20 21a8 8 0 0 0-16 0"></path></svg>';
        
        const messageContent = document.createElement('div');
        messageContent.classList.add('message-content');
        
        // Create audio element
        const audioElement = document.createElement('audio');
        audioElement.controls = true;
        audioElement.src = audioUrl;
        
        // Add audio element to message content
        messageContent.appendChild(audioElement);
        
        // Add "Voice Message" text
        const voiceMessageText = document.createElement('p');
        voiceMessageText.classList.add('audio-transcription');
        voiceMessageText.textContent = "Voice Message";
        messageContent.appendChild(voiceMessageText);
        
        // Add timestamp
        const timestamp = document.createElement('span');
        timestamp.classList.add('message-timestamp');
        const now = new Date();
        timestamp.textContent = now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        messageContent.appendChild(timestamp);
        
        messageDiv.appendChild(messageContent);
        messageContainer.appendChild(messageDiv);
        messageContainer.appendChild(avatar);
        
        // Add to chat
        chatMessages.appendChild(messageContainer);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    // Send audio message to continue interview
    async function sendAudioMessage(cloudinaryUrl) {
        try {
            // Make the API call
            const response = await fetch('/continue_interview', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    is_audio_message: true,
                    cloudinary_url: cloudinaryUrl
                })
            });

            if (!response.ok) {
                removeTypingIndicator();
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            removeTypingIndicator();
            
            if (data.error) {
                throw new Error(data.error);
            }

            // Voice mode doesn't handle scoring
            if (currentInterviewMode === 'voice') {
                // For voice mode, increment the question counter but don't track score
                questionCount++;
                updateQuestionStatus();
            }

            // Check for direct audio URL in the response
            if (currentInterviewMode === 'voice' && data.audio_url) {
                // Use the audio URL directly
                addMessage(data.audio_url, 'interviewer');
                return;
            }

            // Add interviewer's response
            const messageContent = data.choices[0].message.content;
            
            // Check if we're in voice mode - if so, process as audio
            if (currentInterviewMode === 'voice') {
                // Try to extract audio URL from response if present
                let audioContent = extractAudioContent(data, messageContent);
                if (audioContent) {
                    addMessage(audioContent, 'interviewer');
                } else {
                    // Check if the content itself is an audio URL or contains one
                    if (isAudioUrl(messageContent) || extractAudioUrlFromText(messageContent)) {
                        addMessage(messageContent, 'interviewer');
                    } else {
                        // Fallback to text if no audio found
                        addMessage(messageContent, 'interviewer');
                    }
                }
            } else {
                addMessage(messageContent, 'interviewer');
            }

        } catch (error) {
            removeTypingIndicator();
            console.error('Error continuing interview with audio:', error);
            alert('Error: ' + error.message);
        }
    }
}); 