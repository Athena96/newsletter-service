const sha1 = require('sha1');
const AWS = require('aws-sdk');
AWS.config.update({ region: 'us-west-2' });

var ddb = new AWS.DynamoDB.DocumentClient();
var ses = new AWS.SES();
var sns = new AWS.SNS();
var ssm = new AWS.SSM();

exports.generateUnsubscribeLinkForUser = (email, apiId) => {
  const time = (new Date()).getTime();
  return "https://"+apiId+".execute-api."+process.env.AWS_REGION+".amazonaws.com/prod/unsubscribe/" + email + "/" + sha1(email+time);
}

exports.handler = async (event, context) => {
  console.log("EVENT: ", event);
  console.log("CONTEXT: ", context);

  const paramData = await ssm.getParameter({
    Name: process.env.API_ID_PARAM_NAME,
  }).promise();

  let body = JSON.parse(event.body)
  console.log(body);

  const email = body.email;
  const firstname = body.firstname || '';
  const lastname = body.lastname || '';
  console.log(email, firstname, lastname);

  try {

    // send validation email to user (throws if already subscribed)
    await ses.sendCustomVerificationEmail({
      EmailAddress: email,
      TemplateName: "JaredNewsletterTemplatev2", /* todo make this env var */
    }).promise();

    // write user data to DDB
    const unsubscribeLink = this.generateUnsubscribeLinkForUser(email, paramData.Parameter.Value);
    console.log("Generated unsubscribe link: " + unsubscribeLink + " for user: " + email);
    await ddb.put({
      Item: {
        "email": email,
        "unsubscribeLink": unsubscribeLink,
        "firstname": firstname,
        "lastname": lastname
      },
      TableName: process.env.SUB_TABLE_NAME
    }).promise();
    
    // send txt to me to notify of new subscriber
    await sns.publish({
      Message: `New Subscriber: \nEmail: ${email}\nName: ${firstname} ${lastname}`,
      PhoneNumber: process.env.PHONE_NUMBER,
    }).promise();

    console.log("SUCCESS: verification email sent");

    return {
      statusCode: 200,
      body: 'SUCCESS: verification email sent',
      headers: {
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "OPTIONS,POST,GET"
      },
    };

  } catch (e) {
    console.error(e);
    console.log("FAILURE: failed to send validation emai");

    return {
      statusCode: 500,
      body: 'FAILURE: failed to send validation email',
      headers: {
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "OPTIONS,POST,GET"
      },
    };
  }
};

