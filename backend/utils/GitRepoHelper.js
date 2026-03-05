const UserRepository = require('../repositories/UserRepository');


/**
 * Utility class for Git repository related operations
 * such as checking if a GitHub repository exists.
 */
class GitRepoHelper {

    /**
     * Check if a GitHub repository exists and is accessible
     * @param {string} url - GitHub repository URL
     * @param {string} userId - User identifier
     * @param {string|null} token - Optional GitHub access token
     * @returns {Promise<boolean>}
     */
    static async repoExists(url, userId, token) {

        // Extract owner and repo from URL
        const match = url.match(/github\.com[:\/]([^\/]+)\/([^\/]+?)(?:\.git)?$/);
        if (!match) 
            return false;

        const owner = match[1];
        const repo = match[2];

        const apiUrl = `https://api.github.com/repos/${owner}/${repo}`;

        try {
            const res = await fetch(apiUrl);

            // Public repository
            if (res.status === 200) {
                return true;
            }

            /**
             * If repo is private GitHub may return:
             * 404 (not found) or 403 (forbidden)
             */
            if (res.status === 403 || res.status === 404) {

                // Try with user access token
                const access_token = token ?? await UserRepository.getUserAccessToken(userId);

                if (!access_token) {
                    return false;
                }

                const authRes = await fetch(apiUrl, {
                    headers: {
                        Authorization: `token ${access_token}`
                    }
                });

                // Private repo but accessible with token
                if (authRes.status === 200) {
                    return true;
                }

                return false;
            }

            return false;

        }
        catch (error) {
            console.error("GitHub API error:", error.message);
            return false;
        }
    }
}

module.exports = GitRepoHelper;