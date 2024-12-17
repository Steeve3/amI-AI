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
    const cvContainer = document.getElementById('cv');
    const sendBtn = document.getElementById('send-btn');
    const currentCV = cvContainer ? cvContainer.innerHTML : '';

    try {
        // Show loading spinner on send button
        sendBtn.classList.add('loading');
        sendBtn.disabled = true;

        if (!cvContainer) {
            showNotification('CV container not found on the page!', 'error');
            return;
        }        

        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message, cvContent: currentCV }),
        });

        if (!response.ok) {
            throw new Error('Error processing your request.');
        }

        const data = await response.json();

        
        // Add the inner monologue to the chat
        if (data.monologue) {
            addMessage('system-monologue', data.monologue);
        }
        // Add chatbot response to the chat
        if (data.response) {
            addMessage('system', data.response);
        }

        // If tool_update is true, call the second endpoint to update the CV
        if (data.tool_update) {
            console.log("Requesting CV update...");
            cvContainer.classList.add('loading'); // Add CV loading spinner
            await fetchUpdatedCV(data.adjstmnt, currentCV);
            cvContainer.classList.remove('loading'); // Remove CV spinner

        }

    } catch (error) {
        console.error('Error:', error);
        addMessage('system', error.message);
        showNotification(error.message, 'error');

    } finally {
        // Remove send button spinner and re-enable the button
        sendBtn.classList.remove('loading');
        sendBtn.disabled = false;
    }
}

async function fetchUpdatedCV(adjstmnt, cvContent) {
    const cvContainer = document.getElementById('cv');
    try {
        // Add 'loading' class to show spinner inside the CV container
        if (cvContainer) {
            cvContainer.classList.add('loading');
        }

        const response = await fetch('/api/updateCV', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ adjstmnt, cvContent })
        });

        if (!response.ok) {
            throw new Error('Error updating CV.');
        }

        const data = await response.json();

        // Update the CV container with the updated content
        if (data.updatedCV) {
            console.log("Updating CV container with:", data.updatedCV);
            updateCVContent(data.updatedCV);
            sessionStorage.setItem('cvContent', data.updatedCV); // Save to storage
        } else {
            console.warn("No updated CV returned.");
            addMessage('system', 'No updates were made to your CV.');
        }
    } catch (error) {
        console.error('Error updating CV:', error);

        addMessage('system', 'Failed to update CV.');
    } finally {
        // Remove 'loading' class from CV container
        if (cvContainer) {
            cvContainer.classList.remove('loading');
        }
    }
}

function updateCVContent(newCV) {
    const cvContainer = document.getElementById('cv'); // Target the CV container
    if (cvContainer) {
        cvContainer.innerHTML = newCV; // Replace the content dynamically
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

