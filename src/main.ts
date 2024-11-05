import express, { Express } from 'express';
import { join } from 'path';
import BodyParser from 'body-parser';
import { Client } from '@temporalio/client';
import { ManuscriptData } from '@elifesciences/docmap-ts';

const app: Express = express();
const port = process.env.PORT || 5000;

app.use(express.json());
app.use(BodyParser.urlencoded());

app.get('/', (_, res) => {
  res.sendFile(join(__dirname, 'tmp.html'));
});

app.get('/input', (_, res) => {
  res.sendFile(join(__dirname, 'index.html'));
});

app.post('/input', async (req, res) => {
  const form = req.body;
  console.log(`received form response: ${JSON.stringify(form)}`);
  // validate

  const client = new Client();
  const manuscriptData: ManuscriptData = {
    id: form.id,
    versions: [],
  };
  
  // send to temporal
  try {
    const workflow = await client.workflow.start('importManuscriptData', {
      taskQueue: 'epp',
      workflowId: 'your-workflow-id',
      args: [
        manuscriptData,
      ],
    });
    res.send(`import started http://localhost:8233/namespaces/default/workflows/${workflow.workflowId}/${workflow.firstExecutionRunId}`);
} catch (error) {
    console.error("An error occurred while starting the workflow: ", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    res.status(500).send( `An error occurred while processing your request: ${errorMessage}`);
  }
});

app.get('/previous-imports', (_, res) => {
  // retrieve list of previous successful imports
  res.send([]);
});

app.get('/previous-import/:id', (req, res) => {
  // retrieve previous import and send to browser
  console.log(`retrieving records for import: ${req.params.id}`)
  res.send({});
});

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`)
});
