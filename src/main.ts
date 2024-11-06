import express, { Express } from 'express';
import { join } from 'path';
import BodyParser from 'body-parser';
import { Client } from '@temporalio/client';
import { ManuscriptData } from '@elifesciences/docmap-ts';
import { config } from './config';

const app: Express = express();
const port = config.serverPort;

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
  await client.workflow.start('importManuscriptData', {
    taskQueue: config.temporalTaskQueue,
    workflowId: 'your-workflow-id',
    args: [
      manuscriptData,
    ],
  })
    .then((result) => `${config.temporalServer}/namespaces/default/workflows/${result.workflowId}/${result.firstExecutionRunId}`)
    .then((url) => res.status(200).send(`Import started <a href="${url}">${url}</a>`))
    .catch((error) => {
      console.error('An error occurred while starting the workflow', error);
      return res.status(500).send(`An error occurred while processing your request: ${error instanceof Error ? error.message : 'Unknown error'}.`);
    });
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
