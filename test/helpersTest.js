const { assert } = require('chai');

const { getUserByEmail, urlsForUser } = require('../helpers.js');

const testUsers = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};

let urlDatabase = {};

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

describe('getUserByEmail', function() {
  it('should return a user with valid email', function() {
    const user = getUserByEmail("user@example.com", testUsers);
    const expectedUserID = "userRandomID";
    assert.strictEqual(user, expectedUserID);
  });
  it('should return undefined since the email is not on list', function() {
    const user = getUserByEmail("user10@example.com", testUsers);
    const expectedUserID = undefined;
    assert.strictEqual(user, expectedUserID);
  });
  it('should return undefined since the email is not on list', function() {
    const user = getUserByEmail("user10@example.com", testUsers);
    const expectedUserID = undefined;
    assert.strictEqual(user, expectedUserID);
  });
});

describe('urlsForUser', function() {
  it('should return the expected list of URLS for a given user', function() {
    const urls = urlsForUser('aJ48lW', urlDatabase);
    const expectedURLS = {
      'b6UTxQ': 'https://www.tsn.ca',
      'i3BoGr': 'https://www.google.ca'
    };
    assert.deepEqual(urls, expectedURLS);
  });
  it('should return undefined since user does not have any urls', function() {
    const urls = getUserByEmail("aaaaaa", testUsers);
    const expectedURLS = undefined;
    assert.deepEqual(urls, expectedURLS);
  });
});