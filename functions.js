const fs = require('fs');

//Checking if the user email already exists in the users object
const getUserByEmail = function(userEmail, users) {
  for (const userIDs in users) {
    if (users[userIDs].email === userEmail) {
      return userIDs;
    }
  }
  return undefined;
};

const writeToFileDatabase = function(urls) {
  let urlDatabaseJSON = JSON.stringify(urls);
  // Saving the new urlDatabase object into the text file
  fs.writeFile('./savedUrls.txt', urlDatabaseJSON, err => {
    if (err) {
      console.error(err);
    }
    // file written successfully
  });
};

const writeToUsersDatabase = function(users) {
  let urlDatabaseJSON = JSON.stringify(users);
  // Saving the new urlDatabase object into the text file
  fs.writeFile('./savedUsers.txt', urlDatabaseJSON, err => {
    if (err) {
      console.error(err);
    }
    // file written successfully
  });
};

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

// This security will help reduce repetition of code.
const appSecurity = function(req, users, callback, callback2) {
  let userID = req.session.userid;
  if (userID !== undefined && users[userID] !== undefined && users[userID].id === userID) {
    callback(userID);
  } else {
    callback2();
  }
};

// This function returns our familiar dataObject we are used to!
const urlsForUser = function(userID, urlDatabase) {
  let dataObject = {};
  for (const shortUrls in urlDatabase) {
    if (userID === urlDatabase[shortUrls].userID) {
      dataObject[shortUrls] = urlDatabase[shortUrls].longURL;
    }
  }
  return dataObject;
};

module.exports = {
  getUserByEmail,
  urlsForUser,
  appSecurity,
  generateRandomString,
  writeToFileDatabase,
  writeToUsersDatabase
};