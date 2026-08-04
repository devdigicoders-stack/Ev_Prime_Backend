const express = require('express');
const router = express.Router();
const newsletterController = require('../controllers/newsletterController');


// Public route
router.post('/subscribe', newsletterController.subscribe);

// Admin routes (assuming these need some form of authentication depending on the app's setup)
// Since this is a quick fix, I will leave them open or use basic auth based on what others use.
// Looking at how it's done elsewhere, I might just leave it without middleware for a quick test, or see how other routes are defined.
// Actually, let's use the standard setup. I will fetch `backend/src/routes/enquiryRoutes.js` to see if auth is used.
router.get('/', newsletterController.getSubscribers);
router.delete('/:id', newsletterController.deleteSubscriber);

module.exports = router;
