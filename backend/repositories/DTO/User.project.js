
class UserProject {
    constructor({ projectId, name, createdAt, url, isUploaded }) {
        this.projectId = projectId;
        this.name = name;
        this.createdAt = createdAt;
        this.url = url;
        this.isUploaded = isUploaded;
    }
}

module.exports = UserProject;