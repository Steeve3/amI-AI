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
            
            const jobDescription = document.getElementById('job-description')?.value;
            const fileInput = document.getElementById('cv-upload');
            const file = fileInput?.files[0];
            
            if (!file) {
                alert('Please upload a CV file');
                return;
            }

            try {
                showLoadingOverlay('Updating your CV...');
                const fileText = await readFileAsText(file);
                const prompt = `CV Content: ${fileText}`;
                
                const response = await sendToBackend(prompt, jobDescription);
                
                if (response?.message) {
                    sessionStorage.setItem('cvContent', response.message);
                } else {
                    throw new Error('No CV content returned from the server.');
                }

                window.location.href = 'chat.html';
            } catch (error) {
                console.error('Error:', error);
                alert('An error occurred while processing your CV');
            } finally {
                hideLoadingOverlay();
            }
        });
    }
}

function initCvForm() {
    const cvForm = document.getElementById('cv-form');
    const submitButton = document.querySelector('.submit-button');
    const loadingOverlay = document.querySelector('.loading-overlay');

    if (cvForm) {
        cvForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = {
                selfDescription: document.getElementById('self-description')?.value,
                fullName: document.getElementById('full-name')?.value,
                email: document.getElementById('email')?.value,
                phone: document.getElementById('phone')?.value,
                education: document.getElementById('education')?.value,
                workExperience: document.getElementById('work-experience')?.value,
                skills: document.getElementById('skills')?.value,
                jobDescription: document.getElementById('job-description')?.value
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
                loadingOverlay.classList.add('active');
                submitButton.disabled = true;
                
                const response = await sendToBackend(prompt, formData.jobDescription);
                
                if (response?.message) {
                    sessionStorage.setItem('cvContent', response.message);
                    window.location.href = 'chat.html';
                } else {
                    throw new Error('No CV content returned from the server.');
                }
            } catch (error) {
                console.error('Error:', error);
                alert('An error occurred while generating your CV. Please try again.');
            } finally {
                loadingOverlay.classList.remove('active');
                submitButton.disabled = false;
            }
        });
    }
}

function readFileAsText(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = event => resolve(event.target.result);
        reader.onerror = error => reject(error);
        reader.readAsText(file);
    });
}

async function sendToBackend(prompt, JobOffers) {
    const response = await fetch('/api/html', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            prompt,
            JobOffers,
            layout: true
        })
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
}
