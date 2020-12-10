const unsubscribeEvent = require('../../events/event-un-subscribe.json');
const UnsubscribeRequest = require('../../src/Model/UnsubscribeRequest');

describe('Test UnsubscribeRequest', () => {
  it('should parse an Unsubscribe Request, email, and unsubscribeCode from a Lambda event', () => {
    const unsubscribeRequest = new UnsubscribeRequest(unsubscribeEvent);
    expect(unsubscribeRequest.email).toEqual("zenspending@gmail.com");
    expect(unsubscribeRequest.unsubscribeCode).toEqual("679b98318e386faaa4f6f8fc50948cc93189393a");
  });
});
