import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { runGraphInFile, startDebuggerServer } from '@ironclad/rivet-node';
import * as dotenv from 'dotenv';
import * as fs from 'fs/promises';
// Load environment variables from .env file
dotenv.config();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;
const debuggerServer = startDebuggerServer({
    port: 3001, // Optional: default 21888
});
app.use(express.static(path.join(__dirname, '../public')));
app.use(express.json()); // middleware for parsing JSON
// Store conversation history
let conversationHistory = [];
// Add explicit route for root path
app.get('/', ((_req, res) => {
    res.sendFile(path.join(__dirname, '../public/home_page.html'));
}));
async function runRivetGraph(prompt, JobOffer, html_l) {
    const project = path.join(__dirname, '../am-Ia.rivet-project');
    const result = await runGraphInFile(project, {
        graph: "App/OpenAI",
        remoteDebugger: debuggerServer,
        inputs: {
            Message: prompt,
            JobOffers: JobOffer,
            html_format: html_l
        },
        settings: { openAiEndpoint: 'https://api.openai.com/v1/chat/completions' },
        openAiKey: process.env.OPENAI_API_KEY
    });
    return {
        message: result?.Answer?.value?.toString() ?? "No response"
    };
}
async function runChatGraph(message, cvContent, jobOff) {
    const project = path.join(__dirname, '../am-Ia.rivet-project');
    const result = await runGraphInFile(project, {
        graph: "App/ChatforCV",
        remoteDebugger: debuggerServer,
        inputs: {
            userMessage: message,
            userCVData: cvContent,
            jobOffer: jobOff,
            conversationHistory: JSON.stringify(conversationHistory) // server save chat hystory
        },
        settings: { openAiEndpoint: 'https://api.openai.com/v1/chat/completions' },
        openAiKey: process.env.OPENAI_API_KEY
    });
    // Extract response type and data
    console.log(result);
    return {
        monologue: result?.innerMonologue?.value?.toString() ?? "No response",
        response: result?.aiResponse?.value?.toString() ?? "No response",
        adjstmnt: result?.aiResponse?.value?.toString() ?? "No response",
        tool_update: result?.toolUpdate?.value === true
    };
}
async function runToolGraph(adjst, cvContent) {
    const project = path.join(__dirname, '../am-Ia.rivet-project');
    const result = await runGraphInFile(project, {
        graph: "App/tools/updateTool",
        remoteDebugger: debuggerServer,
        inputs: {
            adjustments: adjst,
            htmlCV: cvContent, // Fixed: Now using the passed cvContent parameter
        },
        settings: { openAiEndpoint: 'https://api.openai.com/v1/chat/completions' },
        openAiKey: process.env.OPENAI_API_KEY
    });
    // Extract response type and data
    console.log(result);
    return {
        UpdateContent: result?.updatedCV?.value?.toString() ?? "No response"
    };
}
// function to get the .tex
async function runLatexGraph(finalCVContent) {
    const project = path.join(__dirname, '../am-Ia.rivet-project');
    const result = await runGraphInFile(project, {
        graph: "App/upload_pdf/uploadLatex",
        remoteDebugger: debuggerServer,
        inputs: {
            finalhtmlCV: finalCVContent,
        },
        settings: { openAiEndpoint: 'https://api.openai.com/v1/chat/completions' },
        openAiKey: process.env.OPENAI_API_KEY
    });
    // Extract response type and data
    console.log(result);
    return {
        cvLatex: result?.updatedCV?.value?.toString() ?? "No response"
    };
}
app.post('/api/chat', async (req, res) => {
    const { message, cvContent, jobOff } = req.body;
    // check cvContent
    console.log(cvContent);
    console.log({ message, cvContent, jobOff });
    if (!message || !cvContent || !jobOff) {
        res.status(400).json({ error: "Message, CV content, and job offer are required" });
        return;
    }
    try {
        // Step 1: Run runChatGraph
        const chatResponse = await runChatGraph(message, cvContent, jobOff);
        // Update conversation history
        conversationHistory.push({ role: 'user', content: message });
        conversationHistory.push({ role: 'assistant', content: chatResponse.response });
        // Send immediate chat response
        res.json({
            monologue: chatResponse.monologue,
            response: chatResponse.response,
            adjstmnt: chatResponse.adjstmnt,
            tool_update: chatResponse.tool_update // Notify client to trigger CV update
        });
    }
    catch (error) {
        console.error("Error processing chat request:", error);
        res.status(500).json({
            error: "Failed to process chat request",
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
app.post('/api/updateCV', async (req, res) => {
    const { adjstmnt, cvContent } = req.body;
    if (!adjstmnt || !cvContent) {
        res.status(400).json({ error: "Adjustment and CV content are required" });
        return;
    }
    try {
        console.log("Running tool graph for CV update...");
        // Run the tool graph to generate the updated CV
        const toolResponse = await runToolGraph(adjstmnt, cvContent);
        console.log("Updated CV content:", toolResponse.UpdateContent);
        // Send updated CV content back to the client
        res.json({
            updatedCV: toolResponse.UpdateContent
        });
    }
    catch (error) {
        console.error("Error updating CV:", error);
        res.status(500).json({
            error: "Failed to update CV",
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
app.post('/api/html', ((req, res) => {
    const { prompt, JobOffers, layout } = req.body;
    if (!prompt || !JobOffers) {
        res.status(400).json({ error: "Prompt and JobOffers are required" });
        return;
    }
    runRivetGraph(prompt, JobOffers, layout)
        .then(response => {
        res.json(response);
    })
        .catch(error => {
        console.error("Error processing request:", error);
        res.status(500).json({
            error: "Failed to process request",
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    });
}));
app.post('/api/generate-latex', (req, res) => {
    (async () => {
        const { latex } = req.body;
        if (!latex) {
            res.status(400).json({ error: 'No CV content provided' });
            return;
        }
        try {
            const result = await runLatexGraph(latex);
            const outputFolder = path.join(__dirname, 'output');
            const filePath = path.join(outputFolder, 'outputCV.tex');
            await fs.mkdir(outputFolder, { recursive: true });
            await fs.writeFile(filePath, result.cvLatex, 'utf-8');
            console.log(`LaTeX file saved at: ${filePath}`);
            res.status(200).json({ message: 'LaTeX file generated successfully', filePath });
        }
        catch (error) {
            console.error('Error generating LaTeX:', error);
            res.status(500).json({ error: 'Failed to generate LaTeX content' });
        }
    })();
});
// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
//# sourceMappingURL=rivet.js.map