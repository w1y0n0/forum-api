const NewReply = require('../NewReply');

describe('NewReply entity', () => {
  it('should throw error when payload does not contain needed property', () => {
    // Arrange
    const payload = {
      content: 'sebuah balasan',
      owner: 'user-123',
      // commentId missing
    };

    // Action & Assert
    expect(() => new NewReply(payload)).toThrow('NEW_REPLY.NOT_CONTAIN_NEEDED_PROPERTY');
  });

  it('should throw error when payload does not meet data type specification', () => {
    // Arrange
    const payload = {
      content: 123, // not string
      owner: 'user-123',
      commentId: 'comment-123',
    };

    // Action & Assert
    expect(() => new NewReply(payload)).toThrow('NEW_REPLY.NOT_MEET_DATA_TYPE_SPECIFICATION');
  });

  it('should create NewReply object correctly', () => {
    // Arrange
    const payload = {
      content: 'sebuah balasan',
      owner: 'user-123',
      commentId: 'comment-123',
    };

    // Action
    const newReply = new NewReply(payload);

    // Assert
    expect(newReply).toBeInstanceOf(NewReply);
    expect(newReply.content).toEqual(payload.content);
    expect(newReply.owner).toEqual(payload.owner);
    expect(newReply.commentId).toEqual(payload.commentId);
  });
});
