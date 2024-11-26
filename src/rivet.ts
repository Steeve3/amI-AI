import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { runGraphInFile, startDebuggerServer, RunGraphOptions } from '@ironclad/rivet-node';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

const debuggerServer = startDebuggerServer({
    port: 3001, // Optional: default 21888
  });

app.use(express.static(path.join(__dirname, '../public')));
app.use(express.json());

async function runRivetGraph(prompt, context) {
    const project = path.join(__dirname, '../am-Ia.rivet-project');
    
    const result = await runGraphInFile(project, {
        graph: "App/LLM_Studio_v1.0",
        remoteDebugger: debuggerServer,
        inputs: { Message: prompt },
        context: { userContext: context },
        settings: {openAiEndpoint: 'http://localhost:1234/v1/chat/completions'}
    }as RunGraphOptions);

    return {
        
        message: result?.Answer?.value ?? "No response"
    };
}

app.post('/api/message', async (req, res) => {
    const { prompt, context = 'conversation' } = req.body;
    
    if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
    }

    try {
        const response = await runRivetGraph(prompt, context);
        res.json({ ...response, context });
    } catch (error) {
        console.error("Error processing request:", error);
        res.status(500).json({ 
            error: "Failed to process request",
            details: error.message 
        });
    }
});

const server = app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});