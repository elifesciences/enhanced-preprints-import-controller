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

export const generateForm = (defaultValue?: string) => htmlPage(
  'Import Manuscript',
  `<form action="/input" method="post">
    <h2>Manuscript Data</h2>
    <label for="manuscript-data">Input JSON:</label>
    <textarea id="manuscript-data" style="width: 600px; height: 280px;" name="manuscript[data]" required>
    ${defaultValue ?? JSON.stringify({
      id: '[ID]',
      versions: [],
    }, undefined, 2)}</textarea>
    <br/>
    <label for="temporal_namespace">Select a Namespace:</label>
    <select id="temporal_namespace" name="temporalNamespace" required>
        <option value="" disabled selected hidden>-- Please choose an option --</option>
        ${config.temporalNamespace.split(',').map((ns) => `<option value="${ns}">${ns}</option>`).join('\n')}
    </select>
    <br><br>

    <button type="submit">Submit</button>
  </form>`
);

export const generateScriptForm = () => htmlPage(
  '',
  `<form action="/script" method="post">
    <h2>Manuscript Data</h2>
    <label for="msid">MSID:</label>
    <input id="msid" name="msid" required/><br />
    <label for="override-preprints">Override Biorxiv Preprint:</label>
    <input id="override-preprints" name="overridePreprints"/><br />
    <label for="date-published">Published Date:</label>
    <input id="date-published" name="datePublished" required/><br />
    <label for="date-revised">Revised Date:</label>
    <input id="date-revised" name="dateRevised"/><br />
    <label for="evaluation-summary-id">Evaluation Summary ID:</label>
    <input id="evaluation-summary-id" name="evaluationSummaryId" required/><br />
    <label for="peer-review-id">Peer Review ID:</label>
    <input id="peer-review-id" name="peerReviewId"/><br />
    <label for="author-response-id">Author Response ID:</label>
    <input id="author-response-id" name="authorResponseId"/>

    <br/>

    <button type="submit">Submit</button>
  </form>`,
);
