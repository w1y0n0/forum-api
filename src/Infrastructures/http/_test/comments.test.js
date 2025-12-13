const pool = require('../../database/postgres/pool');
const UsersTableTestHelper = require('../../../../tests/UsersTableTestHelper');
const ThreadsTableTestHelper = require('../../../../tests/ThreadsTableTestHelper');
const CommentsTableTestHelper = require('../../../../tests/CommentsTableTestHelper');
const createServer = require('../createServer');
const container = require('../../container');

describe('/threads/{threadId}/comments endpoint', () => {
  afterAll(async () => {
    await pool.end();
  });

  afterEach(async () => {
    await CommentsTableTestHelper.cleanTable();
    await ThreadsTableTestHelper.cleanTable();
    await UsersTableTestHelper.cleanTable();
  });

  describe('when POST /threads/{threadId}/comments', () => {
    it('should response 201 and return added comment', async () => {
      const server = await createServer(container);

      await server.inject({
        method: 'POST',
        url: '/users',
        payload: { username: 'userkomentar', password: 'rahasia', fullname: 'User Komentar' },
      });

      const loginResponse = await server.inject({
        method: 'POST',
        url: '/authentications',
        payload: { username: 'userkomentar', password: 'rahasia' },
      });

      const { data: { accessToken } } = JSON.parse(loginResponse.payload);
      const [{ id: userId }] = await UsersTableTestHelper.findUsersByUsername('userkomentar');

      await ThreadsTableTestHelper.addThread({
        id: 'thread-123', title: 'judul thread', body: 'isi thread', owner: userId,
      });

      const response = await server.inject({
        method: 'POST',
        url: '/threads/thread-123/comments',
        payload: { content: 'sebuah komentar' },
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(201);
      expect(responseJson.status).toEqual('success');
      expect(responseJson.data.addedComment).toEqual(expect.objectContaining({
        id: expect.any(String),
        content: 'sebuah komentar',
        owner: expect.any(String),
      }));
    });

    it('should response 401 when request has no authentication', async () => {
      const server = await createServer(container);

      const response = await server.inject({
        method: 'POST',
        url: '/threads/thread-123/comments',
        payload: { content: 'sebuah komentar' },
      });

      expect(response.statusCode).toEqual(401);
    });

    it('should response 400 when payload does not contain needed property', async () => {
      const server = await createServer(container);

      await server.inject({
        method: 'POST',
        url: '/users',
        payload: { username: 'userkomentar', password: 'rahasia', fullname: 'User Komentar' },
      });

      const loginResponse = await server.inject({
        method: 'POST',
        url: '/authentications',
        payload: { username: 'userkomentar', password: 'rahasia' },
      });

      const { data: { accessToken } } = JSON.parse(loginResponse.payload);
      const [{ id: userId }] = await UsersTableTestHelper.findUsersByUsername('userkomentar');

      await ThreadsTableTestHelper.addThread({
        id: 'thread-123', title: 'judul thread', body: 'isi thread', owner: userId,
      });

      const response = await server.inject({
        method: 'POST',
        url: '/threads/thread-123/comments',
        payload: {},
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(400);
      expect(responseJson.status).toEqual('fail');
      expect(responseJson.message).toBeDefined();
    });

    it('should response 400 when content is not a string', async () => {
      const server = await createServer(container);

      await server.inject({
        method: 'POST',
        url: '/users',
        payload: { username: 'userkomentar', password: 'rahasia', fullname: 'User Komentar' },
      });

      const loginResponse = await server.inject({
        method: 'POST',
        url: '/authentications',
        payload: { username: 'userkomentar', password: 'rahasia' },
      });

      const { data: { accessToken } } = JSON.parse(loginResponse.payload);
      const [{ id: userId }] = await UsersTableTestHelper.findUsersByUsername('userkomentar');

      await ThreadsTableTestHelper.addThread({
        id: 'thread-123', title: 'judul thread', body: 'isi thread', owner: userId,
      });

      const response = await server.inject({
        method: 'POST',
        url: '/threads/thread-123/comments',
        payload: { content: 12345 },
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(400);
      expect(responseJson.status).toEqual('fail');
      expect(responseJson.message).toBeDefined();
    });

    it('should response 404 when thread is not found', async () => {
      const server = await createServer(container);

      await server.inject({
        method: 'POST',
        url: '/users',
        payload: { username: 'userkomentar', password: 'rahasia', fullname: 'User Komentar' },
      });

      const loginResponse = await server.inject({
        method: 'POST',
        url: '/authentications',
        payload: { username: 'userkomentar', password: 'rahasia' },
      });

      const { data: { accessToken } } = JSON.parse(loginResponse.payload);

      const response = await server.inject({
        method: 'POST',
        url: '/threads/thread-not-exist/comments',
        payload: { content: 'komentar di thread yang tidak ada' },
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(404);
      expect(responseJson.status).toEqual('fail');
      expect(responseJson.message).toBeDefined();
    });
  });


  describe('when DELETE /threads/{threadId}/comments/{commentId}', () => {
    it('should response 200 when owner deletes their comment', async () => {
      const server = await createServer(container);

      await server.inject({
        method: 'POST',
        url: '/users',
        payload: {
          username: 'deleter',
          password: 'rahasia',
          fullname: 'User Delete',
        },
      });

      const loginResponse = await server.inject({
        method: 'POST',
        url: '/authentications',
        payload: {
          username: 'deleter',
          password: 'rahasia',
        },
      });

      const { data: { accessToken } } = JSON.parse(loginResponse.payload);
      const [{ id: userId }] = await UsersTableTestHelper.findUsersByUsername('deleter');

      await ThreadsTableTestHelper.addThread({
        id: 'thread-xyz',
        title: 'judul delete',
        body: 'isi delete',
        owner: userId,
      });

      const commentResponse = await server.inject({
        method: 'POST',
        url: '/threads/thread-xyz/comments',
        payload: { content: 'komen yang mau dihapus' },
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const { data: { addedComment } } = JSON.parse(commentResponse.payload);

      const deleteResponse = await server.inject({
        method: 'DELETE',
        url: `/threads/thread-xyz/comments/${addedComment.id}`,
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const deleteResponseJson = JSON.parse(deleteResponse.payload);
      expect(deleteResponse.statusCode).toEqual(200);
      expect(deleteResponseJson.status).toEqual('success');
    });

    it('should response 403 when user tries to delete comment they do not own', async () => {
      const server = await createServer(container);

      // Register 2 users
      await server.inject({
        method: 'POST',
        url: '/users',
        payload: {
          username: 'owner',
          password: 'rahasia',
          fullname: 'Owner Komentar',
        },
      });
      await server.inject({
        method: 'POST',
        url: '/users',
        payload: {
          username: 'bukanpemilik',
          password: 'rahasia',
          fullname: 'Orang Lain',
        },
      });

      // Login sebagai owner
      const ownerLogin = await server.inject({
        method: 'POST',
        url: '/authentications',
        payload: {
          username: 'owner',
          password: 'rahasia',
        },
      });
      const ownerToken = JSON.parse(ownerLogin.payload).data.accessToken;
      const [{ id: ownerId }] = await UsersTableTestHelper.findUsersByUsername('owner');

      // Login sebagai bukan pemilik
      const intruderLogin = await server.inject({
        method: 'POST',
        url: '/authentications',
        payload: {
          username: 'bukanpemilik',
          password: 'rahasia',
        },
      });
      const intruderToken = JSON.parse(intruderLogin.payload).data.accessToken;

      await ThreadsTableTestHelper.addThread({
        id: 'thread-abc',
        title: 'judul thread',
        body: 'isi thread',
        owner: ownerId,
      });

      const commentResponse = await server.inject({
        method: 'POST',
        url: '/threads/thread-abc/comments',
        payload: { content: 'komentar dari owner' },
        headers: { Authorization: `Bearer ${ownerToken}` },
      });
      const commentId = JSON.parse(commentResponse.payload).data.addedComment.id;

      // Intruder mencoba menghapus
      const response = await server.inject({
        method: 'DELETE',
        url: `/threads/thread-abc/comments/${commentId}`,
        headers: { Authorization: `Bearer ${intruderToken}` },
      });

      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(403);
      expect(responseJson.status).toEqual('fail');
      expect(responseJson.message).toBeDefined();
    });

    it('should response 404 when thread is not found', async () => {
      const server = await createServer(container);

      await server.inject({
        method: 'POST',
        url: '/users',
        payload: {
          username: 'someone',
          password: 'rahasia',
          fullname: 'User',
        },
      });

      const login = await server.inject({
        method: 'POST',
        url: '/authentications',
        payload: {
          username: 'someone',
          password: 'rahasia',
        },
      });

      const token = JSON.parse(login.payload).data.accessToken;

      const response = await server.inject({
        method: 'DELETE',
        url: '/threads/thread-tidakada/comments/comment-123',
        headers: { Authorization: `Bearer ${token}` },
      });

      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(404);
      expect(responseJson.status).toEqual('fail');
      expect(responseJson.message).toBeDefined();
    });

    it('should response 404 when comment is not found', async () => {
      const server = await createServer(container);

      await server.inject({
        method: 'POST',
        url: '/users',
        payload: {
          username: 'someone',
          password: 'rahasia',
          fullname: 'User',
        },
      });

      const login = await server.inject({
        method: 'POST',
        url: '/authentications',
        payload: {
          username: 'someone',
          password: 'rahasia',
        },
      });

      const token = JSON.parse(login.payload).data.accessToken;
      const [{ id: userId }] = await UsersTableTestHelper.findUsersByUsername('someone');

      await ThreadsTableTestHelper.addThread({
        id: 'thread-real',
        title: 'judul',
        body: 'isi',
        owner: userId,
      });

      const response = await server.inject({
        method: 'DELETE',
        url: '/threads/thread-real/comments/comment-tidakada',
        headers: { Authorization: `Bearer ${token}` },
      });

      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(404);
      expect(responseJson.status).toEqual('fail');
      expect(responseJson.message).toBeDefined();
    });

    it('should response 401 when user not authenticated', async () => {
      const server = await createServer(container);

      const response = await server.inject({
        method: 'DELETE',
        url: '/threads/some-thread/comments/some-comment',
        // no auth header
      });

      expect(response.statusCode).toEqual(401);
    });
  });

  describe('when PUT /threads/{threadId}/comments/{commentId}/likes', () => {
    it('should respond 200 when a user likes a comment', async () => {
      const server = await createServer(container);

      // Register dan login user
      await server.inject({
        method: 'POST',
        url: '/users',
        payload: {
          username: 'liker',
          password: 'rahasia',
          fullname: 'User Like',
        },
      });

      const login = await server.inject({
        method: 'POST',
        url: '/authentications',
        payload: {
          username: 'liker',
          password: 'rahasia',
        },
      });

      const token = JSON.parse(login.payload).data.accessToken;
      const [{ id: userId }] = await UsersTableTestHelper.findUsersByUsername('liker');

      // Buat thread dan komentar
      await ThreadsTableTestHelper.addThread({
        id: 'thread-like',
        title: 'judul like',
        body: 'isi like',
        owner: userId,
      });

      const commentResponse = await server.inject({
        method: 'POST',
        url: '/threads/thread-like/comments',
        payload: { content: 'komentar disukai' },
        headers: { Authorization: `Bearer ${token}` },
      });

      const { id: commentId } = JSON.parse(commentResponse.payload).data.addedComment;

      // Like comment
      const likeResponse = await server.inject({
        method: 'PUT',
        url: `/threads/thread-like/comments/${commentId}/likes`,
        headers: { Authorization: `Bearer ${token}` },
      });

      const responseJson = JSON.parse(likeResponse.payload);
      expect(likeResponse.statusCode).toEqual(200);
      expect(responseJson.status).toEqual('success');
    });

    it('should toggle like (like then unlike) correctly and return 200', async () => {
      const server = await createServer(container);

      // Register & login
      await server.inject({
        method: 'POST',
        url: '/users',
        payload: {
          username: 'toggleliker',
          password: 'rahasia',
          fullname: 'Toggler',
        },
      });

      const login = await server.inject({
        method: 'POST',
        url: '/authentications',
        payload: {
          username: 'toggleliker',
          password: 'rahasia',
        },
      });

      const token = JSON.parse(login.payload).data.accessToken;
      const [{ id: userId }] = await UsersTableTestHelper.findUsersByUsername('toggleliker');

      await ThreadsTableTestHelper.addThread({
        id: 'thread-toggle',
        title: 'thread toggle',
        body: 'isi toggle',
        owner: userId,
      });

      const commentResponse = await server.inject({
        method: 'POST',
        url: '/threads/thread-toggle/comments',
        payload: { content: 'komentar toggle' },
        headers: { Authorization: `Bearer ${token}` },
      });

      const commentId = JSON.parse(commentResponse.payload).data.addedComment.id;

      // Like
      await server.inject({
        method: 'PUT',
        url: `/threads/thread-toggle/comments/${commentId}/likes`,
        headers: { Authorization: `Bearer ${token}` },
      });

      // Unlike
      const unlikeResponse = await server.inject({
        method: 'PUT',
        url: `/threads/thread-toggle/comments/${commentId}/likes`,
        headers: { Authorization: `Bearer ${token}` },
      });

      const responseJson = JSON.parse(unlikeResponse.payload);
      expect(unlikeResponse.statusCode).toEqual(200);
      expect(responseJson.status).toEqual('success');
    });

    it('should respond 401 when user is not authenticated', async () => {
      const server = await createServer(container);

      const response = await server.inject({
        method: 'PUT',
        url: '/threads/thread-any/comments/comment-any/likes',
      });

      expect(response.statusCode).toEqual(401);
    });

    it('should respond 404 when comment does not exist', async () => {
      const server = await createServer(container);

      await server.inject({
        method: 'POST',
        url: '/users',
        payload: {
          username: 'liker404',
          password: 'rahasia',
          fullname: 'Ghost',
        },
      });

      const login = await server.inject({
        method: 'POST',
        url: '/authentications',
        payload: {
          username: 'liker404',
          password: 'rahasia',
        },
      });

      const token = JSON.parse(login.payload).data.accessToken;
      const [{ id: userId }] = await UsersTableTestHelper.findUsersByUsername('liker404');

      await ThreadsTableTestHelper.addThread({
        id: 'thread-notfound',
        title: 'judul',
        body: 'isi',
        owner: userId,
      });

      const response = await server.inject({
        method: 'PUT',
        url: '/threads/thread-notfound/comments/comment-tidakada/likes',
        headers: { Authorization: `Bearer ${token}` },
      });

      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(404);
      expect(responseJson.status).toEqual('fail');
      expect(responseJson.message).toBeDefined();
    });

    it('should respond 404 when thread does not exist', async () => {
      const server = await createServer(container);

      await server.inject({
        method: 'POST',
        url: '/users',
        payload: {
          username: 'threadnotfound',
          password: 'rahasia',
          fullname: 'Ghost',
        },
      });

      const login = await server.inject({
        method: 'POST',
        url: '/authentications',
        payload: {
          username: 'threadnotfound',
          password: 'rahasia',
        },
      });

      const token = JSON.parse(login.payload).data.accessToken;

      const response = await server.inject({
        method: 'PUT',
        url: '/threads/thread-tidakada/comments/comment-123/likes',
        headers: { Authorization: `Bearer ${token}` },
      });

      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(404);
      expect(responseJson.status).toEqual('fail');
      expect(responseJson.message).toBeDefined();
    });
  });
});