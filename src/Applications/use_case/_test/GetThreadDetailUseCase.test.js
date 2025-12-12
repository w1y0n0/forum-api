/* eslint-disable camelcase */
const GetThreadDetailUseCase = require('../GetThreadDetailUseCase');
const ThreadRepository = require('../../../Domains/threads/ThreadRepository');
const CommentRepository = require('../../../Domains/comments/CommentRepository');
const ReplyRepository = require('../../../Domains/replies/ReplyRepository');

describe('GetThreadDetailUseCase', () => {
  it('should orchestrate the get thread detail action correctly including comments and replies', async () => {
    // Arrange
    const mockThreadId = 'thread-123';

    const threadMockResponse = {
      id: mockThreadId,
      title: 'Sebuah thread',
      body: 'Isi thread',
      date: '2021-08-08T07:19:09.775Z',
      username: 'dicoding',
    };

    const commentsMockResponse = [
      {
        id: 'comment-123',
        username: 'user1',
        date: '2021-08-08T07:22:33.555Z',
        content: 'komentar pertama',
        is_delete: false,
      },
      {
        id: 'comment-456',
        username: 'user2',
        date: '2021-08-08T07:26:21.338Z',
        content: 'komentar dihapus',
        is_delete: true,
      },
    ];

    const repliesMockResponse = [
      {
        id: 'reply-123',
        comment_id: 'comment-123',
        username: 'user3',
        date: '2021-08-08T07:30:00.000Z',
        content: 'balasan pertama',
        is_delete: false,
      },
      {
        id: 'reply-456',
        comment_id: 'comment-123',
        username: 'user4',
        date: '2021-08-08T07:35:00.000Z',
        content: 'balasan dihapus',
        is_delete: true,
      },
    ];

    const expectedThreadDetail = {
      id: 'thread-123',
      title: 'Sebuah thread',
      body: 'Isi thread',
      date: '2021-08-08T07:19:09.775Z',
      username: 'dicoding',
      comments: [
        {
          id: 'comment-123',
          username: 'user1',
          date: '2021-08-08T07:22:33.555Z',
          content: 'komentar pertama',
          replies: [
            {
              id: 'reply-123',
              content: 'balasan pertama',
              date: '2021-08-08T07:30:00.000Z',
              username: 'user3',
            },
            {
              id: 'reply-456',
              content: '**balasan telah dihapus**',
              date: '2021-08-08T07:35:00.000Z',
              username: 'user4',
            },
          ],
        },
        {
          id: 'comment-456',
          username: 'user2',
          date: '2021-08-08T07:26:21.338Z',
          content: '**komentar telah dihapus**',
          replies: [],
        },
      ],
    };

    const mockThreadRepository = new ThreadRepository();
    const mockCommentRepository = new CommentRepository();
    const mockReplyRepository = new ReplyRepository();

    mockThreadRepository.verifyThreadExists = jest.fn().mockResolvedValue();
    mockThreadRepository.getThreadDetail = jest.fn().mockResolvedValue({ ...threadMockResponse });
    mockCommentRepository.getCommentsByThreadId = jest.fn().mockResolvedValue(
      commentsMockResponse.map((comment) => ({ ...comment }))
    );
    mockReplyRepository.getRepliesByCommentIds = jest.fn().mockResolvedValue(
      repliesMockResponse.map((reply) => ({ ...reply }))
    );

    const getThreadDetailUseCase = new GetThreadDetailUseCase({
      threadRepository: mockThreadRepository,
      commentRepository: mockCommentRepository,
      replyRepository: mockReplyRepository,
    });

    // Act
    const result = await getThreadDetailUseCase.execute(mockThreadId);

    // Assert
    expect(result).toEqual(expectedThreadDetail);
    expect(mockThreadRepository.verifyThreadExists).toHaveBeenCalledWith(mockThreadId);
    expect(mockThreadRepository.getThreadDetail).toHaveBeenCalledWith(mockThreadId);
    expect(mockCommentRepository.getCommentsByThreadId).toHaveBeenCalledWith(mockThreadId);
    expect(mockReplyRepository.getRepliesByCommentIds).toHaveBeenCalledWith(['comment-123', 'comment-456']);
  });
});