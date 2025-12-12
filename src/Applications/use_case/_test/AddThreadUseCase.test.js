const AddThreadUseCase = require('../AddThreadUseCase');
const ThreadRepository = require('../../../Domains/threads/ThreadRepository');
const NewThread = require('../../../Domains/threads/entities/NewThread');
const AddedThread = require('../../../Domains/threads/entities/AddedThread');

describe('AddThreadUseCase', () => {
  it('should orchestrate the add thread action correctly', async () => {
    // Arrange
    const useCasePayload = {
      title: 'Sebuah thread',
      body: 'Isi thread',
      owner: 'user-123',
    };

    const expectedAddedThread = new AddedThread({
      id: 'thread-123',
      title: 'Sebuah thread',
      owner: 'user-123',
    });

    const mockThreadRepository = new ThreadRepository();
    mockThreadRepository.addThread = jest.fn().mockResolvedValue(
      new AddedThread({
        id: 'thread-123',
        title: 'Sebuah thread',
        owner: 'user-123',
      })
    );

    const addThreadUseCase = new AddThreadUseCase({
      threadRepository: mockThreadRepository,
    });

    // Act
    const result = await addThreadUseCase.execute(useCasePayload);

    // Assert
    expect(result).toStrictEqual(expectedAddedThread);
    expect(mockThreadRepository.addThread)
      .toHaveBeenCalledWith(new NewThread(useCasePayload));
  });
});
