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
  appSecurity,
  generateRandomString,
  writeToFileDatabase,
  writeToUsersDatabase,
  totalVisits, // Stretch Feature A
  urlHistory, // Stretch Feature C
  cookieViews // Stretch Feature B
} = require('./helpers');

// Imprted Databases
let {
  _urlVisits,
  _urlDatabase,
  _users
} = require('./databases');

// Starting the server and initializing the PORT
const app = express();
const PORT = 8080; // default port 8080

//Middleware
app.set("view engine", "ejs"); // Serverside Rendering
app.use(cookiesState()); // Helps with statefulness
app.use(express.urlencoded({ extended: true })); // UTF8 encoding
app.use(methodOverride('_method')); // override with POST and ?_method=DELETE in form
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
let users = {..._users};
// user@example.com Pass: 1234 user2@example.com Pass: 1234

// Stretch - adding urlVisits Obect/Database
let urlVisits = {..._urlVisits};



//////////////////////////////////////////////////////
// GROUP UP ANTIQUATED CODE /////////////////////////
/////////////////////////////////////////////////////

app.get("/", (req, res) => {
  res.send("Hello!");
});
app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

//Sends urls as a Json object
app.get("/urls.json", (req, res) => {
  appSecurity(req, users, (userID) => {
    res.json(urlsForUser(userID, urlDatabase));
  }, () => {
    res.send('Please login');
  });
});


app.get("/urls", (req, res) => {
  appSecurity(req, users, (userID) => {
    const templateVars  = {
      urls: urlsForUser(userID, urlDatabase),
      userID: users[userID]
    };
    res.render("urls_index", templateVars);
  }, () => {
    res.send('<html><body><a href="/login">Please login/register to access this page</a></body></html>\n');
  });
});


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
      res.send('<html><body><a href="/urls">URL does not exist</a></body></html>\n');
    }
  }, () => {
    res.send('Please login/register to access the EDIT page'); // No need for HTML
  });
  writeToFileDatabase(urlDatabase); //updating the save file with all our urls
});

// Adding a delete button and handling the POST request using Method Overide
app.delete("/urls/:id", (req, res) => {
  appSecurity(req, users, () => {
    if (urlDatabase[req.params.id]) {
      delete urlDatabase[req.params.id];
      res.redirect(302, `/urls`);
    } else {
      res.send('<html><body><a href="/urls">URL does not exist</a></body></html>\n');
    }
  }, () => {
    res.send('Please login/register to access the Delete page'); // No need fo HTML
  });
  writeToFileDatabase(urlDatabase); //updating the save file with all our urls
});

// STRETCH: Need to add the following features: Unique visitors, Total Visitors, Visits {Timestamp, trackingID}
// Feature 0) Clicking on a URL adds to a Vistor_object {trkID:{userID, time,url}, trkID:{userID,time, url}}
// Feature A) Total views from accessing either the GET /u/:id or GET /urls/:id pages
// Feature B) Count Unique Viewers that access the url or edit page GET /u/:id or GET /urls/:id
// Feature B) Also assign a cookie to track an unregistered user who accesses /u/id
// Feature C) Scan through urlVisits Database and display User's visits HISTORY

app.get("/urls/:id", (req, res) => { // EDIT PAGE REDIRECT
  appSecurity(req, users, (userID) => {
    if (urlDatabase[req.params.id] === undefined) {
      res.send('Invalid short url');
    } else if (urlDatabase[req.params.id]['userID'] !== userID) {
      res.send('<html><body><a href="/urls"">This short URL does not belong to you</a></body></html>\n');
    } else {

      //STRETCH: This adds to the urlVisits Database//
      let trackingID = generateRandomString();
      urlVisits[trackingID] = {
        userID: userID,
        time: Date.now(),
        shortUrl: req.params.id,
        longURL: urlDatabase[req.params.id]['longURL']
      };
      // Stretch END//

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
    res.send('<html><body><a href="/login">Please login/register to access this page</a></body></html>\n');
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
    urlDatabase[shortString] = urlObject;
    writeToFileDatabase(urlDatabase); // Writing Urls to database
    res.redirect(302, `/urls/${shortString}`);
  }, () => {
    res.send('<html><body><a href="/login">Please login/register to access this page</a></body></html>\n');
  });
});

// Redirects to external websites using the longURL
// Stretch: Accessing a link or accessing the Edit page ("/urls/:id")
// records a session that the short url and the long url was accessed!
app.get("/u/:id", (req, res) => { // Tracks if users visits website
  const urlObject = urlDatabase[req.params.id];
  if (urlObject === undefined) {
    res.send("<html><body>The short url is not a valid ID</body></html>\n");
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
      res.cookie('Random_User', userID);
    } else if (req.cookies['Random_User'] !== undefined) {
      userID = req.cookies['Random_User'];
    }
    urlVisits[trackingID] = {
      userID: userID,
      time: Date.now(),
      shortUrl: req.params.id,
      longURL: urlDatabase[req.params.id]['longURL']
    };
    //////// Stretch END ////////////

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
  if (req.body.email !== undefined && req.body.email !== "") {
    if (checkDuplicateEmail === undefined && req.body.password !== undefined && req.body.password !== "") {
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
  } else {
    res.redirect(400, "/register");
  }
});