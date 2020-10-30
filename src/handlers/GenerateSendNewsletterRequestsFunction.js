const AWS = require('aws-sdk');
AWS.config.update({ region: 'us-west-2' });

const sqs = new AWS.SQS();
const ssm = new AWS.SSM();
const ddb = new AWS.DynamoDB.DocumentClient();

var allDDBSubscribers = [];

exports.handler = async (event, context) => {
  console.log("event: ", JSON.stringify(event));
  console.log("context: ", JSON.stringify(context));

   try {
    // get lates API code incase it changed.
    const paramData = await ssm.getParameter({
      Name: process.env.API_ID_PARAM_NAME,
    }).promise();
    const currentApiCode = paramData.Parameter.Value;

    // get all subscribers from DDB  
    await getAllSubscribersFromDDB({
      TableName: process.env.SUB_TABLE_NAME,
      Limit: process.env.BATCH_SIZE
    });

    console.log(allDDBSubscribers);

    const queueUrl = await sqs.getQueueUrl({
      QueueName: process.env.QUEUE_NAME
    }).promise();

    var filteredSubscribers = [];
    if (process.env.SEND_TEST && process.env.SEND_TEST !== '') {
      filteredSubscribers = allDDBSubscribers.filter(function(subscriber){
        return subscriber.email.includes(process.env.SEND_TEST);
      });
    } else {
      filteredSubscribers = allDDBSubscribers;
    }
   
    // write all to SQS
    for (const subscriber of filteredSubscribers) {
      console.log(subscriber);
      if (subscriber.unsubscribeLink && subscriber.unsubscribeLink !== "") {
        // update unsub link to use latest API code
        const currentUnsublink = updateUnsubLink(subscriber, currentApiCode);

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

  } catch(error) {
    console.error(error);
  }
};

function updateUnsubLink(subscriber, currentApiCode) {
  var parts = subscriber.unsubscribeLink.split(".")
  parts[0] = 'https://' + currentApiCode;
  return parts.join('.');
}

async function getAllSubscribersFromDDB(params) { 
  let data = await ddb.scan(params).promise();
  console.log(JSON.stringify(data));

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