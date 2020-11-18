'use strict'
// -------------------------
// Application Dependencies
// -------------------------
require('dotenv').config();
const express = require('express');
const pg = require('pg');
const superagent = require('superagent');
const cors = require('cors');
const methodOverride = require('method-override');

// -------------------------
// Environment variables
// -------------------------
const HP_API_URL = process.env.HP_API_URL;
// -------------------------
// Application Setup
// -------------------------
const app = express();
const PORT = process.env.PORT || 3000;

// Express middleware
// Utilize ExpressJS functionality to parse the body of the request
app.use(express.urlencoded({ extended: true }));
app.use(cors());
// Application Middleware override
app.use(methodOverride('_method'));

// Specify a directory for static resources
app.use('/public', express.static('./public'));
app.use(express.static('./img'));

// Database Setup

const client = new pg.Client(process.env.DATABASE_URL);
client.on('error', err => console.error(err));

// Set the view engine for server-side templating

app.set('view engine', 'ejs');


// ----------------------
// ------- Routes -------
// ----------------------
app.get('/home', homeHandler);
app.post('/characters', charachtersFunc);
app.post('/my-characters', FavFunc);
app.get('/my-characters', favPage);
app.get('/character/:id', detailsFunc);
app.put('/character/:id', updateFunc);
app.delete('/character/:id', deleteFunc);
app.use('*', errorHandler);






// --------------------------------
// ---- Pages Routes functions ----
// --------------------------------

function Character(obj) {
  this.name = obj.name;
  this.patronus = obj.patronus;
  this.alive = obj.alive;
}

function homeHandler(req, res) {

  res.render('pages/index');
}

function charachtersFunc(req, res) {
  let house;

  if (req.body.house === 'gryffindor') {
    house = 'gryffindor';
  } else if (req.body.house === 'hufflepuff') {
    house = 'hufflepuff';
  }
  else if (req.body.house === 'ravenclaw') {
    house = 'ravenclaw';
  } else if (req.body.house === 'slytherin') {
    house = 'slytherin';
  }

  const url = `http://hp-api.herokuapp.com/api/characters/house/${house}`;
  let charArr = [];
  superagent.get(url).then(data => {
    data.body.forEach(element => {
      charArr.push(new Character(element));
      res.render('pages/house', { data: charArr, houseName: house });
    });
  }).catch(console.error);

}

function FavFunc(req, res) {
  const sql = 'INSERT INTO potter_api (name,patronus,alive) VALUES ($1,$2,$3);';
  const values = [req.body.Name, req.body.patronus, req.body.Alive];
  client.query(sql, values).then(() => {
    res.redirect('/my-characters');
  }).catch(console.error);
}

function favPage(req, res) {
  const sql = 'SELECT * FROM potter_api;';
  client.query(sql).then(data => {
    res.render('pages/mycharacters', { result: data.rows });
  }).catch(console.error);
}

function detailsFunc(req, res) {
  const id = [req.params.id];
  const sql = 'SELECT * FROM potter_api WHERE id=$1;';
  client.query(sql, id).then(data => {
    res.render('pages/details', { data: data.rows[0] });
  }).catch(console.error);
}

function updateFunc(req, res) {
  const id = req.params.id;
  const sql = 'UPDATE potter_api SET name=$1,patronus=$2,alive=$3 WHERE id=$4;';
  const values = [req.body.name, req.body.patronus, req.body.alive, id];
  client.query(sql, values).then(() => {
    res.redirect('/my-characters');
  }).catch(console.error);

}

function deleteFunc(req, res) {
  const id = [req.params.id];
  const sql = 'DELETE FROM potter_api WHERE id=$1;';
  client.query(sql, id).then(() => {
    res.redirect('/my-characters');
  }).catch(console.error);
}

function errorHandler(req, res) {
  res.status(404).send('404 NOT FOUND!');
}
// -----------------------------------
// --- CRUD Pages Routes functions ---
// -----------------------------------



// Express Runtime
client.connect().then(() => {
  app.listen(PORT, () => console.log(`Listening on port: ${PORT}`));
}).catch(error => console.log(`Could not connect to database\n${error}`));
