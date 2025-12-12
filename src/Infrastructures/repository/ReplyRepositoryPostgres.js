const ReplyRepository = require('../../Domains/replies/ReplyRepository');
const AddedReply = require('../../Domains/replies/entities/AddedReply');
const NotFoundError = require('../../Commons/exceptions/NotFoundError');
const AuthorizationError = require('../../Commons/exceptions/AuthorizationError');

class ReplyRepositoryPostgres extends ReplyRepository {
  constructor(pool, idGenerator) {
    super();
    this._pool = pool;
    this._idGenerator = idGenerator;
  }

  async addReply(newReply) {
    const { content, commentId, owner } = newReply;
    const id = `reply-${this._idGenerator()}`;
    const date = new Date().toISOString();

    const query = {
      text: `INSERT INTO replies (id, content, comment_id, owner, date)
              VALUES ($1, $2, $3, $4, $5)
              RETURNING id, content, owner`,
      values: [id, content, commentId, owner, date],
    };

    const result = await this._pool.query(query);

    return new AddedReply(result.rows[0]);
  }

  async deleteReply(replyId) {
    const query = {
      text: 'UPDATE replies SET is_delete = true WHERE id = $1',
      values: [replyId],
    };

    await this._pool.query(query);
  }

  async verifyReplyExists(replyId) {
    const query = {
      text: 'SELECT 1 FROM replies WHERE id = $1',
      values: [replyId],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('Reply tidak ditemukan');
    }
  }

  async verifyReplyOwner(replyId, owner) {
    const query = {
      text: 'SELECT owner FROM replies WHERE id = $1',
      values: [replyId],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('Reply tidak ditemukan');
    }

    if (result.rows[0].owner !== owner) {
      throw new AuthorizationError('Anda tidak berhak mengakses resource ini');
    }
  }

  async getRepliesByCommentIds(commentIds) {
    const query = {
      text: `
        SELECT replies.id, replies.comment_id, replies.content, replies.date, replies.is_delete, users.username
        FROM replies
        INNER JOIN users ON replies.owner = users.id
        WHERE replies.comment_id = ANY($1::VARCHAR[])
        ORDER BY replies.date ASC
      `,
      values: [commentIds],
    };

    const result = await this._pool.query(query);

    return result.rows;
  }
}

module.exports = ReplyRepositoryPostgres;
