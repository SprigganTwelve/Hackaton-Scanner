const bcrypt = require("bcrypt");

class PasswordHasher {
  static async hash(password) {
    const saltRounds = 10;

    if (typeof password !== "string" || password.length === 0) {
      throw new Error("PasswordHasher.hash: password missing/invalid");
    }

    return await bcrypt.hash(password, saltRounds);
  }

  static async compare(password, hashedPassword) {
    if (!password || !hashedPassword) return false;
    return await bcrypt.compare(password, hashedPassword);
  }
}

module.exports = PasswordHasher;