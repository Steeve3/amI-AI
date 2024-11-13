import { runGraphInFile, startDebuggerServer, NodeDatasetProvider , RunGraphOptions } from '@ironclad/rivet-node';
// Start debugger server
const debuggerServer = await startDebuggerServer({});

let project = "./example.rivet-project";
let graph = "example-graph";

// Get OPEN_API_KEY from environment
let openAiKey = process.env.OPEN_API_KEY;

// Create a dataset provider
const datasetOptions = {
  save: true,
  filePath: project,
};

const datasetProvider = await NodeDatasetProvider.fromProjectFile(project, datasetOptions);

let result = await runGraphInFile(project, {
    graph: graph,
    remoteDebugger: debuggerServer,
    inputs: {
      "prompt": "Please write me a short poem about a dog."
    },
    context: {},
    externalFunctions: {},
    onUserEvent: {},
    openAiKey: openAiKey,
    datasetProvider: datasetProvider
  } as RunGraphOptions);

// Return graph output of the run
console.log(result.response.value);

// Force the application to exit (otherwise it keeps running as debugger still runs and does not have a close function)
process.exit();
