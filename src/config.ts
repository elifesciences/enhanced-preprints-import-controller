import { env } from 'process';

export const config = {
  temporalNamespace: env.TEMPORAL_NAMESPACE || 'default',
  temporalUi: env.TEMPORAL_UI || 'http://localhost:8233',
  temporalServer: env.TEMPORAL_SERVER || 'localhost:7233',
  temporalTaskQueue: env.TEMPORAL_TASK_QUEUE || 'epp',
  serverPort: env.SERVER_PORT ?? 5000,
};
