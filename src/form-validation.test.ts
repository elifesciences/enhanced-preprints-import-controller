import { manuscriptDataSchema } from './form-validation';
import { requiredManuscriptData, optionalManuscriptData } from './mocks/validation-mocks';

describe('form-validation', () => {
  it('validates the required fields', () => {
    const result = manuscriptDataSchema.validate(requiredManuscriptData);

    expect(result.error).toBeUndefined();
    expect(result.warning).toBeUndefined();
    expect(result.value).toStrictEqual(requiredManuscriptData);
  });

  it('validates the optional fields', () => {
    const result = manuscriptDataSchema.validate(optionalManuscriptData);

    expect(result.error).toBeUndefined();
    expect(result.warning).toBeUndefined();
    expect(result.value).toBeTruthy();
  });

  it('errors with an invalid object', () => {
    const result = manuscriptDataSchema.validate({ foo: 'bar' });

    expect(result.error).toBeDefined();
    expect(result.error?.message).toStrictEqual('"id" is required');
  });
});
