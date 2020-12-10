
exports.unsubscribeFromNewsletter = async (unsubscribeRequest, ses, ddb) => {
    // get unsub link from DDB
    const userData = await ddb.query({
        TableName : process.env.SUB_TABLE_NAME,
        KeyConditionExpression: "#em = :emailStr",
        ExpressionAttributeNames:{
            "#em": "email"
        },
        ExpressionAttributeValues: {
            ":emailStr": unsubscribeRequest.email
        }
    }).promise();
    console.log(userData);

    const fullDDBUnsubLink = userData.Items[0].unsubscribeLink;
    const ddbUnsubCode = fullDDBUnsubLink.split("/")[6];

    // if user has same unsubscribe link as I originally generated
    if (ddbUnsubCode === unsubscribeRequest.unsubscribeCode) {
        await ses.deleteIdentity({ Identity: unsubscribeRequest.email }).promise();
        await ddb.delete({
            TableName: process.env.SUB_TABLE_NAME,
            Key:{
                "email": unsubscribeRequest.email
            }
        }).promise();
    } else {
        throw `BAD UNSUBSCRIBE LINK ${ddbUnsubCode} !== ${unsubscribeRequest.unsubscribeCode}`;
    }
};