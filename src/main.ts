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
  // eslint-disable-next-line no-console
  console.log(`received form response: ${JSON.stringify(form)}`);
  // validate

  const client = new Client();
  const manuscriptData = JSON.parse(form.manuscript.data) as ManuscriptData;

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
      // eslint-disable-next-line no-console
      console.error('An error occurred while starting the workflow', error);
      return res.status(500).send(`An error occurred while processing your request: ${error instanceof Error ? error.message : 'Unknown error'}.`);
    });
});

app.get('/ping', (_, res) => {
  res.send('pong');
});

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
