class GetThreadDetailUseCase {
  constructor({ threadRepository, commentRepository, replyRepository }) {
    this._threadRepository = threadRepository;
    this._commentRepository = commentRepository;
    this._replyRepository = replyRepository;
  }

  async execute(threadId) {
    await this._threadRepository.verifyThreadExists(threadId);

    const thread = await this._threadRepository.getThreadDetail(threadId);
    const comments = await this._commentRepository.getCommentsByThreadId(threadId);
    const replies = await this._replyRepository.getRepliesByCommentIds(
      comments.map((comment) => comment.id)
    );

    const repliesGrouped = {};
    replies.forEach((reply) => {
      if (!repliesGrouped[reply.comment_id]) {
        repliesGrouped[reply.comment_id] = [];
      }

      repliesGrouped[reply.comment_id].push({
        id: reply.id,
        content: reply.is_delete ? '**balasan telah dihapus**' : reply.content,
        date: reply.date,
        username: reply.username,
      });
    });

    const formattedComments = comments.map((comment) => ({
      id: comment.id,
      username: comment.username,
      date: comment.date,
      replies: repliesGrouped[comment.id] || [],
      content: comment.is_delete ? '**komentar telah dihapus**' : comment.content,
    }));

    return {
      ...thread,
      comments: formattedComments,
    };
  }
}

module.exports = GetThreadDetailUseCase;