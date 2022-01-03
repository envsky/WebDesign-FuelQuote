const LocalStrategy = require("passport-local").Strategy;
const pool = require("./db");
const bcrypt = require("bcrypt");

function initialize(passport) {
    console.log("Initialized");

    const authenticateUser = (id, password, authenticated) => {
      console.log(id, password);
      pool.query(
        `SELECT * FROM users WHERE user_id = $1`,
        [id],
        (err, results) => {
          if (err) {
            throw err;
          }
          console.log(results.rows);
  
          if (results.rows.length > 0) {
            const user = results.rows[0];
  
            bcrypt.compare(password, user.password, (err, isMatch) => {
              if (err) {
                console.log(err);
              }
              if (isMatch) {
                return authenticated(null, user);
              } else {
                //password is incorrect
                return authenticated(null, false, { message: "Password is incorrect" });
              }
            });
          } 
          else {
            // No user
            return authenticated(null, false, {message: "Username not found"});
          }
        }
      );
    };
  
    passport.use(
      new LocalStrategy(
        {usernameField: "loginUserID", passwordField: "loginPass"},
        authenticateUser
      )
    );

    passport.serializeUser((user, authenticated) => authenticated(null, user.user_id));
  
    passport.deserializeUser((id, authenticated) => {
      pool.query(`SELECT * FROM users WHERE user_id = $1`, [id], (err, results) => {
        if (err) {
          return authenticated(err);
        }
        console.log(`user ID is ${results.rows[0].user_id}`);
        return authenticated(null, results.rows[0]);
      });
    });
}
  
module.exports = initialize;