import express, { Express } from 'express';
import { join } from 'path';
import BodyParser from 'body-parser';
import { Client } from '@temporalio/client';

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
  // send to temporal
  const client = new Client();
  const workflow = await client.workflow.start('importManuscriptData', {
    taskQueue: 'epp',
    workflowId: 'your-workflow-id',
    args: [
      {}
    ]
  });
  res.send(`import started ${workflow.workflowId} ${workflow.firstExecutionRunId}`);
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
