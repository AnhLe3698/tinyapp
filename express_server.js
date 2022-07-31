// Adding our dependencies
const express = require('express');
const fs = require('fs');
// Starting the server and initializing the PORT
const app = express();
const PORT = 8080; // default port 8080

app.set("view engine", "ejs");
// Initialzing Database
let urlDatabase = {};

// Initialzing Database Part 2
// We need to read our urls from our Url database saved in a text file
let data = fs.readFileSync('./savedUrls.txt', 'utf8', (err) => {
  if (err) {
    console.error(err);
    return;
  }
});
let parsedData = JSON.parse(data);
urlDatabase = {...parsedData};

// Initialzing Database part 3
// For testing purposes we need to add these links every server startup
urlDatabase["b2xVn2"] = "http://www.lighthouselabs.ca";
urlDatabase["9sm5xK"] = "http://www.google.com";
urlDatabase["FAen9V"] = "http://www.youtube.com";

//Middleware
app.use(express.urlencoded({ extended: true }));

//Listener
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});

app.get("/", (req, res) => {
  res.send("Hello!");
});


// Sends urls as a Json object
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls", (req, res) => {
  const templateVars  = { urls: urlDatabase };
  res.render("urls_index", templateVars);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

app.get("/urls/:id", (req, res) => {
  const templateVars = { id: req.params.id, longURL: urlDatabase[req.params.id] };
  if (urlDatabase[req.params.id] === undefined) {
    res.send('Invalid short url');
  } else {
    res.render("urls_show", templateVars);
  }
});

app.post("/urls", (req, res) => {
  console.log(req.body); // Log the POST request body to the console
  let shortString = generateRandomString();
  urlDatabase[shortString] = req.body['longURL'];
  let urlDatabaseJSON = JSON.stringify(urlDatabase);
  // Saving the new urlDatabase object into the text file
  fs.writeFile('./savedUrls.txt', urlDatabaseJSON, err => {
    if (err) {
      console.error(err);
    }
    // file written successfully
  });
  res.redirect(302, `/urls/${shortString}`); // Redirects the link
});

// adding a delete button and handling the POST request
app.post("/urls/:id/delete", (req, res) => {
  
  delete urlDatabase[req.params.id];
  // The following code will update our saved text file url database
  let urlDatabaseJSON = JSON.stringify(urlDatabase);
  fs.writeFile('./savedUrls.txt', urlDatabaseJSON, err => {
    if (err) {
      console.error(err);
    }
    // file written successfully
  });

  res.redirect(302, `/urls`);
});

// Redirects to external websites using the longURL
app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id];
  if (longURL === undefined) {
    res.send('Invalid short url');
  } else {
    res.redirect(302, longURL);
  }
  
});

// Generate 6 random alphanumeric characters as a single string
let generateRandomString = function() {
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