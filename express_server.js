// Adding our dependencies
const express = require('express'); // HTTP request library
const cookieSession = require('cookie-session'); // Encrypted cookies
const cookiesState = require('cookie-parser'); // Used for Statefulness
const bcrypt = require('bcryptjs'); // Hashed Passwords
const methodOverride = require('method-override'); // "Adds" PUT and Delete requests
const fs = require('fs'); // Reading Database from files

//Imported HELPER functions;
let {
  getUserByEmail,
  urlsForUser,
  appSecurity,
  generateRandomString,
  writeToFileDatabase,
  writeToUsersDatabase
} = require('./helpers');

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

// Initialzing URL Database
let urlDatabase = {};

//Initialzing URL Database Part 2
//We need to read our urls from our Url database saved in a text file
let data = fs.readFileSync('./savedUrls.txt', 'utf8', (err) => {
  if (err) {
    console.error(err);
    return;
  }
});
if (data.length !== 0) { // Checks if there is no data
  let parsedData = JSON.parse(data);
  urlDatabase = {...parsedData};
}

// Initialzing User Database
let users = {};

// Initialzing User Database Part 2
let data1 = fs.readFileSync('./savedUsers.txt', 'utf8', (err) => {
  if (err) {
    console.error(err);
    return;
  }
});
if (data1.length !== 0) { // Checks if there is no data
  let parsedData = JSON.parse(data1);
  users = {...parsedData};
}

//Initializing URL Database Part 3
//For testing purposes we need to add these links every server startup
urlDatabase['b6UTxQ'] = {
  longURL: "https://www.tsn.ca",
  userID: "aJ48lW",
};

urlDatabase['i3BoGr'] = {
  longURL: "https://www.google.ca",
  userID: "aJ48lW",
};

urlDatabase['b2xVn2'] = {
  longURL: "http://www.lighthouselabs.ca",
  userID: "tJ45ls",
};

urlDatabase['9sm5xK'] = {
  longURL: "http://www.google.com",
  userID: "tJ45ls",
};

// Initializing USER dataBase Part 3
//For testing purposes we need to add these users every server startup
users['aJ48lW'] = {
  id: "aJ48lW",
  email: "user@example.com",
  password: bcrypt.hashSync('1234', 10)
};
users['tJ45ls'] = {
  id: "tJ45ls",
  email: "user2@example.com",
  password: bcrypt.hashSync('1234', 10)
};


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
    res.send('Please login/register to access the edit page'); // No need for HTML
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
    res.send('Please login/register to access the delete page'); // No need fo HTML
  });
  writeToFileDatabase(urlDatabase); //updating the save file with all our urls
});

// STRETCH: Need to add the following features: Unique visitors, Total Visitors, Visits {Timestamp, trackingID}
// Clicking on a URL adds to a Vistor_object {trkID:{userID, time,url}, trkID:{userID,time, url}}
// Feature A) Total clicks, for (urls in Visitor_object) if (urls === short_url) counter ++
// Feature B) unique visitors will return a counted result from looping through
// Object for unique visitors to a short URL (urls in Visitor_object) if (urls === short_url) a.push(userID)
// for loop through the users array to check and then increment counter if unique.
// Feature C) scan through urlVisits Database and display User's visits

// STRETCH: url visit history Object/Database
let urlVisits = {
  lPiGRA: {
    userID: 'BaZg4f',
    time: 1660268400,
    shortUrl: 'lPiGRa',
    "longURL":"http://www.youtube.com"
  }
};

//Stretch: Feature A Total Visits, increment from accessing GET "/urls/:id" and GET "/u/:id"
const totalVisits = function(urlVisits, shortUrl) {
  let totalVisiters = 0;
  for (const visits in urlVisits) {
    if (urlVisits[visits]['shortUrl'] === shortUrl) {
      totalVisiters ++;
    }
  }
  return totalVisiters;
};

//Stretch: Feature B Unique Viewers this will increment from accessing GET "/urls/:id" and GET "/u/:id"
const cookieViews = function(req, urlDatabase, urlVisits) {
  let uniqueVisitors = {};
  let counter = 0;
  let longLink = urlDatabase[req.params.id]['longURL'];
  for (const visits in urlVisits) {
    if (urlVisits[visits]['longURL'] === longLink && uniqueVisitors[urlVisits[visits]['userID']] === undefined) {
      uniqueVisitors[urlVisits[visits]['userID']] = 1;
      counter ++;
    }
  }
  return counter;
};

// STRETCH: Feature C History of User visits to shortURL
const urlHistory = function(req, urlVisits) {
  let visitHistory = {};
  for (const visits in urlVisits) {
    if (urlVisits[visits]['shortUrl'] === req.params.id) {
      visitHistory[visits] = urlVisits[visits]['time'];
    }
  }
  return visitHistory;
};


app.get("/urls/:id", (req, res) => { // EDIT PAGE REDIRECT
  appSecurity(req, users, (userID) => {
    if (urlDatabase[req.params.id] === undefined) {
      res.send('Invalid short url');
    } else if (urlDatabase[req.params.id]['userID'] !== userID) {
      res.send('<html><body><a href="/urls"">This short URL does not belong to you</a></body></html>\n');
    } else {
      let trackingID = generateRandomString();
      //STRETCH: This adds to the urlVisits Database
      urlVisits[trackingID] = {
        userID: userID,
        time: Date.now(),
        shortUrl: req.params.id,
        longURL: urlDatabase[req.params.id]['longURL']
      };
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
    //////// Stretch ////////////

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
  req.session = null; // Deletes cookie
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