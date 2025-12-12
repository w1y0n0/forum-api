const NewComment = require('../NewComment');

describe('NewComment entity', () => {
  it('should throw error when payload does not contain needed property', () => {
    const payload = {
      content: 'komentar',
      threadId: 'thread-123',
    };

    expect(() => new NewComment(payload)).toThrow('NEW_COMMENT.NOT_CONTAIN_NEEDED_PROPERTY');
  });

  it('should throw error when payload has invalid data type', () => {
    const payload = {
      content: 123,
      threadId: {},
      owner: [],
    };

    expect(() => new NewComment(payload)).toThrow('NEW_COMMENT.NOT_MEET_DATA_TYPE_SPECIFICATION');
  });

  it('should create NewComment object correctly', () => {
    const payload = {
      content: 'komentar test',
      threadId: 'thread-abc',
      owner: 'user-xyz',
    };

    const newComment = new NewComment(payload);

    expect(newComment.content).toEqual(payload.content);
    expect(newComment.threadId).toEqual(payload.threadId);
    expect(newComment.owner).toEqual(payload.owner);
  });
});
