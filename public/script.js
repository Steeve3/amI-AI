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

// Format CV content into HTML
function formatCVToHTML(cvText) {
    // Split the CV text into sections
    const sections = cvText.split('###').filter(section => section.trim());
    
    // Create HTML elements for each section
    const formattedSections = sections.map(section => {
        const lines = section.trim().split('\n');
        const title = lines[0].replace(/\*\*/g, '').trim();
        const content = lines.slice(1).join('<br>');
        
        return `
            <div class="cv-section">
                <h2>${title}</h2>
                <div class="cv-content">
                    ${content.replace(/\*\*/g, '')}
                </div>
            </div>
        `;
    });

    return `
        <div class="cv-container">
            ${formattedSections.join('')}
        </div>
    `;
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
            const fileText = await readFileAsText(file);
            const prompt = `Job Description: ${jobDescription}\n\nCV Content: ${fileText}`;
            
            const response = await sendToBackend(prompt, 'cv_update');
            // Format and display the CV
            const previewSection = document.createElement('div');
            previewSection.className = 'cv-preview';
            previewSection.innerHTML = formatCVToHTML(response.message);
            
            // Replace or append the preview
            const existingPreview = document.querySelector('.cv-preview');
            if (existingPreview) {
                existingPreview.replaceWith(previewSection);
            } else {
                updateCvForm.after(previewSection);
            }
        } catch (error) {
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
            Create a CV for the following information:
            About: ${formData.selfDescription}
            Name: ${formData.fullName}
            Email: ${formData.email}
            Phone: ${formData.phone}
            Education: ${formData.education}
            Work Experience: ${formData.workExperience}
            Skills: ${formData.skills}
            Job Description to target: ${formData.jobDescription}
        `;

        try {
            const response = await sendToBackend(prompt, 'cv_creation');
            // Format and display the CV
            const previewSection = document.getElementById('cv-preview');
            if (previewSection) {
                previewSection.innerHTML = formatCVToHTML(response.message);
                previewSection.style.display = 'block';
            }
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred while generating your CV');
        }
    });
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

async function sendToBackend(prompt, context) {
    const response = await fetch('/api/message', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt, context })
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
}
