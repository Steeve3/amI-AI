import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { runGraphInFile, startDebuggerServer, RunGraphOptions } from '@ironclad/rivet-node';
import * as dotenv from 'dotenv';
import { Readable } from 'stream';
import { createWriteStream } from 'fs';
import latex from 'node-latex';

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

// Add explicit route for root path
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/home_page.html'));
});

interface RivetResponse {
    message: string;
}

async function runRivetGraph(prompt: string, JobOffer: string, html_l: boolean): Promise<RivetResponse> {
    const project = path.join(__dirname, '../am-Ia.rivet-project');
    
    const result = await runGraphInFile(project, {
        graph: "App/OpenAI",
        remoteDebugger: debuggerServer,
        inputs: { 
            Message: prompt,
            JobOffers: JobOffer,
            html_format: html_l
        },
        settings: {openAiEndpoint: 'https://api.openai.com/v1/chat/completions'},
        openAiKey: process.env.API_KEY as string 
    } as RunGraphOptions);

    // The response will be HTML code when html_l is true
    return {
        message: result?.Answer?.value?.toString() ?? "No response"
    };
}

app.post('/api/html', async (req, res) => {
    const { prompt, JobOffers, layout } = req.body;
    
    if (!prompt || !JobOffers) {
        return res.status(400).json({ error: "Prompt and JobOffers are required" });
    }

    try {
        const response = await runRivetGraph(prompt, JobOffers, layout);
        res.json(response);
    } catch (error) {
        console.error("Error processing request:", error);
        res.status(500).json({ 
            error: "Failed to process request",
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

// Function to compile LaTeX to PDF using node-latex
async function compileLaTeXToPDF(latexContent: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        // Create a readable stream from the LaTeX content
        const input = Readable.from(latexContent);
        
        // Create a write stream for error logs
        const errorLogStream = createWriteStream(path.join(__dirname, '../latex_errors.log'));
        
        // Configure node-latex with the correct path to pdflatex
        const options = {
            cmd: 'C:\\Users\\User\\AppData\\Local\\Programs\\MiKTeX\\miktex\\bin\\x64\\pdflatex.exe',
            errorLogs: errorLogStream
        };
        
        const output = latex(input, options);
        const chunks: Buffer[] = [];

        output.on('data', (chunk: Buffer) => {
            chunks.push(chunk);
        });

        output.on('end', () => {
            errorLogStream.end(); // Close the error log stream
            resolve(Buffer.concat(chunks));
        });

        output.on('error', (err: Error) => {
            console.error('LaTeX compilation error:', err);
            errorLogStream.end(); // Close the error log stream
            reject(err);
        });
    });
}

// Route for PDF generation
app.post('/api/generate-pdf', async (req, res) => {
    console.log('Route /generate-pdf was hit');
    try {
        const { latex: latexContent } = req.body;

        if (!latexContent) {
            return res.status(400).send('LaTeX input is required.');
        }

        const pdfBuffer = await compileLaTeXToPDF(latexContent);

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

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
