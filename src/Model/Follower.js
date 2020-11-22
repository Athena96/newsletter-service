
class Follower {
    constructor(request) {
        const body = JSON.parse(request.body)
        console.log("Creating Follower from: ");
        console.log(body);

        this.email = body.email;
        this.firstname = body.firstname || '';
        this.lastname = body.lastname || '';
    }       
}

module.exports = Follower;
