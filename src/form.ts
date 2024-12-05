import { config } from './config';

export const generateForm = (defaultValue?: string) => (`
  <!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Import Manuscript</title>
    </head>
    <body>
      
      <form action="/input" method="post">
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
    </form>
    
    </body>
  </html>
`);

export const generateScriptForm = () => (
  `
  <!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Import Manuscript</title>
    </head>
    <body>
      
      <form action="/script" method="post">
        <h2>Manuscript Data</h2>
        <label for="msid">MSID:</label>
        <input id="msid" name="msid" required/>
        <label for="datePublished">Date:</label>
        <input id="datePublished" name="datePublished" required/>
        <label for="evaluation-summary-id">Evaluation Summary ID:</label>
        <input id="evaluation-summary-id" name="evaluationSummaryId" required/>
        <label for="peer-review-id">Peer Review ID:</label>
        <input id="peer-review-id" name="peerReviewId" required/>
        <label for="author-response-id">Author Response ID:</label>
        <input id="author-response-id" name="authorResponseId"/>

        <br/>
    
        <button type="submit">Submit</button>
    </form>

    </body>
  </html>`
);
