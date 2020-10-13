const AWS = require('aws-sdk');
AWS.config.update({ region: 'us-west-2' });

const ddb = new AWS.DynamoDB.DocumentClient();
const ses = new AWS.SES();

exports.handler = async (event, context) => {
    console.log("event: ", JSON.stringify(event));
    console.log("context: ", JSON.stringify(context));

    // get unsublink path
    const eventParts = event.path.split("/");
    console.log(eventParts);
    if (eventParts.length <= 3) {
        return this.return500("failed to unsubscribe");
    }

    const email = eventParts[2];
    const receivedUnsubCode = eventParts[3];
    console.log("receivedUnsubCode: " + receivedUnsubCode);
    console.log("email: " + email);

    try {
        // get unsub link from DDB
        const userData = await ddb.query({
            TableName : process.env.SUB_TABLE_NAME,
            KeyConditionExpression: "#em = :emailStr",
            ExpressionAttributeNames:{
                "#em": "email"
            },
            ExpressionAttributeValues: {
                ":emailStr": email
            }
        }).promise();

        console.log(userData);
        const fullDDBUnsubLink = userData.Items[0].unsubscribeLink;
        const ddbUnsubCode = fullDDBUnsubLink.split("/")[6];

        // if user has same unsubscribe link as I originally generated
        if (ddbUnsubCode === receivedUnsubCode) {
            // delete user data
            await ses.deleteIdentity({ Identity: email }).promise();
            await ddb.delete({
                TableName: process.env.SUB_TABLE_NAME,
                Key:{
                    "email": email
                }
            }).promise();

            // send txt to me to notify of new subscriber
            // await sns.publish({
            //   Message: `User UNSUBSCRIBED: \nEmail: ${email}\nName: ${firstname} ${lastname}`,
            //   PhoneNumber: process.env.PHONE_NUMBER,
            // }).promise();

            return {
                statusCode: 200,
                body: "SUCCESS: You're now unsubscribed. Sorry to see you go.",
                headers: {
                    "Access-Control-Allow-Headers" : "Content-Type",
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "OPTIONS,POST,GET"
                },
            };
        } else {
            console.log("BAD UNSUBSCRIBE LINK");
            console.log(ddbUnsubLink);
            console.log(receivedUnsubCode);
            this.return500("failed to unsubscribe");
        }
      } catch (e) {
        console.error(e);
        this.return500("failed to unsubscribe");
      }
};
  
exports.return500 = (message) => {
    return {
        statusCode: 500,
        body: 'FAILURE: ' + message,
    headers: {
        "Access-Control-Allow-Headers" : "Content-Type",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "OPTIONS,POST,GET"
    },
    };
}