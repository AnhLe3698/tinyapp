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
  fs.writeFile('./database/savedUrls.txt', urlDatabaseJSON, err => {
    if (err) {
      console.error(err);
    }
    // file written successfully
  });
};

const writeToUsersDatabase = function(users) {
  let urlDatabaseJSON = JSON.stringify(users);
  // Saving the new urlDatabase object into the text file
  fs.writeFile('./database/savedUsers.txt', urlDatabaseJSON, err => {
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

// Checks if the user is logged in and executes the correct callback function
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

// STRETCH: Unique visitors, Total Visitors, Visits {Timestamp, trackingID}
// Feature 0) Clicking on a URL adds to a Vistor_object {trkID:{userID, time,url}, trkID:{userID,time, url}}
// Feature A) Total views from accessing either the GET /u/:id or GET /urls/:id pages
// Feature B) Count Unique Viewers that access the url or edit page GET /u/:id or GET /urls/:id
// Feature B) Also assign a cookie to track an unregistered user who accesses /u/id
// Feature C) Scan through urlVisits Database and display User's visits HISTORY

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

// STRETCH: Feature C: History of User visits to shortURL
const urlHistory = function(req, urlVisits) {
  let visitHistory = {};
  for (const visits in urlVisits) {
    if (urlVisits[visits]['shortUrl'] === req.params.id) {
      visitHistory[visits] = urlVisits[visits]['time'];
    }
  }
  return visitHistory;
};

// STRETCH: Feature C: Converts Unix Time to current time
const timeConverter = function(unixTime) {
  let a = new Date(unixTime);
  let months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  let year = a.getFullYear();
  let month = months[a.getMonth()];
  let date = a.getDate();
  let hour = a.getHours();
  let min = a.getMinutes();
  let sec = a.getSeconds();
  let time = date + ' ' + month + ' ' + year + ' ' + hour + ':' + min + ':' + sec;
  return time;
};

module.exports = {
  getUserByEmail,
  urlsForUser,
  appSecurity,
  generateRandomString,
  writeToFileDatabase,
  writeToUsersDatabase,
  totalVisits,
  urlHistory,
  cookieViews,
  timeConverter
};