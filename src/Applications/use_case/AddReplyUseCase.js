const NewReply = require('../../Domains/replies/entities/NewReply');

class AddReplyUseCase {
  constructor({ commentRepository, replyRepository, threadRepository }) {
    this._commentRepository = commentRepository;
    this._replyRepository = replyRepository;
    this._threadRepository = threadRepository;
  }

  async execute(useCasePayload) {
    const { content, threadId, commentId, owner } = useCasePayload;

    const newReply = new NewReply({ content, commentId, owner });

    await this._threadRepository.verifyThreadExists(threadId);
    await this._commentRepository.verifyCommentExists(commentId);

    return this._replyRepository.addReply(newReply);
  }
}

module.exports = AddReplyUseCase;