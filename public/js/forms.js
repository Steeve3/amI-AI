import { showLoadingOverlay, hideLoadingOverlay } from './ui.js';

export function initForms() {
    initUpdateCvForm();
    initCvForm();
}

function initUpdateCvForm() {
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
                const prompt = `CV Content: ${fileText}`;
                
                const response = await sendToBackend(prompt, jobDescription);
                
                // Store CV data in sessionStorage
                sessionStorage.setItem('cvContent', response.message);
                
                // Add a delay for the loading animation
                await new Promise(resolve => setTimeout(resolve, 8000));
                
                // Redirect to chat page
                window.location.href = 'chat.html';
            } catch (error) {
                hideLoadingOverlay();
                console.error('Error:', error);
                alert('An error occurred while processing your CV');
            }
        });
    }
}

function initCvForm() {
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
                const response = await sendToBackend(prompt, formData.jobDescription);
                
                // Store CV data in sessionStorage
                sessionStorage.setItem('cvContent', response.message);
                
                // Add a delay for the loading animation
                await new Promise(resolve => setTimeout(resolve, 8000));
                
                // Redirect to chat page
                window.location.href = 'chat.html';
            } catch (error) {
                hideLoadingOverlay();
                console.error('Error:', error);
                alert('An error occurred while generating your CV');
            }
        });
    }
}

// Helper function to read file content
function readFileAsText(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = event => resolve(event.target.result);
        reader.onerror = error => reject(error);
        reader.readAsText(file);
    });
}

// Helper function to send data to backend
async function sendToBackend(prompt, JobOffers) {
    const response = await fetch('/api/html', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            prompt,
            JobOffers,
            layout: true // Always true for CV generation
        })
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
}
