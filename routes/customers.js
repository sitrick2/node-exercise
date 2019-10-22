const express = require('express');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const validate = require('../middleware/validate');
const router = express.Router();
const { Customer, validateCustomer } = require('../models/customer');

router.get('/', async (req, res) => {
    res.send(await Customer.find().sort('name'));
});

router.post('/', [auth, validate(validateCustomer)], async (req, res) => {
    res.send(await Customer.create({
        name: req.body.name,
        isGold: req.body.isGold,
        phone: req.body.phone
    }));
});

router.put('/:id', [auth, validate(validateCustomer)], async (req, res) => {
    const customer = await Customer.findByIdAndUpdate(req.params.id, {
        $set: {
            isGold: req.body.isGold,
            name: req.body.name,
            phone: req.body.phone
        }
    }, { new: true });
    if (!customer) return res.status(404).send('Cannot find customer.');

    res.send(customer);
});

router.delete('/:id', [auth, admin], async (req, res) => {
    const customer = await Customer.findByIdAndDelete(req.params.id);
    if (!customer) return res.status(404).send('Cannot delete customer: does not exist.');
    res.send(customer);
});

router.get('/:id', async (req, res) => {
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).send('Cannot find customer with that id.');
    res.send(customer);
});

module.exports = router;