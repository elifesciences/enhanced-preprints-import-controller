import { config } from './config';
import app from './app';

const port = config.serverPort;

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
