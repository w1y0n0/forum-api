const InvariantError = require('../../../Commons/exceptions/InvariantError');
const AuthenticationsTableTestHelper = require('../../../../tests/AuthenticationsTableTestHelper');
const pool = require('../../database/postgres/pool');
const AuthenticationRepositoryPostgres = require('../AuthenticationRepositoryPostgres');

describe('AuthenticationRepositoryPostgres', () => {
  afterAll(async () => {
    await pool.end();
  });

  afterEach(async () => {
    await AuthenticationsTableTestHelper.cleanTable();
  });

  describe('addToken function', () => {
    it('should persist token to database correctly', async () => {
      // Arrange
      const authenticationRepository = new AuthenticationRepositoryPostgres(pool);
      const token = 'token-sample';

      // Action
      await authenticationRepository.addToken(token);

      // Assert
      const tokens = await AuthenticationsTableTestHelper.findToken(token);
      expect(tokens).toHaveLength(1);
      expect(tokens[0].token).toBe(token);
    });
  });

  describe('checkAvailabilityToken function', () => {
    it('should throw InvariantError if token not available', async () => {
      // Arrange
      const authenticationRepository = new AuthenticationRepositoryPostgres(pool);
      const token = 'token';

      // Action & Assert
      await expect(authenticationRepository.checkAvailabilityToken(token))
        .rejects.toThrow(InvariantError);
    });

    it('should not throw InvariantError if token available', async () => {
      // Arrange
      const authenticationRepository = new AuthenticationRepositoryPostgres(pool);
      const token = 'token';
      await AuthenticationsTableTestHelper.addToken(token);

      // Action & Assert
      await expect(authenticationRepository.checkAvailabilityToken(token))
        .resolves.not.toThrow(InvariantError);
    });
  });

  describe('deleteToken', () => {
    it('should delete token from database', async () => {
      // Arrange
      const authenticationRepository = new AuthenticationRepositoryPostgres(pool);
      const token = 'token';
      await AuthenticationsTableTestHelper.addToken(token);

      // Action
      await authenticationRepository.deleteToken(token);

      // Assert
      const tokens = await AuthenticationsTableTestHelper.findToken(token);
      expect(tokens).toHaveLength(0);
    });
  });
});
