const Joi = require('joi');
const express = require('express');
bodyParser = require('body-parser')

// create application/json parser - used for /post method only
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json());

// routes is an instance of the express router
// We use it to define our API endpoints
// The router will be added as a middleware and will take control of routing requests to the correct endpoint
const routes = express.Router();

// This will help us connect to the database
const dbo = require('../db/db')

// Health check endpoint
// Endpoint to call to ensure your API is up and healthy
// Can use a service to call this and report the health of your API using CI
routes.route('/health').get(async function (_req, res) {
  const data = {
    uptime: process.uptime(),
    message: 'OK',
    date: new Date()
  }

  res.status(200).send(data);
});

// Endpoint to get pet records
routes.route('/pets').get((req, res) => {
  const db = dbo.getDb();
  let type = req.query.type;
  let breed = req.query.breed;

  // Returns pet records based on type (using query params)
  if (type && !breed) {
    db.collection("pets").find({ type: type }).toArray((err, result) => {
      if (result.length === 0) return res.status(404).send(`no type of ${type} exists.`);
      res.status(200).send(result);
    });
    return;
  }

  // Returns pet records based on type and breed (using query params)
  if (type && breed) {
    db.collection("pets").find({ type: type, breed: breed }).toArray((err, result) => {
      if (result.length === 0) return res.status(404).send(`no type of ${type} and breed of ${breed} exists.`);
      res.status(200).send(result);
    })
    return;
  }

  // Returns all pet records
  db.collection("pets").find({}).toArray((err, result) => {
    if (err) throw err;
    res.status(200).send(result);
  })
});

// Endpoint to get risk information based on type and breed
routes.route('/pets/quote/:type/:breed').get((req, res) => {
  const db = dbo.getDb();
  let type = req.params.type;
  let breed = req.params.breed;

  db.collection("pets").find({ type: type, breed: breed }).project({ type: 1, breed: 1, risk: 1, _id: 0 }).toArray((err, result) => {
    if (result.length === 0) return res.status(404).send(`no type of ${type} and breed of ${breed} exists.`);
    res.status(200).send(result);
  });
});

// Endpoint to add a new pet record
routes.route('/pets').post((req, res) => {
  const db = dbo.getDb();
  if (!req.body.type || !req.body.breed || !req.body.risk) return res.status(404).send("type, breed and risk is required.");
  
  const pet = {
    _id: 1,
    type: req.body.type,
    breed: req.body.breed,
    risk: req.body.risk
  };

  db.collection("pets").insertOne(pet, function (err) {
    if (err) return callback(err);
    console.log("1 document inserted");
  });

  res.send(pet);

});

// Endpoint to update an existing pet record
routes.route('/pets/:id').put((req, res) => {
  const db = dbo.getDb();
  if (!req.body.type || !req.body.breed || !req.body.risk) {
    res.status(404).send("type, breed and risk is required.")
    return;
  };

  let updatedPet = {
    type: req.body.type, 
    breed: req.body.breed, 
    risk: req.body.risk
  };

  db.collection("pets").updateOne({ _id: req.params.id }, updatedPet, function (err, res) {
    if (res) throw err;
    console.log("1 document updated");
  });

  res.send(updatedPet)

});

// Endpoint to delete a pet record 
routes.route('/pets/:id').delete((req, res) => {
  const db = dbo.getDb();
  db.collection("pets").deleteOne({ _id: req.params.id }, function (err, delRes) {
    if (delRes.deletedCount === 0) return res.status(404).send(`no entry exists for the given id: ${req.params.id}.`);
    res.send("1 document deleted");
  });

});


module.exports = routes;