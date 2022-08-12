// Adding our dependencies
const express = require('express'); // HTTP request library
const cookieSession = require('cookie-session'); // Encrypted cookies
const cookiesState = require('cookie-parser'); // Used for Statefulness
const bcrypt = require('bcryptjs'); // Hashed Passwords
const methodOverride = require('method-override'); // "Adds" PUT and Delete requests

// Imported HELPER functions
let {
  getUserByEmail,
  urlsForUser,
  appSecurity, // <------Crucial function for checking if user is logged in
  generateRandomString, // <-------Generates shortUrls, UserIDs, and TrackingIDs
  writeToFileDatabase, // <------- Records our urls in a text file
  writeToUsersDatabase, // <------ Records our users in a text file (Hashed Passwords)
  totalVisits, // Stretch Feature A
  urlHistory, // Stretch Feature C
  cookieViews, // Stretch Feature B
  timeConverter, // Stretch Feature C
} = require('./helpers');

// Imprted Databases
let {
  _urlVisits,
  _urlDatabase,
  _users,
  errorMessages
} = require('./databases');

// Starting the server and initializing the PORT
const app = express();
const PORT = 8080; // default port 8080

//Middleware
app.set("view engine", "ejs"); // Serverside Rendering
app.use(cookiesState()); // Helps with statefulness
app.use(express.urlencoded({ extended: true })); // UTF8 encoding
app.use(methodOverride('_method')); // Override with POST and ?_method=DELETE in form
app.use(cookieSession({ // Session Security
  name: 'session',
  keys: ['COOKIEMONSTER'],
}));

//Listener
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});

// Initialzing URL Database read from file
let urlDatabase = {..._urlDatabase};

// Initialzing User Database read from file
// user@example.com Pass: 1234 user2@example.com Pass: 1234
let users = {..._users};

// Stretch - adding urlVisits Obect/Database
let urlVisits = {..._urlVisits};

//////////////////////////////////////////////////////
/// HTTP PATHS using EXPRESS /////////////////////////
/////////////////////////////////////////////////////

app.get("/", (req, res) => {
  res.send("Hello!");
});
app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

// Sends urls as a Json object
app.get("/urls.json", (req, res) => {
  appSecurity(req, users, (userID) => {
    res.json(urlsForUser(userID, urlDatabase));
  }, () => {
    res.send('Please login');
  });
});

// Main urls_index page
app.get("/urls", (req, res) => {
  appSecurity(req, users, (userID) => {
    const templateVars  = {
      urls: urlsForUser(userID, urlDatabase),
      userID: users[userID]
    };
    res.render("urls_index", templateVars);
  }, () => {
    res.send(errorMessages['pleaseLogin']);
  });
});

// creates new links, POST method creates new resource
app.post("/urls", (req, res) => {
  appSecurity(req, users, (userID) => {
    // generating url ID
    let shortString = generateRandomString();
    // Adding new url element to url database
    let urlObject = {
      longURL: req.body['longURL'],
      userID
    };
    urlDatabase[shortString] = urlObject; // Adds url
    writeToFileDatabase(urlDatabase); // Writing Urls to database
    res.redirect(302, `/urls/${shortString}`);
  }, () => {
    res.send(errorMessages['pleaseLogin']);
  });
});

// Allows access to add new URLs if logged in
app.get("/urls/new", (req, res) => {
  appSecurity(req, users, (userID) => {
    const templateVars  = {
      urls: urlsForUser(userID, urlDatabase),
      userID: users[userID]
    };
    res.render("urls_new", templateVars);
  }, () => {
    res.redirect(302, '/login');
  });
});

// PUT requests update existing resources
app.put("/urls/:id/edit", (req, res) => {
  appSecurity(req, users, () => {
    if (urlDatabase[req.params.id]) {
      urlDatabase[req.params.id].longURL = req.body['longURL'];
      res.redirect(302, `/urls`);
    } else {
      res.send(errorMessages['invalidURL2']);
    }
  }, () => {
    res.send(errorMessages['loginForAccess']);
  });
  //updating the save file with all our urls
  writeToFileDatabase(urlDatabase);
});

// Adding Method Overide to allow for Delete requests
app.delete("/urls/:id", (req, res) => {
  appSecurity(req, users, () => {
    if (urlDatabase[req.params.id]) {
      delete urlDatabase[req.params.id];
      res.redirect(302, `/urls`);
    } else {
      res.send(errorMessages['invalidURL2']);
    }
  }, () => {
    res.send(errorMessages['loginForAccess']);
  });
  //updating the save file with all our urls
  writeToFileDatabase(urlDatabase);
});

app.get("/urls/:id", (req, res) => { // EDIT PAGE REDIRECT
  appSecurity(req, users, (userID) => {
    if (urlDatabase[req.params.id] === undefined) {
      res.send('Invalid short url');
    } else if (urlDatabase[req.params.id]['userID'] !== userID) {
      res.send(errorMessages['reject1']);
    } else {

      //STRETCH: This adds to the urlVisits Database//
      let trackingID = generateRandomString();
      urlVisits[trackingID] = {
        userID: userID,
        time: timeConverter(Date.now()),
        shortUrl: req.params.id,
        longURL: urlDatabase[req.params.id]['longURL']
      }; // Stretch END//
      
      const templateVars = {
        id: req.params.id,
        longURL: urlsForUser(userID, urlDatabase)[req.params.id],
        userID: users[userID],
        totalViews: totalVisits(urlVisits, req.params.id), // Stretch: Feature A
        uniqueViews: cookieViews(req, urlDatabase, urlVisits), // Stretch: Feature B
        history: urlHistory(req, urlVisits) // Stretch: Feature C
      };
      res.render("urls_show", templateVars);
    }
  }, () => {
    res.send(errorMessages['pleaseLogin']);
  });
});



// Redirects to external websites using the longURL
app.get("/u/:id", (req, res) => { // Tracks if users visits website
  const urlObject = urlDatabase[req.params.id];
  if (urlObject === undefined) {
    res.send(errorMessages['invalidURL']);
  } else {
    ////// Stetch /////////////
    // The following lines of code tracks logged in users and random users
    // who access a short url and adds it to the urlVisits object/database
    let trackingID = generateRandomString();
    let userID = "";
    if (req.session.userid !== undefined) {
      userID = req.session.userid;
    } else if (req.session.userid === undefined && req.cookies['Random_User'] === undefined) {
      userID = generateRandomString();
      res.cookie('Random_User', userID); // Assigns a cookie to unregistered users
    } else if (req.cookies['Random_User'] !== undefined) {
      userID = req.cookies['Random_User'];
    }
    urlVisits[trackingID] = {
      userID: userID,
      time: timeConverter(Date.now()),
      shortUrl: req.params.id,
      longURL: urlDatabase[req.params.id]['longURL']
    }; //////// Stretch END ////////////////
    
    res.redirect(302, urlObject.longURL);
  }
});

app.get("/login", (req, res) => {
  appSecurity(req, users, () => {
    res.redirect(302, '/urls');
  }, () => {
    res.render("login");
  });
});

app.post("/login", (req, res) => {
  let userID = getUserByEmail(req.body.email, users);
  if (userID !== undefined &&  bcrypt.compareSync(req.body.password, users[userID].password)) {
    req.session.userid = userID;
  }
  appSecurity(req, users, () => {
    res.clearCookie('Random_User');
    res.redirect(302, "/urls");
  }, () => {
    res.redirect(302, "login");
  });
});

app.post("/logout", (req,res) => {
  req.session = null; // Deletes login cookie
  res.redirect(302, "/login");
});

// Redirects to register page if not logged in
app.get("/register", (req, res) => {
  appSecurity(req, users, () => {
    res.redirect(302, '/urls');
  }, () => {
    res.render("register");
  });
});

// Registers account
app.post("/register", (req,res) => {
  // The following variable will check if an email exists
  // If getUserByEmail cannot locate email, it will return undefined
  let checkDuplicateEmail = getUserByEmail(req.body.email, users);
  if (req.body.email !== undefined && req.body.email !== "" && checkDuplicateEmail === undefined
  && req.body.password !== undefined && req.body.password !== "") {
    let userID = generateRandomString(); // UserID
    let newUser = { // User settings
      id: userID,
      email: req.body.email,
      password: bcrypt.hashSync(req.body.password, 10) //Encypt userID
    };
    users[userID] = newUser;
    req.session.userid = userID;
    writeToUsersDatabase(users); // adds account to user database
    res.redirect(302, "/urls");
  } else {
    res.redirect(400, "/register");
  }
});