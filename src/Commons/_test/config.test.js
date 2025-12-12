describe('Commons - config', () => {
  const OLD_ENV = process.env;

  afterAll(() => {
    process.env = OLD_ENV;
  });

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV };
  });

  it('should set localhost when NODE_ENV !== production', () => {
    process.env.NODE_ENV = 'development';
    const config = require('../config');
    expect(config.app.host).toBe('localhost');
  });

  it('should set 0.0.0.0 when NODE_ENV === production', () => {
    process.env.NODE_ENV = 'production';
    const config = require('../config');
    expect(config.app.host).toBe('0.0.0.0');
  });
});
