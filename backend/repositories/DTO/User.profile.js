
class UserProfile{
    constructor({userId, name, email, git_url})
    {
        this.userId = userId;
        this.name = name;
        this.email = email;
        this.git_url = git_url;
    }
}

module.exports = UserProfile;