
var AWS = require('aws-sdk-mock');
var AWST = require('aws-sdk');

const Follower = require('../../src/Model/Follower');
const subHelper = require('../../src/Helper/SubscriberHelper');
const subscribeEvent = require('../../events/event-subscribe.json');

describe('Test SubscriberHelper', () => {
    const tstApiCode = 'mytestapicode';

    beforeEach(() => {
        process.env.API_ID_PARAM_NAME = tstApiCode;
        process.env.AWS_REGION = 'us-west-2';
        const retVal = {
            Parameter: {
                Value: tstApiCode
            }
        };
        AWS.mock('SSM', 'getParameter', (params, callback) => {
            callback(null, retVal);
        });
    });

    afterEach(() => {
        AWS.restore();
    });

    it('should sendCustomVerificationEmail iowejdew', async () => {
        const follower = new Follower(subscribeEvent);
        console.log("follower: " + JSON.stringify(follower));

        AWS.setSDKInstance(AWST);
        console.log("setSDKInstance");

        const ssm = new AWST.SSM();
        console.log("ssm Mock");

        const unsublink = await subHelper.generateUnsubscribeLink(follower, ssm);
        console.log("RETURN: " + unsublink);
        expect(unsublink.split('/').length).toBeGreaterThan(2);
    });
});
