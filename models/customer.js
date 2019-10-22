const mongoose = require('mongoose');
const Joi = require('joi');

const customerSchema = new mongoose.Schema({
    isGold: {
        type: Boolean,
        default: false
    },
    name: {
        type: String,
        required: true,
        minLength: 5,
        maxLength: 50,
    },
    phone: {
        type: String,
        validate: {
            validator: function(v) {
                return /^[0-9]{7,10}$/.test(v);
            },
            message: props => `${props.value} is not a valid phone number!`
        },
        required: [true, 'User phone number required']
    }
});

const Customer = mongoose.model('Customer', customerSchema);

async function validateCustomer(customer) {
    const schema = {
        name: Joi.string().trim().min(5).required(),
        isGold: Joi.boolean(),
        phone: Joi.string().trim().regex(/^[0-9]{7,10}$/).required()
    };

    try {
        await Joi.validate(customer, schema);
    } catch (ex) {
        return {
            error: {
                details: [
                    { message : ex.message }
                ]
            }
        }
    }

    return true;
}

exports.Customer = Customer;
exports.customerSchema = customerSchema;
exports.validateCustomer = validateCustomer;