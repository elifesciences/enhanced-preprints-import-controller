import express, { Express } from 'express';
import { join } from 'path';

const app: Express = express();
const port = process.env.PORT || 3000;

app.get('/', (_, res) => {
  // serve the form as html file
  res.sendFile(join(__dirname, 'tmp.html'));
});

app.post('/input', (req, res) => {
  console.log(`received form reponse: ${req.body}`)
  // validate
  // send to temporal
  res.send('import successful');
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
