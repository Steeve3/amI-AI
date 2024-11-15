import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { runGraphInFile, startDebuggerServer, NodeDatasetProvider } from '@ironclad/rivet-node';
// Define __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = process.env.PORT || 3000;
// Rest of your code...
async function startServer() {
    // Serve static files from the "public" directory
    app.use(express.static(path.join(__dirname, '../public')));
    // Example API route that interacts with the Rivet functionality
    app.get('/api/message', async (req, res) => {
        try {
            const debuggerServer = await startDebuggerServer({});
            const project = "./am-Ia.rivet-project";
            const graph = "App/LLM Studio";
            const openAiKey = process.env.OPEN_API_KEY;
            const datasetOptions = { save: true, filePath: project };
            const datasetProvider = await NodeDatasetProvider.fromProjectFile(project, datasetOptions);
            const result = await runGraphInFile(project, {
                graph,
                remoteDebugger: debuggerServer,
                inputs: { Message: "Please write me a short poem about a fish." },
                context: {},
                externalFunctions: {},
                onUserEvent: {},
                openAiKey,
                datasetProvider
            });
            res.json({ message: result.Answer.value });
        }
        catch (error) {
            console.error("Error running graph:", error);
            res.status(500).json({ error: "Failed to run graph" });
        }
    });
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '../public/index.html'));
    });
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}
startServer().catch((error) => {
    console.error("Failed to start server:", error);
    process.exit(1);
});
//# sourceMappingURL=rivet.js.map