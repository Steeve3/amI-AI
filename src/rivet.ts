import express, { Request, Response, RequestHandler } from 'express';
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

interface RivetResponse {
    message: string;
}

interface ChatResponse {
    response: string;
    monologue: string;
    cvData?: string;
}

// Define request body interfaces
interface HtmlRequestBody {
    prompt: string;
    JobOffers: string;
    layout: boolean;
}

interface ChatRequestBody {
    message: string;
    cvContent: string;
}

interface PdfRequestBody {
    latex: string;
}

// Store conversation history
let conversationHistory: { role: string; content: string }[] = [];

// Add explicit route for root path
app.get('/', ((_req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, '../public/home_page.html'));
}) as RequestHandler);

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
        openAiKey: process.env.OPENAI_API_KEY as string 
    } as RunGraphOptions);

    return {
        message: result?.Answer?.value?.toString() ?? "No response"
    };
}

async function runChatGraph(message: string, cvContent: string) {
    const project = path.join(__dirname, '../am-Ia.rivet-project');
    
    const result = await runGraphInFile(project, {
        graph: "App/ChatforCV",
        remoteDebugger: debuggerServer,
        inputs: { 
            userMessage: message,
            userCVData: cvContent,
            conversationHistory: JSON.stringify(conversationHistory) // server save chat hystory
        },
        settings: {openAiEndpoint: 'https://api.openai.com/v1/chat/completions'},
        openAiKey: process.env.OPENAI_API_KEY as string 
    } as RunGraphOptions);

    // Extract response type and data
    const { output } = result;
    console.log(result)
    return {
        monologue: result?.innerMonologue?.value?.toString() ?? "No response", 
        response: result?.aiResponse?.value?.toString() ?? "No response"
    }
}

app.post('/api/chat', ((req: Request<{}, {}, ChatRequestBody>, res: Response) => {
    const { message, cvContent } = req.body;
    
    if (!message || !cvContent) {
        res.status(400).json({ error: "Message and CV content are required" });
        return;
    }

    runChatGraph(message, cvContent)
        .then(response => {
            // Update conversation history
            conversationHistory.push({ role: 'user', content: message });
            conversationHistory.push({ role: 'assistant', content: response.response });
            
            res.json(response);
        })
        .catch(error => {
            console.error("Error processing chat request:", error);
            res.status(500).json({ 
                error: "Failed to process chat request",
                details: error instanceof Error ? error.message : 'Unknown error'
            });
        });
}) as RequestHandler);

app.post('/api/html', ((req: Request<{}, {}, HtmlRequestBody>, res: Response) => {
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
}) as RequestHandler);

// Function to compile LaTeX to PDF using node-latex
async function compileLaTeXToPDF(latexContent: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        const input = Readable.from(latexContent);
        const errorLogStream = createWriteStream(path.join(__dirname, '../latex_errors.log'));
        
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
            errorLogStream.end();
            resolve(Buffer.concat(chunks));
        });

        output.on('error', (err: Error) => {
            console.error('LaTeX compilation error:', err);
            errorLogStream.end();
            reject(err);
        });
    });
}

app.post('/api/generate-pdf', ((req: Request<{}, {}, PdfRequestBody>, res: Response) => {
    console.log('Route /generate-pdf was hit');
    
    const { latex: latexContent } = req.body;

    if (!latexContent) {
        res.status(400).send('LaTeX input is required.');
        return;
    }

    compileLaTeXToPDF(latexContent)
        .then(pdfBuffer => {
            res.set({
                'Content-Type': 'application/pdf',
                'Content-Disposition': 'attachment; filename="output.pdf"',
                'Content-Length': pdfBuffer.length,
            });
            res.send(pdfBuffer);
        })
        .catch(error => {
            console.error('Error generating PDF:', error);
            res.status(500).send('An error occurred while generating the PDF.');
        });
}) as RequestHandler);

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
