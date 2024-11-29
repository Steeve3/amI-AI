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
            // Handle the response - you might want to download the updated CV or show it in a preview
            console.log('Backend response:', response);
            alert('CV has been processed! Check the response in console.');
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
            // Display the generated CV in the preview section
            const previewSection = document.getElementById('cv-preview');
            if (previewSection) {
                previewSection.innerHTML = `<pre>${response.message}</pre>`;
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

async function downloadPDF(latexContent) {
    const response = await fetch('/generate-pdf', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
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
