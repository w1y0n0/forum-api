/* eslint-disable camelcase */
const pool = require('../../database/postgres/pool');
const UsersTableTestHelper = require('../../../../tests/UsersTableTestHelper');
const ThreadsTableTestHelper = require('../../../../tests/ThreadsTableTestHelper');
const CommentsTableTestHelper = require('../../../../tests/CommentsTableTestHelper');
const RepliesTableTestHelper = require('../../../../tests/RepliesTableTestHelper');
const ReplyRepositoryPostgres = require('../ReplyRepositoryPostgres');
const NewReply = require('../../../Domains/replies/entities/NewReply');
const AddedReply = require('../../../Domains/replies/entities/AddedReply');
const NotFoundError = require('../../../Commons/exceptions/NotFoundError');
const AuthorizationError = require('../../../Commons/exceptions/AuthorizationError');

describe('ReplyRepositoryPostgres', () => {
  afterAll(async () => {
    await pool.end();
  });

  afterEach(async () => {
    await UsersTableTestHelper.cleanTable();
    await ThreadsTableTestHelper.cleanTable();
    await CommentsTableTestHelper.cleanTable();
    await RepliesTableTestHelper.cleanTable();
  });

  describe('addReply function', () => {
    it('should persist reply in database correctly', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ id: 'user-123' });

      await ThreadsTableTestHelper.addThread({
        id: 'thread-123',
        title: 'Judul Thread',
        body: 'Isi thread',
        owner: 'user-123',
      });

      await CommentsTableTestHelper.addComment({
        id: 'comment-123',
        threadId: 'thread-123',
        owner: 'user-123',
      });

      const newReply = new NewReply({
        content: 'sebuah balasan',
        commentId: 'comment-123',
        owner: 'user-123',
      });

      const fakeIdGenerator = () => '123';
      const replyRepository = new ReplyRepositoryPostgres(pool, fakeIdGenerator);

      // Action
      await replyRepository.addReply(newReply);

      // Assert
      const replies = await RepliesTableTestHelper.findReplyById('reply-123');
      expect(replies).toHaveLength(1);
    });

    it('should return added reply object correctly', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ id: 'user-123' });

      await ThreadsTableTestHelper.addThread({
        id: 'thread-123',
        title: 'Judul Thread',
        body: 'Isi thread',
        owner: 'user-123',
      });

      await CommentsTableTestHelper.addComment({
        id: 'comment-123',
        threadId: 'thread-123',
        owner: 'user-123',
      });

      const newReply = new NewReply({
        content: 'sebuah balasan',
        commentId: 'comment-123',
        owner: 'user-123',
      });

      const fakeIdGenerator = () => '123';
      const replyRepository = new ReplyRepositoryPostgres(pool, fakeIdGenerator);

      // Action
      const addedReply = await replyRepository.addReply(newReply);

      // Assert
      expect(addedReply).toStrictEqual(new AddedReply({
        id: 'reply-123',
        content: 'sebuah balasan',
        owner: 'user-123',
      }));
    });
  });

  describe('deleteReply function', () => {
    it('should update is_delete to true', async () => {
      await UsersTableTestHelper.addUser({ id: 'user-123' });

      await ThreadsTableTestHelper.addThread({
        id: 'thread-123',
        title: 'thread title',
        body: 'thread body',
        owner: 'user-123',
      });

      await CommentsTableTestHelper.addComment({
        id: 'comment-123',
        threadId: 'thread-123',
        owner: 'user-123',
      });

      await RepliesTableTestHelper.addReply({
        id: 'reply-123',
        commentId: 'comment-123',
        content: 'balasan yang akan dihapus',
        owner: 'user-123',
      });


      const replyRepository = new ReplyRepositoryPostgres(pool, () => '123');

      await replyRepository.deleteReply('reply-123');

      const reply = await RepliesTableTestHelper.findReplyById('reply-123');
      expect(reply[0].is_delete).toBe(true);
    });
  });

  describe('verifyReplyExists function', () => {
    it('should throw NotFoundError when reply does not exist', async () => {
      const replyRepository = new ReplyRepositoryPostgres(pool, () => '123');
      await expect(replyRepository.verifyReplyExists('reply-404'))
        .rejects.toThrow(NotFoundError);
    });

    it('should not throw NotFoundError when reply exists', async () => {
      await UsersTableTestHelper.addUser({
        id: 'user-123'
      });

      await ThreadsTableTestHelper.addThread({
        id: 'thread-123',
        title: 'judul',
        body: 'isi',
        owner: 'user-123',
      });

      await CommentsTableTestHelper.addComment({
        id: 'comment-123',
        threadId: 'thread-123',
        owner: 'user-123'
      });

      await RepliesTableTestHelper.addReply({
        id: 'reply-123',
        commentId: 'comment-123',
        content: 'balasan',
        owner: 'user-123',
      });

      const replyRepository = new ReplyRepositoryPostgres(pool, () => '123');
      await expect(replyRepository.verifyReplyExists('reply-123'))
        .resolves.not.toThrow(NotFoundError);
    });
  });

  describe('verifyReplyOwner function', () => {
    it('should throw NotFoundError when reply not found', async () => {
      const replyRepository = new ReplyRepositoryPostgres(pool, () => '123');
      await expect(replyRepository.verifyReplyOwner('reply-x', 'user-x'))
        .rejects.toThrow(NotFoundError);
    });

    it('should throw AuthorizationError when owner mismatch', async () => {
      await UsersTableTestHelper.addUser({
        id: 'user-123'
      });

      await ThreadsTableTestHelper.addThread({
        id: 'thread-123',
        title: 'judul',
        body: 'isi',
        owner: 'user-123',
      });

      await CommentsTableTestHelper.addComment({
        id: 'comment-123',
        threadId: 'thread-123',
        owner: 'user-123'
      });

      await RepliesTableTestHelper.addReply({
        id: 'reply-123',
        commentId: 'comment-123',
        content: 'balasan',
        owner: 'user-123',
      });

      const replyRepository = new ReplyRepositoryPostgres(pool, () => '123');
      await expect(replyRepository.verifyReplyOwner('reply-123', 'user-456'))
        .rejects.toThrow(AuthorizationError);
    });

    it('should not throw error when reply exists and owner matches', async () => {
      await UsersTableTestHelper.addUser({
        id: 'user-123'
      });

      await ThreadsTableTestHelper.addThread({
        id: 'thread-123',
        title: 'judul',
        body: 'isi',
        owner: 'user-123',
      });

      await CommentsTableTestHelper.addComment({
        id: 'comment-123',
        threadId: 'thread-123',
        owner: 'user-123'
      });

      await RepliesTableTestHelper.addReply({
        id: 'reply-123',
        commentId: 'comment-123',
        content: 'balasan',
        owner: 'user-123',
      });

      const replyRepository = new ReplyRepositoryPostgres(pool, () => '123');
      await expect(replyRepository.verifyReplyOwner('reply-123', 'user-123'))
        .resolves.not.toThrow(NotFoundError);
      await expect(replyRepository.verifyReplyOwner('reply-123', 'user-123'))
        .resolves.not.toThrow(AuthorizationError);
    });
  });

  describe('getRepliesByCommentIds function', () => {
    it('should return replies grouped by comment id', async () => {
      await UsersTableTestHelper.addUser({
        id: 'user-123',
        username: 'dicoding'
      });

      await ThreadsTableTestHelper.addThread({
        id: 'thread-1',
        title: 'judul thread',
        body: 'isi',
        owner: 'user-123',
      });

      await CommentsTableTestHelper.addComment({
        id: 'comment-1',
        threadId: 'thread-1',
        owner: 'user-123'
      });

      await CommentsTableTestHelper.addComment({
        id: 'comment-2',
        threadId: 'thread-1',
        owner: 'user-123'
      });

      await RepliesTableTestHelper.addReply({
        id: 'reply-1',
        commentId: 'comment-1',
        content: 'balasan 1',
        owner: 'user-123',
        date: new Date().toISOString(),
      });

      await RepliesTableTestHelper.addReply({
        id: 'reply-2',
        commentId: 'comment-1',
        content: 'balasan 2',
        owner: 'user-123',
        date: new Date().toISOString(),
        is_delete: true,
      });

      const replyRepository = new ReplyRepositoryPostgres(pool, () => '123');
      const result = await replyRepository.getRepliesByCommentIds(['comment-1', 'comment-2']);

      expect(result).toEqual([
        {
          id: 'reply-1',
          comment_id: 'comment-1',
          content: 'balasan 1',
          date: expect.any(Date),
          is_delete: false,
          username: 'dicoding',
        },
        {
          id: 'reply-2',
          comment_id: 'comment-1',
          content: 'balasan 2',
          date: expect.any(Date),
          is_delete: true,
          username: 'dicoding',
        },
      ]);
    });
  });
});
