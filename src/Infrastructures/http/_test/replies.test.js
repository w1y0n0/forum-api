const pool = require('../../database/postgres/pool');
const createServer = require('../createServer');
const container = require('../../container');
const UsersTableTestHelper = require('../../../../tests/UsersTableTestHelper');
const ThreadsTableTestHelper = require('../../../../tests/ThreadsTableTestHelper');
const CommentsTableTestHelper = require('../../../../tests/CommentsTableTestHelper');
const RepliesTableTestHelper = require('../../../../tests/RepliesTableTestHelper');

describe('/replies endpoint', () => {
  afterAll(async () => {
    await pool.end();
  });

  afterEach(async () => {
    await UsersTableTestHelper.cleanTable();
    await ThreadsTableTestHelper.cleanTable();
    await CommentsTableTestHelper.cleanTable();
    await RepliesTableTestHelper.cleanTable();
  });

  describe('when POST /threads/{threadId}/comments/{commentId}/replies', () => {
    it('should response 201 and added reply when payload is valid', async () => {
      const server = await createServer(container);

      // Register user
      await server.inject({
        method: 'POST',
        url: '/users',
        payload: {
          username: 'userreply',
          password: 'secret',
          fullname: 'User Reply',
        },
      });

      // Login user
      const loginResponse = await server.inject({
        method: 'POST',
        url: '/authentications',
        payload: {
          username: 'userreply',
          password: 'secret',
        },
      });
      const { accessToken } = JSON.parse(loginResponse.payload).data;

      // Add thread
      const threadResponse = await server.inject({
        method: 'POST',
        url: '/threads',
        payload: {
          title: 'judul thread',
          body: 'isi thread',
        },
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const threadId = JSON.parse(threadResponse.payload).data.addedThread.id;

      // Add comment
      const commentResponse = await server.inject({
        method: 'POST',
        url: `/threads/${threadId}/comments`,
        payload: {
          content: 'komentar utama',
        },
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const commentId = JSON.parse(commentResponse.payload).data.addedComment.id;

      // Add reply
      const replyResponse = await server.inject({
        method: 'POST',
        url: `/threads/${threadId}/comments/${commentId}/replies`,
        payload: {
          content: 'balasan untuk komentar',
        },
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      // Assert
      const responseJson = JSON.parse(replyResponse.payload);
      expect(replyResponse.statusCode).toBe(201);
      expect(responseJson.status).toBe('success');
      expect(responseJson.data.addedReply).toBeDefined();
      expect(responseJson.data.addedReply.content).toEqual('balasan untuk komentar');
    });

    it('should response 400 when payload does not contain content', async () => {
      const server = await createServer(container);

      // Register user
      await server.inject({
        method: 'POST',
        url: '/users',
        payload: {
          username: 'userreplyinvalid',
          password: 'secret',
          fullname: 'User Reply',
        },
      });

      const loginResponse = await server.inject({
        method: 'POST',
        url: '/authentications',
        payload: {
          username: 'userreplyinvalid',
          password: 'secret',
        },
      });
      const { accessToken } = JSON.parse(loginResponse.payload).data;

      // Add thread
      const threadRes = await server.inject({
        method: 'POST',
        url: '/threads',
        payload: {
          title: 'judul',
          body: 'isi',
        },
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const threadId = JSON.parse(threadRes.payload).data.addedThread.id;

      // Add comment
      const commentRes = await server.inject({
        method: 'POST',
        url: `/threads/${threadId}/comments`,
        payload: { content: 'komentar utama' },
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const commentId = JSON.parse(commentRes.payload).data.addedComment.id;

      // Add reply tanpa content
      const response = await server.inject({
        method: 'POST',
        url: `/threads/${threadId}/comments/${commentId}/replies`,
        payload: {},
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toBe(400);
      expect(responseJson.status).toBe('fail');
      expect(responseJson.message).toBeDefined();
    });

    it('should response 401 when user not authenticated', async () => {
      const server = await createServer(container);

      const response = await server.inject({
        method: 'POST',
        url: '/threads/thread-123/comments/comment-123/replies',
        payload: {
          content: 'balasan tanpa login',
        },
      });

      expect(response.statusCode).toBe(401);
    });

    it('should response 404 when thread or comment not found', async () => {
      const server = await createServer(container);

      await server.inject({
        method: 'POST',
        url: '/users',
        payload: {
          username: 'ghost',
          password: 'secret',
          fullname: 'Hantu',
        },
      });

      const loginResponse = await server.inject({
        method: 'POST',
        url: '/authentications',
        payload: {
          username: 'ghost',
          password: 'secret',
        },
      });

      const { accessToken } = JSON.parse(loginResponse.payload).data;

      const response = await server.inject({
        method: 'POST',
        url: '/threads/thread-not-found/comments/comment-not-found/replies',
        payload: {
          content: 'balasan yang gagal',
        },
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toBe(404);
      expect(responseJson.status).toBe('fail');
      expect(responseJson.message).toBeDefined();
    });
  });

  describe('when DELETE /threads/{threadId}/comments/{commentId}/replies/{replyId}', () => {
    it('should respond 200 and soft delete the reply when requested by the owner', async () => {
      const server = await createServer(container);

      // Register user
      await server.inject({
        method: 'POST',
        url: '/users',
        payload: {
          username: 'userhapusreply',
          password: 'secret',
          fullname: 'User Hapus Reply',
        },
      });

      // Login user
      const loginResponse = await server.inject({
        method: 'POST',
        url: '/authentications',
        payload: {
          username: 'userhapusreply',
          password: 'secret',
        },
      });
      const { accessToken } = JSON.parse(loginResponse.payload).data;

      // Add thread
      const threadResponse = await server.inject({
        method: 'POST',
        url: '/threads',
        payload: {
          title: 'thread title',
          body: 'thread body',
        },
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const threadId = JSON.parse(threadResponse.payload).data.addedThread.id;

      // Add comment
      const commentResponse = await server.inject({
        method: 'POST',
        url: `/threads/${threadId}/comments`,
        payload: {
          content: 'komentar',
        },
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const commentId = JSON.parse(commentResponse.payload).data.addedComment.id;

      // Add reply
      const replyResponse = await server.inject({
        method: 'POST',
        url: `/threads/${threadId}/comments/${commentId}/replies`,
        payload: {
          content: 'ini balasan',
        },
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const replyId = JSON.parse(replyResponse.payload).data.addedReply.id;

      // Act
      const deleteResponse = await server.inject({
        method: 'DELETE',
        url: `/threads/${threadId}/comments/${commentId}/replies/${replyId}`,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      // Assert
      const responseJson = JSON.parse(deleteResponse.payload);
      expect(deleteResponse.statusCode).toBe(200);
      expect(responseJson.status).toBe('success');

      const replies = await RepliesTableTestHelper.findReplyById(replyId);
      expect(replies[0].is_delete).toBe(true);
    });

    it('should respond 403 when user tries to delete a reply they do not own', async () => {
      const server = await createServer(container);

      // Register owner
      await server.inject({
        method: 'POST',
        url: '/users',
        payload: {
          username: 'owner',
          password: 'secret',
          fullname: 'Owner User',
        },
      });

      // Register intruder
      await server.inject({
        method: 'POST',
        url: '/users',
        payload: {
          username: 'otheruser',
          password: 'secret',
          fullname: 'Other User',
        },
      });

      // Login as owner
      const loginOwner = await server.inject({
        method: 'POST',
        url: '/authentications',
        payload: {
          username: 'owner',
          password: 'secret',
        },
      });
      const ownerToken = JSON.parse(loginOwner.payload).data.accessToken;

      // Login as intruder
      const loginOther = await server.inject({
        method: 'POST',
        url: '/authentications',
        payload: {
          username: 'otheruser',
          password: 'secret',
        },
      });
      const otherToken = JSON.parse(loginOther.payload).data.accessToken;

      // Add thread
      const threadResponse = await server.inject({
        method: 'POST',
        url: '/threads',
        payload: {
          title: 'judul',
          body: 'isi',
        },
        headers: {
          Authorization: `Bearer ${ownerToken}`,
        },
      });
      const threadId = JSON.parse(threadResponse.payload).data.addedThread.id;

      // Add comment
      const commentResponse = await server.inject({
        method: 'POST',
        url: `/threads/${threadId}/comments`,
        payload: {
          content: 'komen',
        },
        headers: {
          Authorization: `Bearer ${ownerToken}`,
        },
      });
      const commentId = JSON.parse(commentResponse.payload).data.addedComment.id;

      // Add reply
      const replyResponse = await server.inject({
        method: 'POST',
        url: `/threads/${threadId}/comments/${commentId}/replies`,
        payload: {
          content: 'reply milik owner',
        },
        headers: {
          Authorization: `Bearer ${ownerToken}`,
        },
      });
      const replyId = JSON.parse(replyResponse.payload).data.addedReply.id;

      // Try deleting with unauthorized user
      const response = await server.inject({
        method: 'DELETE',
        url: `/threads/${threadId}/comments/${commentId}/replies/${replyId}`,
        headers: {
          Authorization: `Bearer ${otherToken}`,
        },
      });

      // Assert
      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toBe(403);
      expect(responseJson.status).toBe('fail');
      expect(responseJson.message).toBeDefined();
    });
  });
});
