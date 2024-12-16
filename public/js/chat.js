import { showLoadingOverlay, hideLoadingOverlay, showNotification } from './ui.js';

export function initChat() {
    loadStoredCV();
    setupChatHandlers();
}

function loadStoredCV() {
    const cvContainer = document.getElementById('cv');
    if (cvContainer) {
        const storedCV = sessionStorage.getItem('cvContent');
        if (storedCV) {
            cvContainer.innerHTML = storedCV;
        }
    }
}

function setupChatHandlers() {
    const sendBtn = document.getElementById('send-btn');
    const userInput = document.getElementById('user-input');
    if (sendBtn && userInput) {
        sendBtn.addEventListener('click', () => {
            const messageText = userInput.value.trim();
            if (messageText) {
                addMessage('user', messageText);
                userInput.value = '';
                handleChatMessage(messageText);
            }
        });

        userInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const messageText = userInput.value.trim();
                if (messageText) {
                    addMessage('user', messageText);
                    userInput.value = '';
                    handleChatMessage(messageText);
                }
            }
        });
    }
}

async function handleChatMessage(message) {
    try {
        showLoadingOverlay('Processing your request...');
        
        // Get CV content directly from the CV container
        const cvContainer = document.getElementById('cv');
        const cvContent = cvContainer ? cvContainer.innerHTML : '';
        
        // Validate both message and CV content
        if (!message || !cvContent) {
            throw new Error('Message and CV content are required');
        }

        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                message,
                cvContent 
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        // Add the inner monologue to the chat
        if (data.monologue) {
            addMessage('system-monologue', data.monologue);
        }
        
        // Add the AI's response to the chat
        if (data.response) {
            addMessage('system', data.response);
        }

        hideLoadingOverlay();
    } catch (error) {
        console.error('Error:', error);
        hideLoadingOverlay();
        addMessage('system', error.message);
        showNotification(error.message, 'error');
    }
}

function addMessage(sender, text) {
    const chatMessages = document.getElementById('chat-messages');
    if (!chatMessages) return;

    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', sender);
    const messageContent = document.createElement('p');
    messageContent.textContent = text;
    messageDiv.appendChild(messageContent);
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Add CSS for system monologue messages
const style = document.createElement('style');
style.textContent = `
.message.system-monologue {
    background-color: #f0f0f0;
    font-style: italic;
    color: #666;
}
`;
document.head.appendChild(style);