import { showLoadingOverlay, hideLoadingOverlay } from './ui.js';

export function initFileUpload() {
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
}

async function handleFileUpload(file) {
    if (!file) return;

    const dropZoneText = document.getElementById('drop-zone-text');
    dropZoneText.textContent = `Processing file: ${file.name}`;
    showLoadingOverlay('Processing your PDF...');

    try {
        // Create a temporary path for the file
        const filePath = `uploaded_pdf/${file.name}`;
        
        // Send the file information to the backend
        const response = await fetch('/api/upload-pdf', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                filePath: filePath,
                fileName: file.name
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        
        // Update the UI with the result
        dropZoneText.textContent = `File processed successfully: ${file.name}`;
        
        // If there's an output path, you might want to do something with it
        if (result.outputPath) {
            console.log('Text file created at:', result.outputPath);
        }

        // Store the response message if needed
        if (result.message) {
            sessionStorage.setItem('pdfContent', result.message);
        }

        hideLoadingOverlay();
    } catch (error) {
        console.error('Error processing file:', error);
        dropZoneText.textContent = `Error processing file: ${file.name}`;
        hideLoadingOverlay();
        alert('An error occurred while processing your file');
    }
}
