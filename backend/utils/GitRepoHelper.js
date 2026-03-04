
const { execSync } = require('child_process');
const UserRepository = require('../repositories/UserRepository');

/**
 * An utilisty for git repository related operations such as checking the existing of a repository ...
 */
class GitRepoHelper {

    /** Check for repository existance **/
    static async repoExists(url, userId, token){
        const [, owner,repo ] = url.match(/github\.com[:\/]([^\/]+)\/([^\/]+)(?:\.git)?$/) || [];
        if(!owner || !repo)
            return false;

        const res = await fetch('https://api.github.com/repos/${owner}/${repo}')

        if(res.status === 200)
            return true;
        /**
         * An error occured due to the repository beeing private,
         * so we will try to access it using the access token of the user
        **/
        if(res.status === 403) //Access dinied
        {
            const access_token = token ?? await UserRepository.getUserAccessToken(userId)
            if(!access_token)
                return
            const authRes = await fetch(
                'https://api.github.com/repos/${owner}/${repo}', 
                {
                    headers: { Authorization:`token ${access_token}`}
                }
            )

            //everything went well, the repository is private but we have access to it
            if(authRes.status === 200)
                return true;

            return false; //the repository is private and we don't have access to it
        }
        
        return false; //the repository doesn't exist
        
    }

}

module.exports = GitRepoHelper;