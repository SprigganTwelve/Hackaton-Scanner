
class AuthJwtPayload {
    constructor({userId}) {
        this.sub = userId;
        this.iat = new Date();
    }
}