const fs = require('fs');
const bcrypt = require('bcryptjs');

// Initialzing URL Database
let _urlDatabase = {};

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
  _urlDatabase = {...parsedData};
}

// Initialzing User Database
let _users = {};

// Initialzing User Database Part 2
let data1 = fs.readFileSync('./savedUsers.txt', 'utf8', (err) => {
  if (err) {
    console.error(err);
    return;
  }
});
if (data1.length !== 0) { // Checks if there is no data
  let parsedData = JSON.parse(data1);
  _users = {...parsedData};
}

//Initializing URL Database Part 3
//For testing purposes we need to add these links every server startup
_urlDatabase['b6UTxQ'] = {
  longURL: "https://www.tsn.ca",
  userID: "aJ48lW",
};

_urlDatabase['i3BoGr'] = {
  longURL: "https://www.google.ca",
  userID: "aJ48lW",
};

_urlDatabase['b2xVn2'] = {
  longURL: "http://www.lighthouselabs.ca",
  userID: "tJ45ls",
};

_urlDatabase['9sm5xK'] = {
  longURL: "http://www.google.com",
  userID: "tJ45ls",
};

// Initializing USER dataBase Part 3
//For testing purposes we need to add these _users every server startup
_users['aJ48lW'] = {
  id: "aJ48lW",
  email: "user@example.com",
  password: bcrypt.hashSync('1234', 10)
};
_users['tJ45ls'] = {
  id: "tJ45ls",
  email: "user2@example.com",
  password: bcrypt.hashSync('1234', 10)
};

// STRETCH: Feature 0) Url visit history Object/Database
let _urlVisits = {
  // lPiGRA: {
  //   userID: 'BaZg4f',
  //   time: 1660268400,
  //   shortUrl: 'lPiGRa',
  //   "longURL":"http://www.youtube.com"
  // }
};

// Error messages and redirect messages
let errorMessages = {
  reject1: '<html><body><a href="/urls"">This short URL does not belong to you</a></body></html>\n',
  pleaseLogin: '<html><body><a href="/login">Please login/register to access this page</a></body></html>\n',
  invalidURL: "<html><body>The short url is not a valid ID</body></html>\n",
  invalidURL2: '<html><body><a href="/urls">URL does not exist</a></body></html>\n',
  loginForAccess: 'Please login/register to access the page'
};

module.exports = {
  _urlVisits,
  _urlDatabase,
  _users,
  errorMessages
};