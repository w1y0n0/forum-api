const ToggleLikeCommentUseCase = require('../ToggleLikeCommentUseCase');
const ThreadRepository = require('../../../Domains/threads/ThreadRepository');
const CommentRepository = require('../../../Domains/comments/CommentRepository');

describe('ToggleLikeCommentUseCase', () => {
  it('should orchestrate the toggle like comment action correctly', async () => {
    // Arrange
    const useCasePayload = {
      threadId: 'thread-123',
      commentId: 'comment-456',
      userId: 'user-789',
    };

    const mockThreadRepository = new ThreadRepository();
    const mockCommentRepository = new CommentRepository();

    mockThreadRepository.verifyThreadExists = jest.fn().mockResolvedValue();
    mockCommentRepository.verifyCommentExists = jest.fn().mockResolvedValue();
    mockCommentRepository.toggleLikeComment = jest.fn().mockResolvedValue();

    const toggleLikeCommentUseCase = new ToggleLikeCommentUseCase({
      threadRepository: mockThreadRepository,
      commentRepository: mockCommentRepository,
    });

    // Act
    await toggleLikeCommentUseCase.execute(useCasePayload);

    // Assert
    expect(mockThreadRepository.verifyThreadExists)
      .toHaveBeenCalledWith(useCasePayload.threadId);
    expect(mockCommentRepository.verifyCommentExists)
      .toHaveBeenCalledWith(useCasePayload.commentId);
    expect(mockCommentRepository.toggleLikeComment)
      .toHaveBeenCalledWith(useCasePayload.commentId, useCasePayload.userId);
  });
});