
/**
 * Class representing the playload of a JWT token used for authentication.
 */
class AuthJwtPayload {
    constructor({userId}) {
        this.sub = userId;  // Subject or subscriber of the toke, referes to the user id in our case
        this.iat = Math.floor(Date.now()/ 1000);// number of seconds since  1970
    }
}

module.exports = AuthJwtPayload