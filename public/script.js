// Theme toggle functionality
const themeToggle = document.getElementById('theme-toggle');
if (themeToggle) {
    themeToggle.addEventListener('change', () => {
        document.body.classList.toggle('dark-mode');
    });
}

// File drop zone functionality
const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('cv-upload');
if (dropZone && fileInput) {
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('drag-over');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('drag-over');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
        const file = e.dataTransfer.files[0];
        handleFileUpload(file);
    });

    dropZone.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', () => {
        const file = fileInput.files[0];
        handleFileUpload(file);
    });
}

function handleFileUpload(file) {
    if (file) {
        const dropZoneText = document.getElementById('drop-zone-text');
        dropZoneText.textContent = `Selected file: ${file.name}`;
    }
}

// Loading animation functions
function showLoadingOverlay(message = 'Generating your CV...') {
    const overlay = document.querySelector('.loading-overlay');
    const loadingText = overlay.querySelector('.loading-text');
    loadingText.textContent = message;
    overlay.classList.add('active');
}

function hideLoadingOverlay() {
    const overlay = document.querySelector('.loading-overlay');
    overlay.classList.remove('active');
}

// Form submission handlers
const updateCvForm = document.getElementById('update-cv-form');
if (updateCvForm) {
    updateCvForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const jobDescription = document.getElementById('job-description').value;
        const file = document.getElementById('cv-upload').files[0];
        
        if (!file) {
            alert('Please upload a CV file');
            return;
        }

        try {
            showLoadingOverlay('Updating your CV...');
            const fileText = await readFileAsText(file);
            const prompt = `Job Description: ${jobDescription}\n\nCV Content: ${fileText}`;
            
            const response = await sendToBackend(prompt, jobDescription, true);
            
            // Store CV data in sessionStorage
            sessionStorage.setItem('cvContent', response.message);
            
            // Add a delay for the loading animation
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // Redirect to chat page
            window.location.href = 'chat.html';
        } catch (error) {
            hideLoadingOverlay();
            console.error('Error:', error);
            alert('An error occurred while processing your CV');
        }
    });
}

const cvForm = document.getElementById('cv-form');
if (cvForm) {
    cvForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = {
            selfDescription: document.getElementById('self-description').value,
            fullName: document.getElementById('full-name').value,
            email: document.getElementById('email').value,
            phone: document.getElementById('phone').value,
            education: document.getElementById('education').value,
            workExperience: document.getElementById('work-experience').value,
            skills: document.getElementById('skills').value,
            jobDescription: document.getElementById('job-description').value
        };

        const prompt = `
            About: ${formData.selfDescription}
            Name: ${formData.fullName}
            Email: ${formData.email}
            Phone: ${formData.phone}
            Education: ${formData.education}
            Work Experience: ${formData.workExperience}
            Skills: ${formData.skills}
        `;

        try {
            showLoadingOverlay();
            const response = await sendToBackend(prompt, formData.jobDescription, true);
            
            // Store CV data in sessionStorage
            sessionStorage.setItem('cvContent', response.message);
            
            // Add a delay for the loading animation
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // Redirect to chat page
            window.location.href = 'chat.html';
        } catch (error) {
            hideLoadingOverlay();
            console.error('Error:', error);
            alert('An error occurred while generating your CV');
        }
    });
}

// Chat functionality
document.addEventListener('DOMContentLoaded', () => {
    // Load CV content from sessionStorage if on chat page
    const cvContainer = document.getElementById('cv');
    if (cvContainer) {
        const storedCV = sessionStorage.getItem('cvContent');
        if (storedCV) {
            cvContainer.innerHTML = storedCV;
        }
    }

    // Chat message handling
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
});

async function handleChatMessage(message) {
    try {
        const response = await sendToBackend(message, '', false);
        addMessage('system', response.message);
    } catch (error) {
        console.error('Error:', error);
        addMessage('system', 'Sorry, I encountered an error processing your request.');
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

// Utility functions
async function readFileAsText(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(e);
        reader.readAsText(file);
    });
}

async function sendToBackend(prompt, jobOffers, layout) {
    const response = await fetch('/api/html', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
            prompt, 
            JobOffers: jobOffers,
            layout: layout 
        })
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
}

async function downloadPDF(latexContent) {
    const response = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/pdf'
        },
        body: JSON.stringify({ latex: latexContent })
    });

    if (!response.ok) {
        throw new Error('Failed to generate PDF');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);

    // Create a link to download the PDF
    const a = document.createElement('a');
    a.href = url;
    a.download = 'output.pdf';
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
}
