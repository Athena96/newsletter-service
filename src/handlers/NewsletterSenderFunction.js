const AWS = require('aws-sdk');
AWS.config.update({ region: 'us-west-2' });

const s3 = new AWS.S3();
const ses = new AWS.SES();

exports.handler = async (event, context) => {
  console.log("event: ", JSON.stringify(event));
  console.log("context: ", JSON.stringify(context));

  const msg = event.Records[0].messageAttributes;
  console.log(msg);

  // get newsletter
  const s3data = await s3.getObject({
    Bucket: process.env.BUCKET_NAME,
    Key: msg.objectKey.stringValue
  }).promise();
  var newsletter = s3data.Body.toString();

  // send letters out
  console.log("Sending letter to subscribers...");

  // append unsubscribe link to the newsletter.
  if (msg.unsubscribeLink.stringValue) {
    const fullDDBUnsubLink = msg.unsubscribeLink.stringValue;
    newsletter = newsletter + "<p><a href=\"" + fullDDBUnsubLink + "\"" + ">unsubscribe</a></p>";
    
    console.log('Sending newsletter to: ' + msg.email.stringValue);
    await sendSNSEmail([msg.email.stringValue], newsletter);
  }
};

async function sendSNSEmail(subscriber, newsletter) {
  if (process.env.ACTUALLY_SEND_EMAILS === 'true') {
    await ses.sendEmail({
      Destination: {
        ToAddresses: subscriber
      },
      Message: {
        Body: {
          Html: {
            Charset: "UTF-8",
            Data: newsletter
          }
        },
        Subject: {
          Charset: 'UTF-8',
          Data: "The Jared Franzone Newsletter"
        }
      },
      Source: 'jaredfranzone@gmail.com'
    }).promise();
  } else {
    console.log("ACTUALLY_SEND_EMAILS=false: Would be sending email to: " + subscriber);
  }
}