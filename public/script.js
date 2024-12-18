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

function loadProfile(profileNumber) {
    const profiles = {
        1: {
            fullName: "Giovanni Rossi",
            email: "giovanni.rossi@example.com",
            phone: "+39 123 456 789",
            education: `Scientific High-School Diploma, Galileo Galilei (Verona)\nThird-year student of Digital Management at H-Farm College\nSpecial Interests: Focus on innovation, digital transformation, and project management.`,
            workExperience: `Digital Marketing Project Lead (Student Project)\nH-Farm College | Sep 2022 – Dec 2022\n- Developed a comprehensive digital marketing strategy for a local startup.\n- Conducted data analysis to identify target audiences.\n\nData Analysis Intern\nH-Farm College – Innovation Lab | Jan 2023 – Mar 2023\n- Automated data visualization dashboards using Excel and Tableau.`,
            skills: `SQL, Excel, Tableau, Python, HTML, CSS, Figma\nTeam collaboration, Effective communication, Critical thinking.`,
            selfDescription: `Passionate about innovation, digital transformation, and leveraging data to solve business problems. Enthusiastic about AI and emerging technologies.`,
            jobDescription: `JUNIOR DATA ANALYST - OGILVY\nINTERNSHIP\nLa persona, entrando a far parte del team Data, sarà di supporto:\n- nel disegnare le più opportune strategie di raccolta dei dati\n- nel riconciliare dati da fonti diverse (database, web analytics, social analytics)\n- nella ricerca di insight strategici e individuazione di trend emergenti\n- nell’effettuare analisi statistiche sui dati, interpretarli e trasformare i risultati in insight di valore per il cliente\n- nella preparazione di presentazioni, report e relativi insight\n\nSei la persona che fa per noi se:\n- hai una laurea o un percorso di studi in Economia o Marketing\n- possiedi ottime capacità logiche, razionali ed analitiche\n- hai buone doti comunicative ed espositive\n- sei una persona precisa e con buone doti organizzative e gestionali\n- sei appassionato di digital, in particolare social networks\n- hai una buona conoscenza dell’inglese\n\nSi richiede una conoscenza delle seguenti competenze tecniche:\n- Social Network Insights\n- Excel\n- Looker Studio / PowerBI / Tableau / Qlik\n\nLa conoscenza di Search Console SEO, AdWords, delle principali tool di web analytics e social Analytics , SQL, Google Analytics/Adobe Analytics è nice to have.\nLo stage ha una durata di 6 mesi ed è previsto un rimborso spese di 500 euro + ticket.`
        },
        2: {
            fullName: "Chiara Bianchi",
            email: "chiara.bianchi@example.com",
            phone: "+39 987 654 321",
            education: `Linguistic High-School Diploma, Galileo Galilei (Verona)\nGraduated in Business Economics and Management from Ca' Foscari University\nSpecial Interests: Strategic management and sustainable business models.`,
            workExperience: `Business Development Analyst\nGreen Ventures Srl | Jan 2020 – Present\n- Conducted market research in renewable energy.\n\nMarketing and Sales Coordinator\nInnovate Italia | Mar 2017 – Dec 2019\n- Designed B2B campaigns, increasing client acquisition by 15%.`,
            skills: `Financial modeling tools (Excel, SAP), Salesforce, Power BI, Tableau\nStrategic thinking, Problem-solving, Negotiation skills.`,
            selfDescription: `Dedicated to creating sustainable and impactful business solutions. Committed to leveraging data for strategic decision-making in renewable energy and beyond.`,
            jobDescription: `SPECIALISTA BUSINESS DEVELOPER - GENERALI\nTEMPO DETERMINATO - 12 MESI\n\nJob Description\nLa struttura di Business Development e Strategic Partnership di Generali Italia è alla ricerca di un Business Developer da inserire nel team dedicato allo sviluppo di business B2B2C. Si occuperà di supportare lo sviluppo Partnership assicurative con società terze (e.g. ambito Retail, Media-Telco, GDO,..) e coadiuvare la definizione degli accordi per arricchire la proposizione Agenziale Generali con nuovi servizi e prodotti funzionali a un miglior posizionamento della rete Agenti.\n\nResponsabilità principali:\n- Supporto all'individuazione di collaborazioni strategiche, coadiuvando le attività di scouting  e di contatto di possibili Partner\n- Ausilio alla concettualizzazione e valutazione di possibili collaborazioni che abbiano ad oggetto la creazione di valore per tutti gli attori dell'accordo\n- Contributo all'ideazione di nuovi concept di offerta da presentare ai Partner\n- Contributo alla realizzazione di Business plan a sostegno delle iniziative\n- Supporto alla definizione dei contratti di servizio verso il cliente B2B / B2C\n- Attività di monitoraggio e rendicontazione delle iniziative\n\nRequirements\n- Laurea preferenzialmente in materie scientifiche; eventualmente anche in Giurisprudenza / Economia\n- Capacità di supporto alle progettualità di relazione con numerosi interlocutori\n- Capacità di comunicare in modo chiaro ed efficace\n- Capacità analitiche\n- Passione e Curiosità nell'approfondire temi, sviluppare un proprio punto di vista e portare avanti con passione le proprie idee fino alla realizzazione\n- Creatività e pensiero laterale\n\nNice to have:\n- Esperienza in realtà innovative (Startup, Corporate Spin-off, Acceleratori/Incubatori)\n- Esperienza nei settori GDO, Telco, Retail, Health & Wellness, Fintech.`
        }
    };

    const profile = profiles[profileNumber];
    if (profile) {
        document.getElementById('full-name').value = profile.fullName;
        document.getElementById('email').value = profile.email;
        document.getElementById('phone').value = profile.phone;
        document.getElementById('education').value = profile.education;
        document.getElementById('work-experience').value = profile.workExperience;
        document.getElementById('skills').value = profile.skills;
        document.getElementById('self-description').value = profile.selfDescription;
        document.getElementById('job-description').value = profile.jobDescription;
    }
}

// Attach the function to the global scope
window.loadProfile = loadProfile;
