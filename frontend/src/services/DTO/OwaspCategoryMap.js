
import MappedIssue from './MappedIssue'

class OwaspCategoryMap
{
    /**
     * @typedef {Object} OwaspIssuesMap
     * @property {MappedIssue[]} [A01_Broken_Access_Control]
     * @property {MappedIssue[]} [A02_Cryptographic_Failures]
     * @property {MappedIssue[]} [A03_Injection]
     * @property {MappedIssue[]} [A04_Insecure_Design]
     * @property {MappedIssue[]} [A05_Security_Misconfiguration]
     * @property {MappedIssue[]} [A06_Vulnerable_And_Outdated_Components]
     * @property {MappedIssue[]} [A07_Identification_And_Authentication_Failures]
     * @property {MappedIssue[]} [A08_Software_And_Data_Integrity_Failures]
     * @property {MappedIssue[]} [A09_Security_Logging_And_Monitoring_Failures]
     * @property {MappedIssue[]} [A10_Server_Side_Request_Forgery]
     * 
     * @property {MappedIssue[]} [others]
     */

    /**
     * @param {OwaspIssuesMap} param0
     */
    constructor({
        A01_Broken_Access_Control = [],
        A02_Cryptographic_Failures = [],
        A03_Injection = [],
        A04_Insecure_Design = [],
        A05_Security_Misconfiguration = [],
        A06_Vulnerable_And_Outdated_Components = [],
        A07_Identification_And_Authentication_Failures = [],
        A08_Software_And_Data_Integrity_Failures = [],
        A09_Security_Logging_And_Monitoring_Failures = [],
        A10_Server_Side_Request_Forgery = [],

        others = [],
    })
    {
        this.A01_Broken_Access_Control = A01_Broken_Access_Control;
        this.A02_Cryptographic_Failures = A02_Cryptographic_Failures;
        this.A03_Injection = A03_Injection;
        this.A04_Insecure_Design = A04_Insecure_Design;
        this.A05_Security_Misconfiguration = A05_Security_Misconfiguration;
        this.A06_Vulnerable_And_Outdated_Components = A06_Vulnerable_And_Outdated_Components;
        this.A07_Identification_And_Authentication_Failures = A07_Identification_And_Authentication_Failures;
        this.A08_Software_And_Data_Integrity_Failures = A08_Software_And_Data_Integrity_Failures;
        this.A09_Security_Logging_And_Monitoring_Failures = A09_Security_Logging_And_Monitoring_Failures;
        this.A10_Server_Side_Request_Forgery = A10_Server_Side_Request_Forgery;

        this.others = others;
    }
}

export default OwaspCategoryMap
