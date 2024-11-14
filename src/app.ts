import express, { Express } from 'express';
import BodyParser from 'body-parser';
import { join } from 'path';
import { Client, Connection } from '@temporalio/client';
import { manuscriptDataSchema } from './form-validation';
import { config } from './config';

const app: Express = express();

app.use(express.json());
app.use(BodyParser.urlencoded());

app.get('/', (_, res) => {
  res.sendFile(join(__dirname, 'tmp.html'));
});

app.get('/input', (_, res) => {
  res.sendFile(join(__dirname, 'index.html'));
});

app.post('/input', async (req, res) => {
  const input = JSON.parse(req.body.manuscript.data);
  // this is not destructured because for some reason that removes the type from the value property and marks it as an any
  const validationResult = manuscriptDataSchema.validate(input, { abortEarly: false, allowUnknown: true });
  // type for value only exists if its inside this check
  if (validationResult.error === undefined) {
    // eslint-disable-next-line no-console
    console.log(`received form response: ${JSON.stringify(validationResult.value)}`);

    const connection = await Connection.connect({
      address: config.temporalServer,
    });

    const client = new Client({
      connection,
      namespace: config.temporalNamespace,
    });
    // send to temporal
    await client.workflow.start('importManuscriptData', {
      taskQueue: config.temporalTaskQueue,
      workflowId: 'your-workflow-id',
      args: [
        validationResult.value,
      ],
    })
      .then((result) => `${config.temporalUi}/namespaces/${config.temporalNamespace}/workflows/${result.workflowId}/${result.firstExecutionRunId}`)
      .then((url) => res.status(200).send(`Import started <a href="${url}">${url}</a>`))
      .catch((error) => {
        // eslint-disable-next-line no-console
        console.error('An error occurred while starting the workflow', error);
        return res.status(500).send(`An error occurred while processing your request: ${error instanceof Error ? error.message : 'Unknown error'}.`);
      });
  } else {
    res.status(400).send({
      result: false,
      message: 'validation failed',
      error: validationResult.error,
      warning: validationResult.warning,
    });

    // eslint-disable-next-line no-console
    console.error('validation failed for preprint', { error: JSON.stringify(validationResult.error, null, 4), warning: validationResult.warning });
  }
});

app.get('/ping', (_, res) => {
  res.send('pong');
});

export default app;
