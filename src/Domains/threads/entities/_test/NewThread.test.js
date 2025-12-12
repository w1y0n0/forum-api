const NewThread = require('../NewThread');

describe('NewThread entity', () => {
  it('should throw error if payload not contain needed property', () => {
    expect(() => new NewThread({ title: 'judul' })).toThrow('NEW_THREAD.NOT_CONTAIN_NEEDED_PROPERTY');
  });

  it('should throw error if payload not meet data type specification', () => {
    const payload = { title: 123, body: 'isi', owner: {} };
    expect(() => new NewThread(payload)).toThrow('NEW_THREAD.NOT_MEET_DATA_TYPE_SPECIFICATION');
  });

  it('should create NewThread object correctly', () => {
    const payload = { title: 'judul', body: 'isi', owner: 'user-123' };
    const newThread = new NewThread(payload);

    expect(newThread.title).toEqual(payload.title);
    expect(newThread.body).toEqual(payload.body);
    expect(newThread.owner).toEqual(payload.owner);
  });
});