/* eslint-disable camelcase */
const pool = require('../../database/postgres/pool');
const UsersTableTestHelper = require('../../../../tests/UsersTableTestHelper');
const ThreadsTableTestHelper = require('../../../../tests/ThreadsTableTestHelper');
const CommentsTableTestHelper = require('../../../../tests/CommentsTableTestHelper');
const CommentRepositoryPostgres = require('../CommentRepositoryPostgres');
const NewComment = require('../../../Domains/comments/entities/NewComment');
const AddedComment = require('../../../Domains/comments/entities/AddedComment');
const NotFoundError = require('../../../Commons/exceptions/NotFoundError');
const AuthorizationError = require('../../../Commons/exceptions/AuthorizationError');

describe('CommentRepositoryPostgres', () => {
  afterAll(async () => {
    await pool.end();
  });

  afterEach(async () => {
    await UsersTableTestHelper.cleanTable();
    await ThreadsTableTestHelper.cleanTable();
    await CommentsTableTestHelper.cleanTable();
  });

  describe('addComment function', () => {
    it('should persist comment in database correctly', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({
        id: 'user-123',
        username: 'dicoding',
        password: 'secret',
        fullname: 'Dicoding Indonesia',
      });

      await ThreadsTableTestHelper.addThread({
        id: 'thread-123',
        title: 'judul',
        body: 'isi',
        owner: 'user-123',
      });

      const newComment = new NewComment({
        content: 'komentar',
        threadId: 'thread-123',
        owner: 'user-123',
      });

      const fakeIdGenerator = () => '123';
      const commentRepository = new CommentRepositoryPostgres(pool, fakeIdGenerator);

      // Action
      await commentRepository.addComment(newComment);

      // Assert
      const comments = await CommentsTableTestHelper.findCommentById('comment-123');
      expect(comments).toHaveLength(1);
    });

    it('should return added comment object correctly', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({
        id: 'user-123',
        username: 'dicoding',
        password: 'secret',
        fullname: 'Dicoding Indonesia',
      });

      await ThreadsTableTestHelper.addThread({
        id: 'thread-123',
        title: 'judul',
        body: 'isi',
        owner: 'user-123',
      });

      const newComment = new NewComment({
        content: 'komentar',
        threadId: 'thread-123',
        owner: 'user-123',
      });

      const fakeIdGenerator = () => '123';
      const commentRepository = new CommentRepositoryPostgres(pool, fakeIdGenerator);

      // Action
      const addedComment = await commentRepository.addComment(newComment);

      // Assert
      expect(addedComment).toStrictEqual(new AddedComment({
        id: 'comment-123',
        content: 'komentar',
        owner: 'user-123',
      }));
    });
  });

  describe('verifyCommentExists function', () => {
    it('should throw NotFoundError if comment does not exist', async () => {
      // Arrange
      const commentRepository = new CommentRepositoryPostgres(pool, {});

      // Action & Assert
      await expect(commentRepository.verifyCommentExists('comment-404'))
        .rejects.toThrow(NotFoundError);
    });

    it('should not throw error if comment exists', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ id: 'user-123' });
      await ThreadsTableTestHelper.addThread({ id: 'thread-123', owner: 'user-123' });
      await CommentsTableTestHelper.addComment({
        id: 'comment-123',
        threadId: 'thread-123',
        owner: 'user-123',
        content: 'komentar',
      });

      const commentRepository = new CommentRepositoryPostgres(pool, {});

      // Act & Assert
      await expect(commentRepository.verifyCommentExists('comment-123'))
        .resolves.not.toThrow(NotFoundError);
    });
  });

  describe('verifyCommentOwner function', () => {
    it('should throw AuthorizationError if owner does not match', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ id: 'user-123' });
      await ThreadsTableTestHelper.addThread({ id: 'thread-123', owner: 'user-123' });
      await CommentsTableTestHelper.addComment({
        id: 'comment-123',
        threadId: 'thread-123',
        owner: 'user-123',
        content: 'komentar',
      });

      const commentRepository = new CommentRepositoryPostgres(pool, {});

      // Action & Assert
      await expect(commentRepository.verifyCommentOwner('comment-123', 'user-xxx'))
        .rejects.toThrow(AuthorizationError);
    });

    it('should not throw error if owner is correct', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ id: 'user-123' });
      await ThreadsTableTestHelper.addThread({ id: 'thread-123', owner: 'user-123' });
      await CommentsTableTestHelper.addComment({
        id: 'comment-123',
        threadId: 'thread-123',
        owner: 'user-123',
        content: 'komentar',
      });

      const commentRepository = new CommentRepositoryPostgres(pool, {});

      // Act & Assert
      await expect(commentRepository.verifyCommentOwner('comment-123', 'user-123'))
        .resolves.not.toThrow(AuthorizationError);
    });
  });

  describe('deleteComment function', () => {
    it('should soft delete the comment by setting is_delete to true', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ id: 'user-123' });
      await ThreadsTableTestHelper.addThread({ id: 'thread-123', owner: 'user-123' });
      await CommentsTableTestHelper.addComment({
        id: 'comment-123',
        threadId: 'thread-123',
        owner: 'user-123',
        content: 'komentar',
      });

      const commentRepository = new CommentRepositoryPostgres(pool, {});

      // Act & Assert
      await commentRepository.deleteComment('comment-123');

      const [comment] = await CommentsTableTestHelper.findCommentById('comment-123');
      expect(comment.is_delete).toBe(true);
    });
  });

  describe('getCommentsByThreadId function', () => {
    it('should return all comments from a thread with correct structure', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ id: 'user-123', username: 'dicoding' });

      await ThreadsTableTestHelper.addThread({
        id: 'thread-123',
        title: 'judul thread',
        body: 'isi thread',
        owner: 'user-123',
      });

      await CommentsTableTestHelper.addComment({
        id: 'comment-1',
        threadId: 'thread-123',
        owner: 'user-123',
        content: 'komentar pertama',
        date: new Date().toISOString(),
        is_delete: false,
      });

      await CommentsTableTestHelper.addComment({
        id: 'comment-2',
        threadId: 'thread-123',
        owner: 'user-123',
        content: 'komentar kedua',
        date: new Date().toISOString(),
        is_delete: true,
      });

      const commentRepository = new CommentRepositoryPostgres(pool, () => 'fake-id');

      // Act
      const result = await commentRepository.getCommentsByThreadId('thread-123');

      // Assert
      expect(result).toEqual([
        {
          id: 'comment-1',
          username: 'dicoding',
          content: 'komentar pertama',
          date: expect.any(Date),
          is_delete: false,
        },
        {
          id: 'comment-2',
          username: 'dicoding',
          content: 'komentar kedua',
          date: expect.any(Date),
          is_delete: true,
        },
      ]);
    });

    it('should return empty array if no comments found for thread', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ id: 'user-123', username: 'dicoding' });

      await ThreadsTableTestHelper.addThread({
        id: 'thread-999',
        title: 'kosong',
        body: 'tidak ada komentar',
        owner: 'user-123',
      });

      const commentRepository = new CommentRepositoryPostgres(pool, () => 'id');

      // Act & Assert
      await expect(commentRepository.getCommentsByThreadId('thread-999'))
        .resolves.toEqual([]);
    });
  });
});
