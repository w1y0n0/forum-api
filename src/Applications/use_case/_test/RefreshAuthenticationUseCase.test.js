const AuthenticationRepository = require('../../../Domains/authentications/AuthenticationRepository');
const AuthenticationTokenManager = require('../../security/AuthenticationTokenManager');
const RefreshAuthenticationUseCase = require('../RefreshAuthenticationUseCase');

describe('RefreshAuthenticationUseCase', () => {
  it('should throw error if use case payload not contain refresh token', async () => {
    const useCasePayload = {};
    const refreshAuthenticationUseCase = new RefreshAuthenticationUseCase({});

    await expect(refreshAuthenticationUseCase.execute(useCasePayload))
      .rejects.toThrow('REFRESH_AUTHENTICATION_USE_CASE.NOT_CONTAIN_REFRESH_TOKEN');
  });

  it('should throw error if refresh token not string', async () => {
    const useCasePayload = { refreshToken: 1 };
    const refreshAuthenticationUseCase = new RefreshAuthenticationUseCase({});

    await expect(refreshAuthenticationUseCase.execute(useCasePayload))
      .rejects.toThrow('REFRESH_AUTHENTICATION_USE_CASE.PAYLOAD_NOT_MEET_DATA_TYPE_SPECIFICATION');
  });

  it('should orchestrate the refresh authentication action correctly', async () => {
    // Arrange
    const useCasePayload = { refreshToken: 'some_refresh_token' };

    const decodedPayload = {
      username: 'dicoding',
      id: 'user-123',
    };

    const mockAuthenticationRepository = new AuthenticationRepository();
    const mockAuthenticationTokenManager = new AuthenticationTokenManager();

    mockAuthenticationTokenManager.verifyRefreshToken = jest.fn().mockResolvedValue();
    mockAuthenticationRepository.checkAvailabilityToken = jest.fn().mockResolvedValue();
    mockAuthenticationTokenManager.decodePayload = jest.fn().mockResolvedValue({ ...decodedPayload });
    mockAuthenticationTokenManager.createAccessToken = jest.fn().mockResolvedValue('some_new_access_token');

    const refreshAuthenticationUseCase = new RefreshAuthenticationUseCase({
      authenticationRepository: mockAuthenticationRepository,
      authenticationTokenManager: mockAuthenticationTokenManager,
    });

    // Act
    const result = await refreshAuthenticationUseCase.execute(useCasePayload);

    // Assert
    expect(mockAuthenticationTokenManager.verifyRefreshToken)
      .toHaveBeenCalledWith(useCasePayload.refreshToken);
    expect(mockAuthenticationRepository.checkAvailabilityToken)
      .toHaveBeenCalledWith(useCasePayload.refreshToken);
    expect(mockAuthenticationTokenManager.decodePayload)
      .toHaveBeenCalledWith(useCasePayload.refreshToken);
    expect(mockAuthenticationTokenManager.createAccessToken)
      .toHaveBeenCalledWith(decodedPayload);
    expect(result).toEqual('some_new_access_token');
  });
});