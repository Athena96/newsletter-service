const AWS = require('aws-sdk');
AWS.config.update({ region: 'us-west-2' });

var s3 = new AWS.S3();

exports.handler = async (event, context) => {
  console.log("EVENT");
  console.log(event);

  const msg = event.Records[0].messageAttributes;
  console.log(msg);

  // get newsletter
  var newsletter = "";
  const s3params = {
    Bucket: process.env.BUCKET_NAME,
    Key: msg.objectKey.stringValue
  };
  console.log(s3params);
  await s3.getObject(s3params).promise().then(data => {
    console.info("Got newsletter! bout to send it.");
    console.info(data.Body.toString());
    newsletter = data.Body.toString();
  }).catch(err => {
    console.error("Error calling S3 getObject:", err);
  });

  // send letters out
  console.log("Sending letter to subscribers...");

  if (msg.unsubscribeLink.stringValue) {
    const fullDDBUnsubLink = msg.unsubscribeLink.stringValue;
    newsletter = newsletter + "<p><a href=\"" + fullDDBUnsubLink + "\"" + ">unsubscribe</a></p>";
    console.log('Sending newsletter to: ' + msg.email.stringValue);

    // send
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
    console.log("FAKE sending email to: " + subscriber);
  }
}