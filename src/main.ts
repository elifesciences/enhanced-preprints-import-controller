import express, { Express } from 'express';
import { join } from 'path';
import { parser } from '@elifesciences/docmap-ts';

const app: Express = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.get('/', (_, res) => {
  res.sendFile(join(__dirname, 'tmp.html'));
});

app.post('/input', (req, res) => {
  const form: parser.ManuscriptData = req.body;
  console.log(`received form reponse: ${form}`)
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
