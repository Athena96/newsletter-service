const AWS = require('aws-sdk');
AWS.config.update({ region: 'us-west-2' });

const sqs = new AWS.SQS();
var ssm = new AWS.SSM();
var ddb = new AWS.DynamoDB.DocumentClient();
var allDDBSubscribers = [];

async function getAllSubscribersFromDDB(params) { 
  console.log("getAllSubscribersFromDDB");
  let data = await ddb.scan(params).promise();
  console.log(data);
  console.log(data['Items']);

  if (data['Items'].length > 0) {
    allDDBSubscribers = [...allDDBSubscribers, ...data['Items']];
  }

  if (typeof data.LastEvaluatedKey != "undefined") {
      params.ExclusiveStartKey = data.LastEvaluatedKey;
      return await getAllSubscribersFromDDB(params);
  } else {
      return data;
  }
}

exports.handler = async (event, context) => {

  // get lates API code incase it changed.
  const paramData = await ssm.getParameter({
    Name: process.env.API_ID_PARAM_NAME,
  }).promise();
  const currentApiCode = paramData.Parameter.Value;

  // get all subscribers from DDB  
  try {
    await getAllSubscribersFromDDB({
      TableName: process.env.SUB_TABLE_NAME,
      Limit: process.env.BATCH_SIZE
    });
    console.log("allDDBSubscribers: ");
    console.log(allDDBSubscribers);
  } catch(error) {
    console.error(error);
  }

  const queueUrl = await sqs.getQueueUrl({
    QueueName: process.env.QUEUE_NAME
  }).promise();
  console.log(process.env.QUEUE_NAME);

  console.log(queueUrl);

  // write all to SQS
  for (const subscriber of allDDBSubscribers) {
    console.log(subscriber);
    console.log("attributes to send");
    if (subscriber.unsubscribeLink && subscriber.unsubscribeLink !== "") {
      var parts = subscriber.unsubscribeLink.split(".")
      parts[0] = 'https://' + currentApiCode;
      const currentUnsublink = parts.join('.');
      const res = await sqs.sendMessage({
        MessageBody: "new message" + subscriber.email,
        QueueUrl: queueUrl.QueueUrl,
        MessageAttributes: {
          "objectKey": {
            DataType: "String",
            StringValue: event.Records[0].s3.object.key
          },
          "email": {
            DataType: "String",
            StringValue: subscriber.email
          },
          "firstname": {
            DataType: "String",
            StringValue: subscriber.firstname
          },
          "unsubscribeLink": {
            DataType: "String",
            StringValue: currentUnsublink
          }
        }
      }).promise();
      console.log(res);
    }
  }

};

