const express = require('express');
const router = express.Router();
const bcrypt = require("bcrypt");
const Joi = require('joi');
const { User, validateAuth } = require('../models/user');
const validate = require('../middleware/validate');

router.post('/', validate(validateAuth), async (req, res) => {
    let user = await User.findOne({ email: req.body.email });
    if (!user) return res.status(400).send("Invalid email or password.");

    const validPassword = await bcrypt.compare(req.body.password, user.password);
    if (!validPassword) return res.status(400).send("Invalid email or password.");

    res.send({ token : user.generateAuthToken()});
});

module.exports = router;