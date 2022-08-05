// Adding our dependencies
const express = require('express');
const cookieParser = require('cookie-parser');
//const fs = require('fs');
//Imported functions;

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
const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW",
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW",
  },
  b2xVn2: {
    longURL: "http://www.lighthouselabs.ca",
    userID: "tJ45ls",
  },
  '9sm5xK': {
    longURL: "http://www.google.com",
    userID: "tJ45ls",
  },
};

// Initializing USER dataBase
const users = {
  aJ48lW: {
    id: "aJ48lW",
    email: "user@example.com",
    password: "1234",
  },
  tJ45ls: {
    id: "tJ45ls",
    email: "user2@example.com",
    password: "1234",
  },
};

// This function returns our familiar dataObject we are used to!
const getUrls = function(userID) {
  let dataObject = {};
  for (const shortUrls in urlDatabase) {
    if (userID === urlDatabase[shortUrls].userID) {
      dataObject[shortUrls] = urlDatabase[shortUrls].longURL;
    }
  }
  return dataObject;
};

/////////////////////////////////////////////////////////////////////
//////////MAJOR DATABASE REFACTORING/////////////////////////////////
// Initialzing Database Part 2
// We need to read our urls from our Url database saved in a text file
// let data = fs.readFileSync('./savedUrls.txt', 'utf8', (err) => {
//   if (err) {
//     console.error(err);
//     return;
//   }
// });
// let parsedData = JSON.parse(data);
// urlDatabase = {...parsedData};

// Initialzing Database part 3
// For testing purposes we need to add these links every server startup
// urlDatabase["b2xVn2"] = "http://www.lighthouselabs.ca";
// urlDatabase["9sm5xK"] = "http://www.google.com";
// urlDatabase["FAen9V"] = "http://www.youtube.com";



//////////////////////////////////////////////////////
// GROUP UP ANTIQUATED CODE /////////////////////////
/////////////////////////////////////////////////////

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});


// Sends urls as a Json object
// app.get("/urls.json", (req, res) => {
//   res.json(urlDatabase);
// });

app.get("/urls", (req, res) => {
  let userID = req.cookies["user_id"];
  const templateVars  = {
    urls: getUrls(userID),
    userID: users[userID]
  };
  res.render("urls_index", templateVars);
});



app.get("/urls/new", (req, res) => {
  let userID = req.cookies["user_id"];
  const templateVars  = {
    urls: getUrls(userID),
    userID: users[userID]
  };
  if (userID !== undefined && users[userID] !== undefined && users[userID].id === userID) {
    res.render("urls_new", templateVars);
  } else {

    res.redirect(302, '/login');
  }
});

app.post("/urls/:id/edit", (req, res) => {
  let userID = req.cookies["user_id"];
  if (userID !== undefined && users[userID] !== undefined && users[userID].id === userID) {
    urlDatabase[req.params.id].longURL = req.body['longURL'];
  }
  // updating the save file with all our urls
  // writeToFileDatabase(urlDatabase);
  res.redirect(302, `/urls`);
});

// adding a delete button and handling the POST request
app.post("/urls/:id/delete", (req, res) => {
  let userID = req.cookies["user_id"];
  if (userID !== undefined && users[userID] !== undefined && users[userID].id === userID) {
    delete urlDatabase[req.params.id];
  }
  
  // The following code will update our saved text file url database
  //writeToFileDatabase(urlDatabase);

  res.redirect(302, `/urls`);
});

app.get("/urls/:id", (req, res) => {
  let userID = req.cookies["user_id"];
  const templateVars = {
    id: req.params.id,
    longURL: getUrls(userID)[req.params.id],
    userID: users[userID]
  };
  if (urlDatabase[req.params.id] === undefined) {
    res.send('Invalid short url');
  } else {
    res.render("urls_show", templateVars);
  }
});

// creates new links
app.post("/urls", (req, res) => {
  
  let userID = req.cookies['user_id'];
  if (userID !== undefined && users[userID] !== undefined && users[userID].id === userID) {
    // generating url ID
    let shortString = generateRandomString();
    // Adding new url element to url database
    let urlObject = {
      longURL: req.body['longURL'],
      userID
    };
    urlDatabase[shortString] = urlObject;
    // Writing to database
    //writeToFileDatabase(urlDatabase);
    res.redirect(302, `/urls/${shortString}`); // Redirects the link
  } else {
    res.send('Please login for access to this functionality');
    //res.redirect(302, '/urls');
  }
});

// Redirects to external websites using the longURL
app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id].longURL;
  if (longURL === undefined) {
    res.redirect(400);
  } else {
    res.redirect(302, longURL);
  }
  
});

app.get("/login", (req, res) => {
  let userID = req.cookies['user_id'];
  // CHecking if there is a cookie and that it is valid
  if (userID !== undefined && users[userID] !== undefined && users[userID].id === userID) {
    res.redirect(302, '/urls');
  } else {
    res.render("login");
  }
});

// res.cookie(key, value) initializes a cookie
// req.cookies[key] calls an existing cookie
// res.clearCookie(key, value) deletes a cookie
app.post("/login", (req, res) => {
  let userID = getUserByEmail(req.body.email, users);
  if (userID !== undefined && req.body.password === users[userID].password) {
    res.cookie("user_id", userID);
    res.redirect(302, "/urls");
  } else {
    res.redirect(302, "login");
  }
});

app.post("/logout", (req,res) => {
  res.clearCookie("user_id", req.body["buttonInput"]);
  res.redirect(302, "/urls");
});

app.get("/register", (req, res) => {
  const templateVars  = {
    InvalidAccountInfo: req.cookies["InvalidAccountInfo"]
  };
  let userID = req.cookies['user_id'];
  // CHecking if there is a cookie and that it is valid
  if (userID !== undefined && users[userID] !== undefined && users[userID].id === userID) {
    res.redirect(302, '/urls');
  } else {
    // InvalidAccountInfo hecks if we had an invalid registration attempt
    res.render("register", templateVars);
  }
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


//Checking if the user email already exists in the users object
const getUserByEmail = function(userEmail, users) {
  for (const userIDs in users) {
    if (users[userIDs].email === userEmail) {
      return userIDs;
    }
  }
  return undefined;
};

// const writeToFileDatabase = function(urls) {
//   let urlDatabaseJSON = JSON.stringify(urls);
//   // Saving the new urlDatabase object into the text file
//   fs.writeFile('./savedUrls.txt', urlDatabaseJSON, err => {
//     if (err) {
//       console.error(err);
//     }
//     // file written successfully
//   });
// };

// Generate 6 random alphanumeric characters as a single string
const generateRandomString = function() {
  let randomNumbers = [];
  for (let i = 0; i < 6; i++) {
    // Generating numbers that will represent
    //10 digits, 26 lower case and 26 captial letters
    randomNumbers.push(Math.floor(Math.random() * 62));
  }
  //String.fromCharCode(65)
  let stringRes = randomNumbers.map((num) => {
    if (num < 10) {
      return num;
    } else if (num > 9 && num < 36) {
      return String.fromCharCode(num + 55);
    } else if (num > 35) {
      return String.fromCharCode(num + 61);
    }
  }).join('');

  return stringRes;
};