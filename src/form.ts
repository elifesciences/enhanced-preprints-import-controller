import { config } from './config';

export const htmlPage = (title: string, content: string) => (`
  <!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <link rel="stylesheet" href="https://unpkg.com/axist@latest/dist/axist.min.css" />
    </head>
    <body>
      ${content}
    </body>
  </html>
`);

export const generateImportDocmapForm = () => htmlPage(
  'Import Docmap',
  `<form action="/import-docmap" method="post">
    <h2>Import Docmap</h2>
    <p>
      <label for="docmap">Docmap:</label>
      <input id="docmap" name="docmap" required/>
    </p>
    <p>
      <label for="temporal_namespace">Select a Namespace:</label>
      <select id="temporal_namespace" name="temporalNamespace" required>
        <option value="" disabled selected hidden>-- Please choose an option --</option>
        ${config.temporalNamespace.split(',').map((ns) => `<option value="${ns}">${ns}</option>`).join('\n')}
      </select>
    </p>
    <p>
      <button type="submit">Submit</button>
    </p>
  </form>`,
);

export const generateManuscriptDataForm = (defaultValue?: string) => htmlPage(
  'Import Manuscript',
  `<form action="/manuscript-data" method="post">
    <h2>Manuscript Data</h2>
    <p>
    <label for="manuscript-data">Input JSON:</label>
  <textarea id="manuscript-data" style="width: 600px; height: 280px;" name="manuscript[data]" required>${defaultValue ?? JSON.stringify({
    id: '[ID]',
    versions: [],
  }, undefined, 2)}</textarea>
    </p>
    <p>
      <label for="temporal_namespace">Select a Namespace:</label>
      <select id="temporal_namespace" name="temporalNamespace" required>
        <option value="" disabled selected hidden>-- Please choose an option --</option>
        ${config.temporalNamespace.split(',').map((ns) => `<option value="${ns}">${ns}</option>`).join('\n')}
      </select>
    </p>
    <p>
      <button type="submit">Submit</button>
    </p>
  </form>`,
);

export const generateManuscriptDataTwoStepsAllEvaluationsForm = () => htmlPage(
  'Import Manuscript (2 steps) - Biophysics Colab only',
  `<form action="/manuscript-data-two-steps-all-evaluations" method="post">
    <h2>Manuscript Data (2 steps)</h2>
    <p><em>Biophysics Colab only</em></p>
    <p>
      <label for="msid">MSID:</label>
      <input id="msid" name="msid" required/>
    </p>
    <p>
      <label for="override-preprints">Biorxiv Preprint versions (comma separated. e.g. "1,2"):</label>
      <input id="override-preprints" name="overridePreprints"/>
    </p>
    <p>
      <label for="date-published">Published Date for Reviewed version (YYYY-MM-DD):</label>
      <input id="date-published" name="datePublished" required/>
    </p>
    <p>
      <label for="date-revised">Published Date for Curated version (YYYY-MM-DD):</label>
      <input id="date-revised" name="dateCurated" required/>
    </p>
    <p>
      <label for="peer-review-id">Report ID (peer-review):</label>
      <input id="peer-review-id" name="peerReviewId" required/>
    </p>
    <p>
      <label for="author-response-id">Final Response ID (author-response):</label>
      <input id="author-response-id" name="authorResponseId"/>
    </p>
    <p>
      <label for="evaluation-summary-id">Evaluation ID (evaluation-summary):</label>
      <input id="evaluation-summary-id" name="evaluationSummaryId" required/>
    </p>
    <p>
      <button type="submit">Submit</button>
    </p>
  </form>`,
);
