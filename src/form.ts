import { config } from './config';

export const generateForm = () => (`
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
    {
      "id": "[ID]",
      "versions": []
    }
        </textarea>
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
