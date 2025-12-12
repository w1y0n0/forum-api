const pool = require('../../database/postgres/pool');
const UsersTableTestHelper = require('../../../../tests/UsersTableTestHelper');
const ThreadsTableTestHelper = require('../../../../tests/ThreadsTableTestHelper');
const ThreadRepositoryPostgres = require('../ThreadRepositoryPostgres');
const NewThread = require('../../../Domains/threads/entities/NewThread');
const NotFoundError = require('../../../Commons/exceptions/NotFoundError');

describe('ThreadRepositoryPostgres', () => {
  afterAll(async () => {
    await pool.end();
  });

  afterEach(async () => {
    await UsersTableTestHelper.cleanTable();
    await ThreadsTableTestHelper.cleanTable();
  });

  describe('addThread function', () => {
    it('should persist thread in database correctly', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({
        id: 'user-123',
        username: 'dicoding',
        password: 'secret',
        fullname: 'Dicoding Indonesia',
      });

      const newThread = new NewThread({
        title: 'judul',
        body: 'isi',
        owner: 'user-123',
      });
      const fakeIdGenerator = () => '123';
      const threadRepositoryPostgres = new ThreadRepositoryPostgres(pool, fakeIdGenerator);

      // Action
      await threadRepositoryPostgres.addThread(newThread);

      // Assert
      const thread = await ThreadsTableTestHelper.findThreadById('thread-123');
      expect(thread).toHaveLength(1);
    });

    it('should return added thread object correctly', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({
        id: 'user-123',
        username: 'dicoding',
        password: 'secret',
        fullname: 'Dicoding Indonesia',
      });

      const newThread = new NewThread({
        title: 'judul',
        body: 'isi',
        owner: 'user-123',
      });
      const fakeIdGenerator = () => '123';
      const threadRepositoryPostgres = new ThreadRepositoryPostgres(pool, fakeIdGenerator);

      // Action
      const addedThread = await threadRepositoryPostgres.addThread(newThread);

      // Assert
      expect(addedThread).toEqual({
        id: 'thread-123',
        title: 'judul',
        owner: 'user-123',
      });
    });
  });

  describe('verifyThreadExists function', () => {
    it('should throw NotFoundError when thread not found', async () => {
      // Arrange
      const threadRepositoryPostgres = new ThreadRepositoryPostgres(pool, () => '123');

      // Action & Assert
      await expect(threadRepositoryPostgres.verifyThreadExists('thread-404'))
        .rejects.toThrow(NotFoundError);
    });

    it('should not throw NotFoundError when thread exists', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({
        id: 'user-456',
        username: 'testuser',
      });

      await ThreadsTableTestHelper.addThread({
        id: 'thread-123',
        title: 'judul',
        body: 'isi',
        owner: 'user-456',
      });

      const threadRepositoryPostgres = new ThreadRepositoryPostgres(pool, () => '123');

      // Action & Assert
      await expect(threadRepositoryPostgres.verifyThreadExists('thread-123'))
        .resolves.not.toThrow(NotFoundError);
    });
  });

  describe('getThreadDetail function', () => {
    it('should return detailed thread correctly when thread exists', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({
        id: 'user-123',
        username: 'dicoding',
      });

      await ThreadsTableTestHelper.addThread({
        id: 'thread-123',
        title: 'Judul Thread',
        body: 'Isi dari thread',
        owner: 'user-123',
        date: new Date().toISOString(),
      });

      const threadRepositoryPostgres = new ThreadRepositoryPostgres(pool, () => '123');

      // Act
      const thread = await threadRepositoryPostgres.getThreadDetail('thread-123');

      // Assert
      expect(thread).toEqual({
        id: 'thread-123',
        title: 'Judul Thread',
        body: 'Isi dari thread',
        date: expect.any(Date),
        username: 'dicoding',
      });
    });

    it('should throw NotFoundError when thread does not exist', async () => {
      // Arrange
      const threadRepositoryPostgres = new ThreadRepositoryPostgres(pool, () => '123');

      // Action & Assert
      await expect(threadRepositoryPostgres.getThreadDetail('thread-404'))
        .rejects.toThrow(NotFoundError);
    });
  });
});