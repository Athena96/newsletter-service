const sha1 = require('sha1');

exports.subscribeToNewsletter = async (follower, ses, ddb, sns, ssm) => {
    console.log("send validation email to user (throws if already subscribed)");
    await ses.sendCustomVerificationEmail({
        EmailAddress: follower.email,
        TemplateName: "JaredNewsletterTemplatev2", /* todo make this env var */
    }).promise();

    const unsubscribeLink = await this.generateUnsubscribeLink(follower, ssm);
    console.log("Generated unsubscribe link: " + unsubscribeLink + " for user: " + follower.email);
    console.log("Write new subscriber to DDB");
    await ddb.put({
        Item: {
            "email": follower.email,
            "unsubscribeLink": unsubscribeLink,
            "firstname": follower.firstname,
            "lastname": follower.lastname
        },
        TableName: process.env.SUB_TABLE_NAME
    }).promise();

    console.log("send txt to me to notify of new subscriber");
    await sns.publish({
        Message: `New Subscriber: \nEmail: ${follower.email}\nName: ${follower.firstname} ${follower.lastname}`,
        PhoneNumber: process.env.PHONE_NUMBER,
    }).promise();
};

exports.generateUnsubscribeLink = async (follower, ssm) => {
    console.log("get current API code (used later in unsub link)");
    const paramData = await ssm.getParameter({
        Name: process.env.API_ID_PARAM_NAME,
    }).promise();
    console.log("paramdata: "+ JSON.stringify(paramData));
    const apiId = paramData.Parameter.Value;
    const time = (new Date()).getTime();
    return "https://"+apiId+".execute-api."+process.env.AWS_REGION+".amazonaws.com/prod/unsubscribe/" + follower.email + "/" + sha1(follower.email+time);
};