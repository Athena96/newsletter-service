const Follower = require('../Model/Follower');
const AWS = require('aws-sdk');
AWS.config.update({ region: 'us-west-2' });
const SES = require('aws-sdk/clients/ses');
const SNS = require('aws-sdk/clients/sns');
const SSM = require('aws-sdk/clients/ssm');

const { subscribeToNewsletter } = require('../Helper/SubscriberHelper');
const ddb = new AWS.DynamoDB.DocumentClient();

const ses = new SES({ region: 'us-west-2' });
const sns = new SNS({ region: 'us-west-2' });
const ssm = new SSM({ region: 'us-west-2' });

exports.handler = async (event, context) => {
  console.log("event: ", JSON.stringify(event));
  console.log("context: ", JSON.stringify(context));

  try {
    const follower = new Follower(event);
    await subscribeToNewsletter(follower, ses, ddb, sns, ssm);
    
    console.log("SUCCESS: verification email sent");
    return {
      statusCode: 200,
      body: 'SUCCESS: verification email sent',
      headers: getCORSHeaders(),
    };

  } catch (e) {
    console.error(e);
    console.log("FAILURE: failed to send validation email");
    return {
      statusCode: 500,
      body: 'FAILURE: failed to send validation email',
      headers: getCORSHeaders(),
    };
  }
};

getCORSHeaders = () => {
  return {
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "OPTIONS,POST,GET"
  };
};