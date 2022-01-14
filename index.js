const express = require("express");
const path = require("path");
const bcrypt = require("bcrypt");
const session = require("cookie-session");
const flash = require("express-flash");
const passport = require("passport");
const pool = require("./db");
const initializePassport = require("./passportConfig");

const app = express();
const PORT = process.env.PORT || 5000;
initializePassport(passport);

const dirname = __dirname + "/client"
app.use(express.static(dirname));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(session({
      secret: "SESSION_SECRET",
      resave: false,
      saveUninitialized: false
    })
);
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');
app.set('views', dirname);

app.get('/', (req, res) => {
  res.redirect('/index');
});

app.get('/index', (req, res) => {
  res.render(path.join(dirname + '/index.html'), {message:req.flash('error')});
});

app.get("/login", (req, res) => {
  res.render(path.join(dirname + '/components/login.html'), {message:req.flash('error')});
});

app.get('/reset_password', (req, res) => {
  res.render(path.join(dirname + '/components/reset_password.html'), {message:req.flash('error')});
});

app.get("/fuel_quote", checkNotAuthenticated, async(req, res) => {
  console.log(req.isAuthenticated());
  console.log(req.user.user_id);
  var userID = req.user.user_id;
  var check = await checkAddress(userID);
  console.log(check[0].primary_address_id);

  var get = await getAddress(check[0].primary_address_id);
  var address = get[0].address.trim() + " " + get[0].city.trim() + ", " + get[0].state.trim() + " " + get[0].zipcode.trim();
  var history = await hasHistory(userID);
  var loc_factor = 0;
  var history_factor = 0;
  
  if (get[0].state.trim() == "TX") {
    loc_factor = .02;
  }
  else {
    loc_factor = .04;
  }
  
  if (history[0].count > 0) {
    history_factor = .01;
  }
  
  res.render(path.join(dirname + '/components/fuel_quote'), {address:address, loc_factor:loc_factor, history_factor:history_factor });
});

app.get("/fuel_history", checkNotAuthenticated, async(req, res) => {
  console.log(req.isAuthenticated()); 
  var userID = req.user.user_id;
  const fuelHistory = await getFuelHistory(userID);
  console.log(fuelHistory);
  res.render(path.join(dirname + '/components/fuel_history.html'), {fuelHistory:fuelHistory});
});

app.get("/dashboard", checkNotAuthenticated, async(req, res) => {
  console.log(req.isAuthenticated());
  var check = await checkProfile(req.user.user_id);
  if (check.length > 0)
    res.render(path.join(dirname + '/components/dashboard.html'), {fullName:check[0].full_name});
  else
    res.redirect("/create_profile");
});

app.get("/profile", checkNotAuthenticated, async(req, res) => {
  console.log(req.isAuthenticated());
  var check = await checkProfile(req.user.user_id);
  if (check.length > 0)
  {
    var profile = await checkProfile(req.user.user_id);
    var primaryAddressID = profile[0].primary_address_id;
    var secondaryAddressID = profile[0].secondary_address_id;
    var primaryAddress = await getAddress(primaryAddressID);
    var pAddress = primaryAddress[0].address;
    var pCity = primaryAddress[0].city;
    var pState = primaryAddress[0].state;
    var pZipcode = primaryAddress[0].zipcode;
    var secondaryAddress, sAddress, sCity, sState, sZipcode;
    if (secondaryAddressID != null)
    {
      secondaryAddress = await getAddress(secondaryAddressID);
      sAddress = secondaryAddress[0].address;
      sCity = secondaryAddress[0].city;
      sState = secondaryAddress[0].state;
      sZipcode = secondaryAddress[0].zipcode;
      res.render(path.join(dirname + '/components/profile.html'), {
        fullName:profile[0].full_name,
        pAddress:pAddress,
        pCity:pCity,
        pState:pState,
        pZipcode:pZipcode,
        sAddress:sAddress,
        sCity:sCity,
        sState:sState,
        sZipcode:sZipcode
      });
    }
    else
      res.render(path.join(dirname + '/components/profile.html'), {
        fullName:profile[0].full_name,
        pAddress:pAddress,
        pCity:pCity,
        pState:pState,
        pZipcode:pZipcode,
        sAddress:"not registered",
        sCity:"empty",
        sState:"empty",
        sZipcode:"empty"
      });
  }
  else
    res.redirect("/create_profile");
});

app.get("/edit_profile", checkNotAuthenticated, async(req, res) => {
  console.log(req.isAuthenticated());
  var profile = await checkProfile(req.user.user_id);
  var primaryAddressID = profile[0].primary_address_id;
  var secondaryAddressID = profile[0].secondary_address_id;
  var states = await getState();
  var primaryAddress = await getAddress(primaryAddressID);
  var pAddress = primaryAddress[0].address.trim();
  var pCity = primaryAddress[0].city.trim();
  var pState = primaryAddress[0].state.trim();
  var pZipcode = primaryAddress[0].zipcode.trim();
  var secondaryAddress, sAddress, sCity, sState, sZipcode;
  if (secondaryAddressID != null)
  {
    secondaryAddress = await getAddress(secondaryAddressID);
    sAddress = secondaryAddress[0].address.trim();
    sCity = secondaryAddress[0].city.trim();
    sState = secondaryAddress[0].state.trim();
    sZipcode = secondaryAddress[0].zipcode.trim();
    res.render(path.join(dirname + '/components/edit_profile.html'), {
      fullName:profile[0].full_name,
      pAddress:pAddress,
      pCity:pCity,
      pState:pState,
      pZipcode:pZipcode,
      sAddress:sAddress,
      sCity:sCity,
      sState:sState,
      sZipcode:sZipcode,
      states:states,
      message:req.flash('error')
    });
  }
  else
    res.render(path.join(dirname + '/components/edit_profile.html'), {
      fullName:profile[0].full_name,
      pAddress:pAddress,
      pCity:pCity,
      pState:pState,
      pZipcode:pZipcode,
      sAddress:"not registered",
      sCity:"empty",
      sState:"empty",
      sZipcode:"empty",
      states:states,
      message:req.flash('error')
    });
});

app.get("/logout", (req, res) => {
  req.logOut();
  req.flash('error', "You have successfully signed out");
  res.redirect("/index");
});

app.get("/create_profile", checkNotAuthenticated, async(req, res) => {
  console.log(req.isAuthenticated());
  var check = await checkProfile(req.user.user_id);
  var states = await getState();
  if (check.length > 0)
    res.redirect("/dashboard");
  else
    res.render(path.join(dirname + '/components/create_profile.html'), {states:states, message:req.flash('error')});
});

app.post("/edit_profile", checkNotAuthenticated, async(req, res) => {
  let {fullName, addressOne, cityOne, stateOne, zipCodeOne,
    addressTwo, cityTwo, stateTwo, zipCodeTwo} = req.body;
  var profile = await checkProfile(req.user.user_id);
  var primaryAddressID = profile[0].primary_address_id;
  var secondaryAddressID = profile[0].secondary_address_id;
  var secondaryAddress;
  var newAddressID;
  let errors = [];

  fullName = fullName.trim();
  addressOne = addressOne.trim();
  cityOne = cityOne.trim();
  stateOne = stateOne.trim();
  zipCodeOne = zipCodeOne.trim();
  addressTwo = addressTwo.trim();
  cityTwo = cityTwo.trim();
  stateTwo = stateTwo.trim();
  zipCodeTwo = zipCodeTwo.trim();

  if (addressTwo == "not registered")
    addressTwo = "";
  if (cityTwo == "empty")
    cityTwo = "";
  if (zipCodeTwo == "empty")
    zipCodeTwo = "";

  if (fullName.length > 50)
    errors.push({message: "Maximum length for name is 50"});
  if (addressOne.length > 100)
    errors.push({message: "Maximum length for address is 100"});
  if (cityOne.length > 100)
    errors.push({message: "Maximum length for city is 100"});
  if (zipCodeOne.length < 5)
    errors.push({message: "Minimum length for zip code is 5"});
  if (zipCodeOne.length > 9)
    errors.push({message: "Maximum length for zip code is 9"});

  if (fullName == "" || addressOne == "" || cityOne == "" || stateOne == "null" || zipCodeOne == "")
    errors.push({message: "Please enter all required fields for primary address"});
  else if (addressTwo != "" && cityTwo != "" && stateTwo != "empty" && zipCodeTwo != "")
    secondaryAddress = true;
  else if (addressTwo != "" || cityTwo != "" || stateTwo != "empty" || zipCodeTwo != "")
    errors.push({message: "Please enter all required fields for secondary address"});
  else
    secondaryAddress = false;

  if (errors.length > 0) {
    req.flash('error', errors[0].message);
    console.log(errors[0].message);
    res.redirect("/edit_profile");
  }
  else {
    await pool.query(
      `UPDATE address
        SET address = '${addressOne}',
            city = '${cityOne}',
            state = '${stateOne}',
            zipcode = '${zipCodeOne}'
        WHERE address_id = '${primaryAddressID}';`
    );
    if (secondaryAddress) {
      if (secondaryAddressID != null) {
        await pool.query(
          `UPDATE address
            SET address = '${addressTwo}',
                city = '${cityTwo}',
                state = '${stateTwo}',
                zipcode = '${zipCodeTwo}'
            WHERE address_id = '${secondaryAddressID}';`
        );
      }
      else {
        newAddressID = await pool.query(
          `INSERT INTO address (address, city, state, zipcode)
          VALUES ('${addressTwo}', '${cityTwo}', '${stateTwo}', '${zipCodeTwo}')
          RETURNING address_id`
        );
        await pool.query(
          `UPDATE profile
            SET secondary_address_id = '${newAddressID.rows[0].address_id}'
            WHERE user_id = '${profile[0].user_id}'`
        );
      }
    }
    else {
      if (secondaryAddressID != null) {
        await pool.query(`
          UPDATE profile
            SET secondary_address_id = NULL
            WHERE user_id = '${profile[0].user_id}';
          DELETE FROM address
          WHERE address_id = '${secondaryAddressID}';`
        );
      }
    }
    await pool.query(
    `UPDATE profile
      SET full_name = '${fullName}'
      WHERE user_id = '${profile[0].user_id}'`
    );
    res.redirect("/profile");
  }
});

app.post("/fuel_quote", async(req, res) => {
  let {gallonsRequested, deliveryAddress, deliveryDate, suggestedPrice, total} = req.body;
  let errors = [];
  var passed = true;
  if (!gallonsRequested || !deliveryAddress || !deliveryDate || !suggestedPrice || !total) {
    errors.push({message: "Please enter all fields"});}
  
    if (passed) {
      await pool.query(
        `INSERT INTO fuel_quote (user_id, delivery_address, delivery_date, gallons_requested, suggested_price_per_gallon, total)
            VALUES ($1, $2, $3, $4, $5, $6)`,
        [req.user.user_id, deliveryAddress, deliveryDate, gallonsRequested, suggestedPrice.substring(1), total.substring(1)],
        (err, results) => {
          if (err) {
            throw err;
          }
          console.log("FuelQuote has been created");
          res.redirect("/fuel_history");
        }
      );
    }
});

app.post("/register", async(req, res) => {
    let {registerUserID, registerEmail, registerPass, registerConfirmPass, termCondition} = req.body;
    let errors = [];
  
    if (!registerUserID || !registerEmail || !registerPass || !registerConfirmPass || !termCondition) {
      errors.push({message: "Please enter all fields"});}
    if (registerPass !== registerConfirmPass) {
      errors.push({message: "Passwords do not match"});}
    if (termCondition != "on") {
      errors.push({message: "Please review our terms and conditions"});}

    if (errors.length > 0) {
      req.flash('error', errors[0].message);
      res.redirect("/index");
    }
    else {
      hashedPassword = await bcrypt.hash(registerPass, 10);
      console.log(hashedPassword);
      var passed = true;
      var check;
      if (passed) {
        check = await checkID(registerUserID);
        if (check.length > 0) {
          req.flash('error', "User ID already registered.");
          passed = false;
        }
      }
      if (passed) {
        check = await checkEmail(registerEmail);
        if (check.length > 0) {
          req.flash('error', "Email already registered.");
          passed = false;
        }
      }
      if (passed) {
        await pool.query(
          `INSERT INTO users (user_id, password, email, last_login)
              VALUES ($1, $2, $3, NULL)`,
          [registerUserID, hashedPassword, registerEmail],
          (err, results) => {
            if (err) {
              throw err;
            }
            req.flash('error', "You are now registered. Please log in to complete your profile.");
            res.redirect("/login");
          }
        );
      }
      if (!passed) {
        res.redirect("/index");
      }
    }
});

app.post("/reset_password", async(req, res) => {
  let {inputUserID, resetPass, resetConfirmPass} = req.body;
  let errors = [];

  if (!inputUserID || !resetPass || !resetConfirmPass) {
    errors.push({message: "Please enter all fields"});}
  if (resetPass !== resetConfirmPass) {
    errors.push({message: "Passwords do not match"});}

  if (errors.length > 0) {
    req.flash('error', errors[0].message);
    res.redirect("/reset_password");
  }
  else {
    hashedPassword = await bcrypt.hash(resetPass, 10);
    var passed = true;
    var check;
    if (passed) {
      check = await checkID(inputUserID);
      if (check.length == 0) {
        req.flash('error', "User ID not found.");
        passed = false;
      }
    }
    if (passed) {
      await pool.query(
        `UPDATE users
          SET password = '${hashedPassword}'
          WHERE user_id ='${inputUserID}'`,
        (err, results) => {
          if (err) {
            throw err;
          }
          req.flash('error', "Successfully reset password.");
          res.redirect("/index");
        }
      );
    }
    if (!passed) {
      res.redirect("/reset_password");
    }
  }
});

app.post("/create_profile", async(req, res) => {
  let {fullName, addressOne, cityOne, stateOne, zipCodeOne,
    addressTwo, cityTwo, stateTwo, zipCodeTwo} = req.body;
  var queryAddress;
  var userID = req.user.user_id;
  var secondaryAddress;
  var primaryAddressID;
  var secondaryAddressID;
  let errors = [];

  fullName = fullName.trim();
  addressOne = addressOne.trim();
  cityOne = cityOne.trim();
  stateOne = stateOne.trim();
  zipCodeOne = zipCodeOne.trim();
  addressTwo = addressTwo.trim();
  cityTwo = cityTwo.trim();
  stateTwo = stateTwo.trim();
  zipCodeTwo = zipCodeTwo.trim();

  if (fullName.length > 50)
    errors.push({message: "Maximum length for name is 50"});
  if (addressOne.length > 100)
    errors.push({message: "Maximum length for address is 100"});
  if (cityOne.length > 100)
    errors.push({message: "Maximum length for city is 100"});
  if (zipCodeOne.length < 5)
    errors.push({message: "Minimum length for zip code is 5"});
  if (zipCodeOne.length > 9)
    errors.push({message: "Maximum length for zip code is 9"});

  if (fullName == "" || addressOne == "" || cityOne == "" || stateOne == "null" || zipCodeOne == "")
    errors.push({message: "Please enter all required fields for primary address"});
  else if (addressTwo != "" && cityTwo != "" && stateTwo != "null" && zipCodeTwo != "")
    secondaryAddress = true;
  else if (addressTwo != "" || cityTwo != "" || stateTwo != "null" || zipCodeTwo != "")
    errors.push({message: "Please enter all required fields for secondary address"});
  else
    secondaryAddress = false;
  
  if (errors.length > 0) {
    req.flash('error', errors[0].message);
    res.redirect("/create_profile");
  }
  else {
    queryAddress =
      `INSERT INTO address (address, city, state, zipcode)
        VALUES ('${addressOne}', '${cityOne}', '${stateOne}', '${zipCodeOne}')
        RETURNING address_id`;
    primaryAddressID = await pool.query(queryAddress);

    if (secondaryAddress) {
      queryAddress =
      `INSERT INTO address (address, city, state, zipcode)
        VALUES ('${addressTwo}', '${cityTwo}', '${stateTwo}', '${zipCodeTwo}')
        RETURNING address_id`;
      secondaryAddressID = await pool.query(queryAddress);

      await pool.query(
        `INSERT INTO profile (user_id, primary_address_id, secondary_address_id, full_name)
          VALUES ('${userID}', '${primaryAddressID.rows[0].address_id}', '${secondaryAddressID.rows[0].address_id}', '${fullName}')`,
          (err, results) => {
            if (err) {
              throw err;
            }
            res.redirect("/dashboard");
          }
      );
    }
    else
      await pool.query(
        `INSERT INTO profile (user_id, primary_address_id, secondary_address_id, full_name)
          VALUES ('${userID}', '${primaryAddressID.rows[0].address_id}', NULL, '${fullName}')`,
          (err, results) => {
            if (err) {
              throw err;
            }
            res.redirect("/dashboard");
          }
      );
  }
});

app.post("/login",
  passport.authenticate("local", {
    failureRedirect: "/index",
    failureFlash: true
  }),
  async(req, res) => {
    await pool.query(
      `UPDATE users
        SET last_login = CURRENT_TIMESTAMP
        WHERE user_id = '${req.user.user_id}'`,
        (err, results) => {
          if (err) {
            throw err;
          }
          res.redirect("/dashboard");
        }
    );
  });

app.post("/new_user",
  passport.authenticate("local", {
    failureRedirect: "/index",
    failureFlash: true
  }),
  async(req, res) => {
    await pool.query(
      `UPDATE users
        SET last_login = CURRENT_TIMESTAMP
        WHERE user_id = '${req.user.user_id}'`,
        (err, results) => {
          if (err) {
            throw err;
          }
          res.redirect("/create_profile");
        }
    );
  });
  
function checkNotAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
      return next();
    }
    res.redirect("/index");
}

if(process.env.NODE_ENV === 'production'){
  app.use(express.static('client'));
}

app.listen(PORT, ()=>{
    console.log(`Server started on port ${PORT}`);
});

const checkID = async(registerUserID) => {
  var response = await pool.query(
    `SELECT * FROM users
      WHERE user_id = $1`,
    [registerUserID]
  );
  return response.rows;
}

const checkEmail = async(registerEmail) => {
  var response = await pool.query(
    `SELECT * FROM users
      WHERE email = $1`,
    [registerEmail]
  );
  return response.rows;
}

const checkProfile = async(userID) => {
  var response = await pool.query(
    `SELECT * FROM profile
      WHERE user_id = $1`,
    [userID]
  );
  return response.rows;
}

const checkAddress = async(userID) => {
  var response = await pool.query(
    `SELECT * FROM profile
      WHERE user_id = $1`,
    [userID]
  );
  return response.rows;
}

const getAddress = async(addressID) => {
  var response = await pool.query(
    `SELECT * FROM address
      WHERE address_id = $1`,
    [addressID]
  );
  return response.rows;
}

const getState = async() => {
  var response = await pool.query(`SELECT * FROM state`);
  return response.rows;
}

const getFuelHistory = async(userID) => {
  var response = await pool.query(
    `SELECT * FROM fuel_quote
      WHERE user_id = $1`,
    [userID]
  );
  return response.rows;
}

const hasHistory = async(userID) => {
  var response = await pool.query(
    `SELECT COUNT (*) FROM fuel_quote
      WHERE user_id = $1`,
    [userID]
  );
  return response.rows;
}
