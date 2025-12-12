const UserRepository = require('../../../Domains/users/UserRepository');
const AuthenticationRepository = require('../../../Domains/authentications/AuthenticationRepository');
const AuthenticationTokenManager = require('../../security/AuthenticationTokenManager');
const PasswordHash = require('../../security/PasswordHash');
const LoginUserUseCase = require('../LoginUserUseCase');
const NewAuthentication = require('../../../Domains/authentications/entities/NewAuth');

describe('LoginUserUseCase', () => {
  it('should orchestrate the login action correctly and return NewAuthentication entity', async () => {
    // Arrange
    const useCasePayload = {
      username: 'dicoding',
      password: 'secret',
    };

    const fakeEncryptedPassword = 'encrypted_password';
    const fakeUserId = 'user-123';
    const fakeAccessToken = 'access_token';
    const fakeRefreshToken = 'refresh_token';

    const expectedAuthentication = new NewAuthentication({
      accessToken: fakeAccessToken,
      refreshToken: fakeRefreshToken,
    });

    const mockUserRepository = new UserRepository();
    const mockAuthenticationRepository = new AuthenticationRepository();
    const mockAuthenticationTokenManager = new AuthenticationTokenManager();
    const mockPasswordHash = new PasswordHash();

    mockUserRepository.getPasswordByUsername = jest.fn().mockResolvedValue(fakeEncryptedPassword);
    mockPasswordHash.comparePassword = jest.fn().mockResolvedValue();
    mockUserRepository.getIdByUsername = jest.fn().mockResolvedValue(fakeUserId);
    mockAuthenticationTokenManager.createAccessToken = jest.fn().mockResolvedValue(fakeAccessToken);
    mockAuthenticationTokenManager.createRefreshToken = jest.fn().mockResolvedValue(fakeRefreshToken);
    mockAuthenticationRepository.addToken = jest.fn().mockResolvedValue();

    const loginUserUseCase = new LoginUserUseCase({
      userRepository: mockUserRepository,
      authenticationRepository: mockAuthenticationRepository,
      authenticationTokenManager: mockAuthenticationTokenManager,
      passwordHash: mockPasswordHash,
    });

    // Act
    const actualAuthentication = await loginUserUseCase.execute(useCasePayload);

    // Assert
    expect(actualAuthentication).toEqual(expectedAuthentication);
    expect(mockUserRepository.getPasswordByUsername)
      .toHaveBeenCalledWith(useCasePayload.username);
    expect(mockPasswordHash.comparePassword)
      .toHaveBeenCalledWith(useCasePayload.password, fakeEncryptedPassword);
    expect(mockUserRepository.getIdByUsername)
      .toHaveBeenCalledWith(useCasePayload.username);
    expect(mockAuthenticationTokenManager.createAccessToken)
      .toHaveBeenCalledWith({ username: useCasePayload.username, id: fakeUserId });
    expect(mockAuthenticationTokenManager.createRefreshToken)
      .toHaveBeenCalledWith({ username: useCasePayload.username, id: fakeUserId });
    expect(mockAuthenticationRepository.addToken)
      .toHaveBeenCalledWith(fakeRefreshToken);
  });
});