
class UnsubscribeRequest {
    constructor(event) {
        this.email = event.pathParameters.email;
        this.unsubscribeCode = event.pathParameters.unsubLink;
    }       
}

module.exports = UnsubscribeRequest;
