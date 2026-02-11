import express, { Express } from 'express';
import BodyParser from 'body-parser';
import { Client, Connection } from '@temporalio/client';
import { randomBytes } from 'node:crypto';
import {
  importDocmapFormSchema,
  manuscriptDataHelperFormSchema,
  manuscriptDataSchema,
} from './form-validation';
import { config } from './config';
import {
  generateImportDocmapForm,
  generateManuscriptDataForm,
  generateManuscriptDataHelperForm,
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
    <li><a href="/manuscript-data-helper-form">Import Manuscript Data (3 steps)</a> - <em>Biophysics Colab only</em></li>
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
      workflowIdPrefix,
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
        workflowIdPrefix ?? 'import',
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

app.get('/manuscript-data-helper-form', (req, res) => {
  const { versions: versionsRaw } = req.query as { versions?: string };
  if (versionsRaw !== undefined) {
    const versions = parseInt(versionsRaw, 10);
    res.send(generateManuscriptDataHelperForm(Number.isNaN(versions) ? 1 : versions));
  } else {
    res.send(htmlPage(
      'Import Manuscript Data - Biophysics Colab only',
      `<h2>Manuscript Data</h2>
      <p><em>Biophysics Colab only (Step 1 of 3)</em></p>
      <form action="/manuscript-data-helper-form" method="get">
        <p>
          <label>Versions: <input type="number" name="versions" value="1" placeholder="1" min="1" step="1" required/></label>
        </p>
        <p>
          <button type="submit">Submit</button>
        </p>
      </form>`,
    ));
  }
});

app.post('/manuscript-data-helper-form', async (req, res) => {
  const validationResult = manuscriptDataHelperFormSchema.validate(req.body, { abortEarly: false, allowUnknown: true });

  if (validationResult.error === undefined) {
    const { msid } = validationResult.value;
    const doiPrefix = `10.63204/${msid}`;
    const versions = await prepareManuscript(validationResult.value, doiPrefix);

    const allErrors = versions.reduce((all: string[], { errors }) => ([...all, ...errors ?? []]), []);

    if (allErrors.length > 0) {
      res.status(422).send(htmlPage('Unprocessable Content', JSON.stringify({
        result: false,
        message: 'unprocessable content',
        error: allErrors.join(', '),
        warning: undefined,
      }, undefined, 2)));
    } else {
      const vorDates = validationResult.value.versions
        .filter(({ vor, reviewed }) => vor && reviewed)
        .map(({ reviewed }) => reviewed);
      // Use the first VOR date as manuscript publishDate, otherwise use first reviewed preprint date.
      const [firstPublishedDate] = vorDates.length > 0 ? vorDates : versions
        .map(({ publishedDate }) => publishedDate)
        .filter((publishedDate) => typeof publishedDate === 'string');
      const volume = vorDates.length > 0 ? vorDates
        .filter((vorDate) => vorDate !== undefined)
        .map((vorDate) => new Date(vorDate).getFullYear() - 2025 + 1)
        .reduce((a, b) => (a < 1 ? Math.max(1, b) : a), 0)
        .toString() : null;
      res.send(
        generateManuscriptDataForm(JSON.stringify({
          id: msid,
          manuscript: {
            eLocationId: msid,
            ...(volume ? { volume } : {}),
            ...(firstPublishedDate ? { publishedDate: firstPublishedDate } : {}),
          },
          versions,
        }, undefined, 2)),
      );
    }
  } else {
    res.status(400).send(htmlPage('Validation Error', JSON.stringify({
      result: false,
      message: 'validation failed',
      error: validationResult.error,
      warning: validationResult.warning,
    }, undefined, 2)));
  }
});

app.get('/manuscript-data', (_, res) => {
  res.send(generateManuscriptDataForm());
});

app.post('/manuscript-data', async (req, res) => {
  const input = JSON.parse(req.body.manuscript.data);
  const namespace = req.body.temporalNamespace;
  const purge = !!req.body.purge;
  const { tenant } = req.body;
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
  const validationResult = manuscriptDataSchema.validate({
    ...input,
    tenant,
    ...(purge ? { purge } : {}),
  }, { abortEarly: false, allowUnknown: true });
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
    const {
      purge: validationResultPurge,
      tenant: validationResultTenant,
      ...validationResultValue
    } = validationResult.value;

    // send to temporal
    await client.workflow.start('importManuscriptData', {
      taskQueue: config.temporalTaskQueue,
      workflowId: [
        'import',
        validationResultValue.id,
        (new Date()).toISOString().replace(/[-:.TZ]/g, '').slice(0, 15),
        randomBytes(4).toString('hex'),
      ].join('-'),
      args: [
        {
          data: validationResultValue,
          ...(validationResultPurge || validationResultTenant ? {
            workflowArgs: {
              ...(validationResultPurge ? { purgeBeforeImport: true } : {}),
              ...(validationResultTenant ? { siteName: validationResultTenant } : {}),
            },
          } : {}),
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
