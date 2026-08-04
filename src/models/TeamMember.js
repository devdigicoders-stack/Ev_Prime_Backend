const mongoose = require('mongoose');

const teamMemberSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    role: {
        type: String,
        required: true,
        trim: true
    },
    image: {
        type: String,
        required: true
    },
    socials: {
        linkedin: {
            type: String,
            default: '#'
        },
        twitter: {
            type: String,
            default: '#'
        },
        email: {
            type: String,
            default: '#'
        }
    },
    order: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('TeamMember', teamMemberSchema);
