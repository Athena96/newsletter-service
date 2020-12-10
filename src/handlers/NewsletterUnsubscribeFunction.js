const UnsubscribeRequest = require('../Model/UnsubscribeRequest');
const { unsubscribeFromNewsletter } = require('../Helper/UnsubscriberHelper');

const AWS = require('aws-sdk');
AWS.config.update({ region: 'us-west-2' });

const ddb = new AWS.DynamoDB.DocumentClient();
const ses = new AWS.SES();

exports.handler = async (event, context) => {
    console.log("event: ", JSON.stringify(event));
    console.log("context: ", JSON.stringify(context));
    try {
        const unsubscribeRequest = new UnsubscribeRequest(event);
        await unsubscribeFromNewsletter(unsubscribeRequest, ses, ddb);
        return {
            statusCode: 200,
            body: "SUCCESS: You're now unsubscribed. Sorry to see you go.",
            headers: {
                "Access-Control-Allow-Headers" : "Content-Type",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "OPTIONS,POST,GET"
            },
        };
    } catch (e) {
        console.error(e);
        return {
            statusCode: 500,
            body: 'FAILURE: failed to unsubscribe',
            headers: {
                "Access-Control-Allow-Headers" : "Content-Type",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "OPTIONS,POST,GET"
            },
        };

    }
};
  