const RegisterUser = require('../../../Domains/users/entities/RegisterUser');
const RegisteredUser = require('../../../Domains/users/entities/RegisteredUser');
const UserRepository = require('../../../Domains/users/UserRepository');
const PasswordHash = require('../../security/PasswordHash');
const AddUserUseCase = require('../AddUserUseCase');

describe('AddUserUseCase', () => {
  it('should orchestrating the add user action correctly', async () => {
    // Arrange
    const useCasePayload = {
      username: 'dicoding',
      password: 'secret',
      fullname: 'Dicoding Indonesia',
    };

    const expectedRegisteredUser = new RegisteredUser({
      id: 'user-123',
      username: 'dicoding',
      fullname: 'Dicoding Indonesia',
    });

    const mockUserRepository = new UserRepository();
    const mockPasswordHash = new PasswordHash();

    mockUserRepository.verifyAvailableUsername = jest.fn().mockResolvedValue();
    mockPasswordHash.hash = jest.fn().mockResolvedValue('encrypted_password');

    mockUserRepository.addUser = jest.fn().mockResolvedValue(
      new RegisteredUser({
        id: 'user-123',
        username: 'dicoding',
        fullname: 'Dicoding Indonesia',
      })
    );

    const addUserUseCase = new AddUserUseCase({
      userRepository: mockUserRepository,
      passwordHash: mockPasswordHash,
    });

    // Action
    const registeredUser = await addUserUseCase.execute(useCasePayload);

    // Assert
    expect(registeredUser).toStrictEqual(expectedRegisteredUser);
    expect(mockUserRepository.verifyAvailableUsername)
      .toHaveBeenCalledWith(useCasePayload.username);
    expect(mockPasswordHash.hash)
      .toHaveBeenCalledWith(useCasePayload.password);
    expect(mockUserRepository.addUser)
      .toHaveBeenCalledWith(new RegisterUser({
        username: 'dicoding',
        password: 'encrypted_password',
        fullname: 'Dicoding Indonesia',
      }));
  });
});