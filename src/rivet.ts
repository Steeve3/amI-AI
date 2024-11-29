import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { runGraphInFile, startDebuggerServer, RunGraphOptions } from '@ironclad/rivet-node';
import * as dotenv from 'dotenv';
import latex = require('node-latex');
import { Readable } from 'stream';

// Load environment variables from .env file
dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

const debuggerServer = startDebuggerServer({
    port: 3001, // Optional: default 21888
});

app.use(express.static(path.join(__dirname, '../public')));
app.use(express.json());

// Add explicit route for root path
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/home_page.html'));
});

interface RivetResponse {
    message: string;
}

async function runRivetGraph(prompt: string, context: string): Promise<RivetResponse> {
    const project = path.join(__dirname, '../am-Ia.rivet-project');
    
    const result = await runGraphInFile(project, {
        graph: "App/OpenAI",
        remoteDebugger: debuggerServer,
        inputs: { Message: prompt },
        context: { userContext: context },
        settings: {openAiEndpoint: 'https://api.openai.com/v1/chat/completions'},
        openAiKey: process.env.API_KEY as string 
    } as RunGraphOptions);

    return {
        message: result?.Answer?.value?.toString() ?? "No response"
    };
}

app.post('/api/message', async (req, res) => {
    const { prompt, context = 'conversation' } = req.body;
    
    if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
    }

    try {
        const response = await runRivetGraph(prompt, context);
        
        // For CV creation/update, we'll return formatted text that the frontend will handle
        if (context === 'cv_creation' || context === 'cv_update') {
            // Ensure the response is properly formatted for frontend display
            const formattedResponse = {
                ...response,
                message: response.message.replace(/\n/g, '<br>'),
                context
            };
            return res.json(formattedResponse);
        }

        res.json({ ...response, context });
    } catch (error) {
        console.error("Error processing request:", error);
        res.status(500).json({ 
            error: "Failed to process request",
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

async function compileLaTeXToPDF(latexInput: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        const latexStream = new Readable();
        latexStream.push(latexInput);
        latexStream.push(null);

        const pdfChunks: Buffer[] = [];
        const pdfStream = latex(latexStream);

        pdfStream.on('data', (chunk) => {
            pdfChunks.push(chunk);
        });

        pdfStream.on('error', (err) => {
            reject(err);
        });

        pdfStream.on('end', () => {
            const pdfBuffer = Buffer.concat(pdfChunks);
            resolve(pdfBuffer);
        });
    });
}

app.post('/generate-pdf', async (req, res) => {
    try {
        const latexInput = req.body.latex;

        if (!latexInput) {
            return res.status(400).send('LaTeX input is required.');
        }

        const pdfBuffer = await compileLaTeXToPDF(latexInput);

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': 'attachment; filename="output.pdf"',
            'Content-Length': pdfBuffer.length,
        });

        res.send(pdfBuffer);
    } catch (error) {
        console.error('Error generating PDF:', error);
        res.status(500).send('An error occurred while generating the PDF.');
    }
});

const server = app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
