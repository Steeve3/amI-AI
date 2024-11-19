import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { runGraphInFile, startDebuggerServer, NodeDatasetProvider } from '@ironclad/rivet-node';
// Define __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = process.env.PORT || 3001;
const DEBUGGER_PORT = 21889; // Different port for debugger server
// Middleware to serve static files and parse JSON requests
app.use(express.static(path.join(__dirname, '../public')));
app.use(express.json()); // Parse JSON bodies for POST requests
// Helper function to create debugger server with retry logic
async function createDebuggerServer(retryCount = 0, maxRetries = 3) {
    try {
        return await startDebuggerServer({
            port: DEBUGGER_PORT + retryCount, // Increment port on retry
        });
    }
    catch (error) {
        if (error.code === 'EADDRINUSE' && retryCount < maxRetries) {
            console.log(`Debugger port ${DEBUGGER_PORT + retryCount} in use, trying next port...`);
            return createDebuggerServer(retryCount + 1, maxRetries);
        }
        throw error;
    }
}
// Helper function to run the graph with standardized input and output handling
async function executeGraph(prompt, context) {
    let debuggerServer;
    try {
        debuggerServer = await createDebuggerServer();
        const project = path.join(__dirname, '../am-Ia.rivet-project');
        const graph = "App/LLM Studio";
        const openAiKey = process.env.OPEN_API_KEY;
        const datasetOptions = { save: true, filePath: project };
        const datasetProvider = await NodeDatasetProvider.fromProjectFile(project, datasetOptions);
        // Execute graph
        const result = await runGraphInFile(project, {
            graph,
            remoteDebugger: debuggerServer,
            inputs: { Message: prompt },
            context: { userContext: context },
            externalFunctions: {},
            onUserEvent: {},
            openAiKey,
            datasetProvider
        });
        // Return formatted response
        return {
            message: result?.Answer?.value || "No response",
            suggestions: result?.suggestions?.value || [],
            nextSteps: result?.nextSteps?.value || []
        };
    }
    finally {
        // Ensure debugger server is properly closed
        if (debuggerServer) {
            try {
                await debuggerServer.close();
            }
            catch (error) {
                console.error('Error closing debugger server:', error);
            }
        }
    }
}
// Enhanced API route for continuous conversation
app.post('/api/message', async (req, res) => {
    const { prompt, context = 'conversation' } = req.body;
    try {
        const response = await executeGraph(prompt, context);
        res.json({ ...response, context });
    }
    catch (error) {
        console.error("Error running graph:", error);
        res.status(500).json({
            error: "Failed to process request",
            details: error.message
        });
    }
});
// Start server with improved error handling
let serverStarted = false;
const server = app.listen(PORT)
    .on('listening', () => {
    serverStarted = true;
    console.log(`Server running on http://localhost:${PORT}`);
})
    .on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Please try a different port or close the running server.`);
    }
    else {
        console.error('Error starting server:', err);
    }
    process.exit(1);
});
// Graceful shutdown handling
const shutdown = async () => {
    console.log('Shutdown signal received...');
    if (serverStarted) {
        await new Promise((resolve) => {
            server.close(() => {
                console.log('HTTP server closed');
                resolve();
            });
        });
    }
    process.exit(0);
};
// Handle various shutdown signals
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
process.on('uncaughtException', (err) => {
    console.error('Uncaught exception:', err);
    shutdown();
});
//# sourceMappingURL=rivet.js.map