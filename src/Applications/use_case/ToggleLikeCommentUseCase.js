class ToggleLikeCommentUseCase {
  constructor({ threadRepository, commentRepository }) {
    this._threadRepository = threadRepository;
    this._commentRepository = commentRepository;
  }

  async execute(useCasePayload) {
    const { threadId, commentId, userId } = useCasePayload;

    // Verifikasi apakah thread dan komentar ada
    await this._threadRepository.verifyThreadExists(threadId);
    await this._commentRepository.verifyCommentExists(commentId);

    // Toggle like
    await this._commentRepository.toggleLikeComment(commentId, userId);
  }
}

module.exports = ToggleLikeCommentUseCase;