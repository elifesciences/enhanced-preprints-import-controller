import express, { Express } from 'express';
import BodyParser from 'body-parser';
import { Client, Connection } from '@temporalio/client';
import { randomBytes } from 'node:crypto';
import { importDocmapFormSchema, manuscriptDataSchema, scriptFormSchema } from './form-validation';
import { config } from './config';
import {
  generateImportDocmapForm,
  generateManuscriptDataForm,
  generateManuscriptDataTwoStepsAllEvaluationsForm,
  htmlPage,
} from './form';
import { prepareManuscript } from './manuscriptData';

const app: Express = express();

app.use(express.json());
app.use(BodyParser.urlencoded());

app.get('/', (_, res) => {
  res.send(htmlPage('Import Controller', `
  <ul>
    <li><a href="/import-docmap">Import DocMap</a></li>
    <li><a href="/manuscript-data">Import Manuscript Data</a></li>
    <li><a href="/manuscript-data-two-steps-all-evaluations">Import Manuscript Data (2 steps)</a> - <em>all evaluations attached to all preprints</em></li>
  </ul>
  `));
});

app.get('/import-docmap', (_, res) => {
  res.send(generateImportDocmapForm());
});

app.post('/import-docmap', async (req, res) => {
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

  const validationResult = importDocmapFormSchema.validate(req.body, { abortEarly: false, allowUnknown: true });

  if (validationResult.error === undefined) {
    // eslint-disable-next-line no-console
    console.log(`received form response: ${JSON.stringify(validationResult.value)}`);

    const {
      docmap,
    } = validationResult.value;

    const connection = await Connection.connect({
      address: config.temporalServer,
    });

    const client = new Client({
      connection,
      namespace,
    });
    // send to temporal
    await client.workflow.start('importDocmap', {
      taskQueue: config.temporalTaskQueue,
      workflowId: [
        'import',
        (new Date()).toISOString().replace(/[-:.TZ]/g, '').slice(0, 15),
        randomBytes(4).toString('hex'),
      ].join('-'),
      args: [
        {
          url: docmap,
        },
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
    res.status(400).send(htmlPage('Validation Error', JSON.stringify({
      result: false,
      message: 'validation failed',
      error: validationResult.error,
      warning: validationResult.warning,
    }, undefined, 2)));

    // eslint-disable-next-line no-console
    console.error('validation failed for import docmap form', { error: JSON.stringify(validationResult.error, null, 4), warning: validationResult.warning });
  }
});

app.get('/manuscript-data-two-steps-all-evaluations', (_, res) => {
  res.send(generateManuscriptDataTwoStepsAllEvaluationsForm());
});

app.get('/manuscript-data', (_, res) => {
  res.send(generateManuscriptDataForm());
});

app.post('/manuscript-data-two-steps-all-evaluations', async (req, res) => {
  const validationResult = scriptFormSchema.validate(req.body, { abortEarly: false, allowUnknown: true });

  if (validationResult.error === undefined) {
    const {
      msid,
      overridePreprints,
      datePublished,
      dateRevised,
      evaluationSummaryId,
      peerReviewId,
      authorResponseId,
    } = validationResult.value;

    await prepareManuscript(
      msid,
      overridePreprints ? overridePreprints.split(/[^0-9]+/).filter((p) => p.length > 0) : [],
      [datePublished, dateRevised].filter((d) => d !== undefined).map((d) => new Date(d)),
      evaluationSummaryId,
      ['anonymous'],
      peerReviewId,
      authorResponseId,
    ).then((manuscript) => res.send(
      generateManuscriptDataForm(JSON.stringify(manuscript, undefined, 2)),
    )).catch((err) => {
      const message = err.toString();
      res.status(400).send(htmlPage('Bad Request', `Bad Request: ${message}`));

      // eslint-disable-next-line no-console
      console.error(`script error: ${message}`);
    });
  } else {
    res.status(400).send(htmlPage('Validation Error', JSON.stringify({
      result: false,
      message: 'validation failed',
      error: validationResult.error,
      warning: validationResult.warning,
    }, undefined, 2)));

    // eslint-disable-next-line no-console
    console.error('validation failed for script form', { error: JSON.stringify(validationResult.error, null, 4), warning: validationResult.warning });
  }
});

app.post('/manuscript-data', async (req, res) => {
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
        {
          data: validationResult.value,
        },
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
