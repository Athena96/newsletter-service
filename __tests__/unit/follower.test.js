const subscribeEvent = require('../../events/event-subscribe.json');
const Follower = require('../../src/Model/Follower');

describe('Test Follower', () => {
  it('should parse an email, first, and last name from a Lambda event', () => {
    const follower = new Follower(subscribeEvent);
    expect(follower.email).toEqual("someuseremail@email.com");
    expect(follower.firstname).toEqual("John");
    expect(follower.lastname).toEqual("Smith");
  });
});
