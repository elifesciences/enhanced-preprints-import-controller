import express, { Express } from 'express';
import BodyParser from 'body-parser';
import { Client, Connection } from '@temporalio/client';
import { randomBytes } from 'node:crypto';
import { manuscriptDataSchema, scriptFormSchema } from './form-validation';
import { config } from './config';
import { generateForm, generateScriptForm } from './form';
import { prepareManuscript } from './manuscriptData';

const app: Express = express();

app.use(express.json());
app.use(BodyParser.urlencoded());

app.get('/', (_, res) => {
  res.send(generateScriptForm());
});

app.get('/input', (_, res) => {
  res.send(generateForm());
});

app.post('/script', async (req, res) => {
  const validationResult = scriptFormSchema.validate(req.body, { abortEarly: false, allowUnknown: true });

  if (validationResult.error === undefined) {
    const {
      msid,
      datePublished,
      evaluationSummaryId,
      peerReviewId,
      authorResponseId,
    } = validationResult.value;

    await prepareManuscript(
      msid,
      datePublished,
      evaluationSummaryId,
      ['anonymous'],
      peerReviewId,
      authorResponseId,
    ).then((manuscript) => res.send(
      generateForm(JSON.stringify(manuscript, undefined, 2)),
    )).catch((err) => {
      res.status(400).send('Bad Request');

      // eslint-disable-next-line no-console
      console.error(`script error: ${JSON.stringify(err)}`);
    });
  } else {
    res.status(400).send({
      result: false,
      message: 'validation failed',
      error: validationResult.error,
      warning: validationResult.warning,
    });

    // eslint-disable-next-line no-console
    console.error('validation failed for script form', { error: JSON.stringify(validationResult.error, null, 4), warning: validationResult.warning });
  }
});

app.post('/input', async (req, res) => {
  const input = JSON.parse(req.body.manuscript.data);
  const namespace = req.body.temporalNamespace;
  if (!namespace || namespace.length === 0) {
    res.status(400).send({
      result: false,
      message: 'missing namespace',
    });

    // eslint-disable-next-line no-console
    console.error('namespace was not provided');
    return;
  }

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
      namespace,
    });
    // send to temporal
    await client.workflow.start('importManuscriptData', {
      taskQueue: config.temporalTaskQueue,
      workflowId: [
        'import',
        validationResult.value.id,
        (new Date()).toISOString().replace(/[-:.TZ]/g, '').slice(0, 15),
        randomBytes(4).toString('hex'),
      ].join('-'),
      args: [
        validationResult.value,
      ],
    })
      .then((result) => `${config.temporalUi}/namespaces/${namespace}/workflows/${result.workflowId}/${result.firstExecutionRunId}`)
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
