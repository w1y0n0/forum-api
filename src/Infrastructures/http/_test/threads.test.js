const pool = require('../../database/postgres/pool');
const UsersTableTestHelper = require('../../../../tests/UsersTableTestHelper');
const ThreadsTableTestHelper = require('../../../../tests/ThreadsTableTestHelper');
const CommentsTableTestHelper = require('../../../../tests/CommentsTableTestHelper');
const createServer = require('../createServer');
const container = require('../../container');

describe('/threads endpoint', () => {
  afterAll(async () => {
    await pool.end();
  });

  afterEach(async () => {
    await UsersTableTestHelper.cleanTable();
    await ThreadsTableTestHelper.cleanTable();
    await CommentsTableTestHelper.cleanTable();
  });

  describe('when POST /threads', () => {
    it('should response 201 and return added thread', async () => {
      const server = await createServer(container);

      await server.inject({
        method: 'POST',
        url: '/users',
        payload: {
          username: 'userthread',
          password: 'rahasia',
          fullname: 'User Thread',
        },
      });

      const loginResponse = await server.inject({
        method: 'POST',
        url: '/authentications',
        payload: {
          username: 'userthread',
          password: 'rahasia',
        },
      });

      const { data: { accessToken } } = JSON.parse(loginResponse.payload);

      const response = await server.inject({
        method: 'POST',
        url: '/threads',
        payload: {
          title: 'Sebuah thread',
          body: 'Isi thread',
        },
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(201);
      expect(responseJson.status).toEqual('success');
      expect(responseJson.data.addedThread).toBeDefined();
      expect(responseJson.data.addedThread).toEqual(expect.objectContaining({
        id: expect.any(String),
        title: 'Sebuah thread',
        owner: expect.any(String),
      }));
    });

    it('should response 400 when payload missing required property', async () => {
      const server = await createServer(container);

      await server.inject({
        method: 'POST',
        url: '/users',
        payload: {
          username: 'usernoTitle',
          password: 'rahasia',
          fullname: 'User No Title',
        },
      });

      const loginResponse = await server.inject({
        method: 'POST',
        url: '/authentications',
        payload: {
          username: 'usernoTitle',
          password: 'rahasia',
        },
      });

      const { data: { accessToken } } = JSON.parse(loginResponse.payload);

      const response = await server.inject({
        method: 'POST',
        url: '/threads',
        payload: {
          body: 'Hanya body, tidak ada title',
        },
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(400);
      expect(responseJson.status).toEqual('fail');
      expect(responseJson.message).toBeDefined();
    });

    it('should response 400 when payload has invalid data type', async () => {
      const server = await createServer(container);

      await server.inject({
        method: 'POST',
        url: '/users',
        payload: {
          username: 'userwrongtype',
          password: 'rahasia',
          fullname: 'User Salah Tipe',
        },
      });

      const loginResponse = await server.inject({
        method: 'POST',
        url: '/authentications',
        payload: {
          username: 'userwrongtype',
          password: 'rahasia',
        },
      });

      const { data: { accessToken } } = JSON.parse(loginResponse.payload);

      const response = await server.inject({
        method: 'POST',
        url: '/threads',
        payload: {
          title: 123,
          body: ['bukan string'],
        },
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(400);
      expect(responseJson.status).toEqual('fail');
      expect(responseJson.message).toBeDefined();
    });

    it('should response 401 when no access token provided', async () => {
      const server = await createServer(container);

      const response = await server.inject({
        method: 'POST',
        url: '/threads',
        payload: {
          title: 'Tanpa token',
          body: 'Isi tanpa autentikasi',
        },
      });

      expect(response.statusCode).toEqual(401);
    });
  });

  describe('when GET /threads/{threadId}', () => {
    it('should respond 200 with thread detail and comments', async () => {
      const server = await createServer(container);

      // Register & Login user
      await server.inject({
        method: 'POST',
        url: '/users',
        payload: {
          username: 'dicoding',
          password: 'rahasia',
          fullname: 'Dicoding Indonesia',
        },
      });

      const loginResponse = await server.inject({
        method: 'POST',
        url: '/authentications',
        payload: {
          username: 'dicoding',
          password: 'rahasia',
        },
      });

      const { data: { accessToken } } = JSON.parse(loginResponse.payload);

      // Tambah thread
      const threadResponse = await server.inject({
        method: 'POST',
        url: '/threads',
        payload: {
          title: 'sebuah thread',
          body: 'sebuah body thread',
        },
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const threadId = JSON.parse(threadResponse.payload).data.addedThread.id;

      // Tambah komentar aktif
      await server.inject({
        method: 'POST',
        url: `/threads/${threadId}/comments`,
        payload: {
          content: 'sebuah comment',
        },
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      // GET thread detail
      const response = await server.inject({
        method: 'GET',
        url: `/threads/${threadId}`,
      });

      const responseJson = JSON.parse(response.payload);

      expect(response.statusCode).toEqual(200);
      expect(responseJson.status).toEqual('success');

      const thread = responseJson.data.thread;
      expect(thread).toBeDefined();
      expect(thread.id).toEqual(threadId);
      expect(thread.title).toEqual('sebuah thread');
      expect(thread.body).toEqual('sebuah body thread');
      expect(thread.username).toEqual('dicoding');
      expect(thread.comments).toHaveLength(1);

      const [comment] = thread.comments;
      expect(comment.content).toEqual('sebuah comment');
    });

    it('should show "**komentar telah dihapus**" after deleting a comment', async () => {
      const server = await createServer(container);

      // Register & Login user
      await server.inject({
        method: 'POST',
        url: '/users',
        payload: {
          username: 'userhapus',
          password: 'rahasia',
          fullname: 'User Hapus',
        },
      });

      const loginResponse = await server.inject({
        method: 'POST',
        url: '/authentications',
        payload: {
          username: 'userhapus',
          password: 'rahasia',
        },
      });

      const { data: { accessToken } } = JSON.parse(loginResponse.payload);

      // Tambah thread
      const threadResponse = await server.inject({
        method: 'POST',
        url: '/threads',
        payload: {
          title: 'thread untuk penghapusan komentar',
          body: 'isi thread',
        },
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const threadId = JSON.parse(threadResponse.payload).data.addedThread.id;

      // Tambah komentar
      const commentResponse = await server.inject({
        method: 'POST',
        url: `/threads/${threadId}/comments`,
        payload: {
          content: 'komentar ini akan dihapus',
        },
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const commentId = JSON.parse(commentResponse.payload).data.addedComment.id;

      // Hapus komentar
      await server.inject({
        method: 'DELETE',
        url: `/threads/${threadId}/comments/${commentId}`,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      // GET thread detail
      const response = await server.inject({
        method: 'GET',
        url: `/threads/${threadId}`,
      });

      const responseJson = JSON.parse(response.payload);

      expect(response.statusCode).toEqual(200);
      expect(responseJson.status).toEqual('success');

      const thread = responseJson.data.thread;
      expect(thread).toBeDefined();
      expect(thread.comments).toHaveLength(1);

      const [comment] = thread.comments;
      expect(comment.content).toEqual('**komentar telah dihapus**');
    });

    it('should respond 404 if thread not found', async () => {
      const server = await createServer(container);

      const response = await server.inject({
        method: 'GET',
        url: '/threads/nonexistent-thread',
      });

      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(404);
      expect(responseJson.status).toEqual('fail');
      expect(responseJson.message).toBeDefined();
    });
  });
});