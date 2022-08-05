// Adding our dependencies
const express = require('express');
const cookieParser = require('cookie-parser');
const fs = require('fs');

//Imported functions;
let {
  getUserByEmail,
  urlsForUser,
  appSecurity,
  generateRandomString,
  writeToFileDatabase,
  writeToUsersDatabase
} = require('./functions');

// Starting the server and initializing the PORT
const app = express();
const PORT = 8080; // default port 8080

//Middleware
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

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
  password: "1234"
};
users['tJ45ls'] = {
  id: "tJ45ls",
  email: "user2@example.com",
  password: "1234"
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

app.post("/urls/:id/edit", (req, res) => {
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

// adding a delete button and handling the POST request
app.post("/urls/:id/delete", (req, res) => {
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

app.get("/urls/:id", (req, res) => {
  appSecurity(req, users, (userID) => {
    const templateVars = {
      id: req.params.id,
      longURL: urlsForUser(userID, urlDatabase)[req.params.id],
      userID: users[userID]
    };
    if (urlDatabase[req.params.id] === undefined) {
      res.send('Invalid short url');
    } else if (urlDatabase[req.params.id]['userID'] !== userID) {
      res.send('<html><body><a href="/urls"">This short URL does not belong to you</a></body></html>\n');
    } else {
      res.render("urls_show", templateVars);
    }
  }, () => {
    res.send('<html><body><a href="/login">Please login/register to access this page</a></body></html>\n');
  });
  
});

// creates new links
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
    
    writeToFileDatabase(urlDatabase); // Writing to database
    res.redirect(302, `/urls/${shortString}`);
  }, () => {
    res.send('<html><body><a href="/login">Please login/register to access this page</a></body></html>\n');
  });
});

// Redirects to external websites using the longURL
app.get("/u/:id", (req, res) => {
  const urlObject = urlDatabase[req.params.id];
  if (urlObject === undefined) {
    res.send("<html><body>The short url is not a valid ID</body></html>\n");
  } else {
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
  if (userID !== undefined && req.body.password === users[userID].password) {
    res.cookie("user_id", userID);
  }
  appSecurity(req, users, () => {
    res.redirect(302, "/urls");
  }, () => {
    res.redirect(302, "login");
  });
});

app.post("/logout", (req,res) => {
  res.clearCookie("user_id", req.body["buttonInput"]);
  res.redirect(302, "/login");
});

app.get("/register", (req, res) => {
  appSecurity(req, users, () => {
    res.redirect(302, '/urls');
  }, () => {
    const templateVars  = {
      InvalidAccountInfo: req.cookies["InvalidAccountInfo"]
    };
    res.render("register", templateVars);
  });
});

app.post("/register", (req,res) => {
  // The following variable will check if an email exists
  // If getUserByEmail cannot locate email, it will return undefined
  let checkDuplicateEmail = getUserByEmail(req.body.email, users);
  if (req.body.email !== undefined && req.body.email !== "") {
    if (checkDuplicateEmail === undefined && req.body.password !== undefined && req.body.password !== "") {
      res.clearCookie("InvalidAccountInfo", true);
      let userID = generateRandomString();
      let newUser = {
        id: userID,
        email: req.body.email,
        password: req.body.password
      };
      users[userID] = newUser;
      res.cookie("user_id", userID);
      writeToUsersDatabase(users);
      res.redirect(302, "/urls");
    } else {
      res.cookie("InvalidAccountInfo", "true");
      res.redirect(400, "/register");
    }
  } else {
  // The following cookie is used to pass a message if
  // invalid registration information is passed
    res.cookie("InvalidAccountInfo", "true");
    res.redirect(400, "/register");
  }
});