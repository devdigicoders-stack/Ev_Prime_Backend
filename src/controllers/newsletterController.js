const Newsletter = require('../models/Newsletter');

// Subscribe to newsletter
exports.subscribe = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ success: false, message: 'Email is required' });
        }

        // Check if already subscribed
        const existingSubscriber = await Newsletter.findOne({ email });
        if (existingSubscriber) {
            if (existingSubscriber.status === 'unsubscribed') {
                existingSubscriber.status = 'active';
                await existingSubscriber.save();
                return res.status(200).json({ success: true, message: 'Successfully re-subscribed to the newsletter!' });
            }
            return res.status(400).json({ success: false, message: 'You are already subscribed.' });
        }

        const newSubscriber = new Newsletter({ email });
        await newSubscriber.save();

        res.status(201).json({ success: true, message: 'Successfully subscribed to the newsletter!' });
    } catch (error) {
        console.error('Newsletter subscription error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// Get all subscribers (Admin)
exports.getSubscribers = async (req, res) => {
    try {
        const subscribers = await Newsletter.find().sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: subscribers });
    } catch (error) {
        console.error('Error fetching subscribers:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// Delete subscriber (Admin)
exports.deleteSubscriber = async (req, res) => {
    try {
        const { id } = req.params;
        await Newsletter.findByIdAndDelete(id);
        res.status(200).json({ success: true, message: 'Subscriber deleted successfully' });
    } catch (error) {
        console.error('Error deleting subscriber:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
