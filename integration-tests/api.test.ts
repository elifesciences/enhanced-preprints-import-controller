// eslint-disable-next-line import/no-extraneous-dependencies
import request from 'supertest';
import app from '../src/app';
import { requiredManuscriptData } from '../src/mocks/validation-mocks';

const workflowMock = jest.fn();

jest.mock('@temporalio/client', () => ({
  Client: jest.fn().mockImplementation(() => ({
    workflow: {
      start: workflowMock,
    },
  })),
  Connection: {
    connect: jest.fn().mockResolvedValue(true),
  },
}));

describe('import-controller api tests', () => {
  afterEach(() => {
    workflowMock.mockRestore();
  });

  describe('GET /', () => {
    it('returns the "hello, world!" page', async () => {
      await request(app)
        .get('/')
        .expect(200)
        .expect('Content-Type', 'text/html; charset=UTF-8')
        .expect((response) => {
          expect(response.text).toContain('Hello, World!');
        });
    });
  });

  describe('GET /ping', () => {
    it('returns the text "pong"', async () => {
      await request(app)
        .get('/ping')
        .expect(200, 'pong');
    });
  });

  describe('GET /input', () => {
    it('returns the form page', async () => {
      await request(app)
        .get('/input')
        .expect(200)
        .expect('Content-Type', 'text/html; charset=utf-8')
        .expect((response) => {
          expect(response.text).toContain('<label for="manuscript-data">Input JSON:</label>');
        });
    });
  });

  describe('POST /input', () => {
    it('validates form input', async () => {
      workflowMock.mockResolvedValue({
        workflowId: 1234,
        firstExecutionRunId: 4321,
      });

      const url = 'http://localhost:8233/namespaces/foo/workflows/1234/4321';

      await request(app)
        .post('/input')
        .send({ manuscript: { data: JSON.stringify(requiredManuscriptData) }, temporalNamespace: 'foo' })
        .expect(200, `Import started <a href="${url}">${url}</a>`);
    });

    it('returns 400 if namespace is not provided', async () => {
      await request(app)
        .post('/input')
        .send({ manuscript: { data: JSON.stringify({ foo: 'bar' }) }})
        .expect(400)
        .expect((response) => expect(response.body.message).toStrictEqual('missing namespace'));
    });

    it('returns 400 if the form will not validate', async () => {
      await request(app)
        .post('/input')
        .send({ manuscript: { data: JSON.stringify({ foo: 'bar' }) }, temporalNamespace: 'foo' })
        .expect(400)
        .expect((response) => expect(response.body.message).toStrictEqual('validation failed'));
    });

    it('returns 500 if there is an error with temporal', async () => {
      workflowMock.mockRejectedValue(false);

      await request(app)
        .post('/input')
        .send({ manuscript: { data: JSON.stringify(requiredManuscriptData) }, temporalNamespace: 'foo' })
        .expect(500, 'An error occurred while processing your request: Unknown error.');
    });
  });
});
