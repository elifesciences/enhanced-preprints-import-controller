import { env } from 'process';

export const config = {
  temporalServer: env.TEMPORAL_SERVER || 'http://localhost:8233',
  temporalTaskQueue: env.TEMPORAL_TASK_QUEUE || 'epp',
  serverPort: env.SERVER_PORT ?? 5000,
};
