const AddReplyUseCase = require('../AddReplyUseCase');
const NewReply = require('../../../Domains/replies/entities/NewReply');
const AddedReply = require('../../../Domains/replies/entities/AddedReply');
const CommentRepository = require('../../../Domains/comments/CommentRepository');
const ThreadRepository = require('../../../Domains/threads/ThreadRepository');
const ReplyRepository = require('../../../Domains/replies/ReplyRepository');

describe('AddReplyUseCase', () => {
  it('should orchestrate the add reply action correctly', async () => {
    // Arrange
    const useCasePayload = {
      content: 'balasan bagus!',
      threadId: 'thread-123',
      commentId: 'comment-123',
      owner: 'user-123',
    };

    const expectedAddedReply = new AddedReply({
      id: 'reply-123',
      content: 'balasan bagus!',
      owner: 'user-123',
    });

    const mockCommentRepository = new CommentRepository();
    const mockThreadRepository = new ThreadRepository();
    const mockReplyRepository = new ReplyRepository();

    mockThreadRepository.verifyThreadExists = jest.fn().mockResolvedValue();
    mockCommentRepository.verifyCommentExists = jest.fn().mockResolvedValue();
    mockReplyRepository.addReply = jest.fn().mockResolvedValue(
      new AddedReply({
        id: 'reply-123',
        content: 'balasan bagus!',
        owner: 'user-123',
      })
    );

    const addReplyUseCase = new AddReplyUseCase({
      commentRepository: mockCommentRepository,
      replyRepository: mockReplyRepository,
      threadRepository: mockThreadRepository,
    });

    // Action
    const addedReply = await addReplyUseCase.execute(useCasePayload);

    // Assert
    expect(addedReply).toStrictEqual(expectedAddedReply);
    expect(mockThreadRepository.verifyThreadExists)
      .toHaveBeenCalledWith(useCasePayload.threadId);
    expect(mockCommentRepository.verifyCommentExists)
      .toHaveBeenCalledWith(useCasePayload.commentId);
    expect(mockReplyRepository.addReply)
      .toHaveBeenCalledWith(new NewReply({
        content: useCasePayload.content,
        commentId: useCasePayload.commentId,
        owner: useCasePayload.owner,
      }));
  });
});
