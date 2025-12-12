/* eslint-disable camelcase */
/* istanbul ignore file */
const pool = require('../src/Infrastructures/database/postgres/pool');

const CommentsTableTestHelper = {
  async addComment({
    id = 'comment-123',
    content = 'komentar',
    threadId = 'thread-123',
    owner = 'user-123',
    date = new Date().toISOString(),
    is_delete = false,
  }) {
    const query = {
      text: 'INSERT INTO comments (id, content, thread_id, owner, date, is_delete) VALUES($1, $2, $3, $4, $5, $6)',
      values: [id, content, threadId, owner, date, is_delete],
    };
    await pool.query(query);
  },

  async findCommentById(id) {
    const query = {
      text: 'SELECT * FROM comments WHERE id = $1',
      values: [id],
    };
    const result = await pool.query(query);
    return result.rows;
  },

  async cleanTable() {
    await pool.query('DELETE FROM comments WHERE 1=1');
  },
};

module.exports = CommentsTableTestHelper;
