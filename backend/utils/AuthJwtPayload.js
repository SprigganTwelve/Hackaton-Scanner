
/**
 * Class representing the playload of a JWT token used for authentication.
 */
class AuthJwtPayload {
    constructor({userId}) {
        this.sub = userId;  // Subject or subscriber of the toke, referes to the user id in our case
        this.iat = new Date(); //means "issued_at", the timestamp when the token was issued
    }
}