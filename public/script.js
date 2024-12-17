import { initThemeToggle } from './js/theme.js';
import { initFileUpload } from './js/fileUpload.js';
import { initForms } from './js/forms.js';
import { initChat } from './js/chat.js';

// Initialize all modules when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initThemeToggle();
    initFileUpload();
    initForms();
    initChat();
});
