const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const Subscription = require('../models/subscription');
const router = express.Router();

router.post('/subscribe', async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });
  
    try {
      const existing = await Subscription.findOne({ email });
      if (existing) {
        return res.status(409).json({ message: 'Already Subscribed' });
      }
  
      const newSub = new Subscription({ email });
      await newSub.save();
      res.status(201).json({ message: 'Subscribed Successfully' });
    } catch (err) {
      res.status(500).json({ message: 'Server Error' });
    }
  });

//   router.get('/unsubscribe', async (req, res) => {
//     const { email } = req.query;

//     if (!email) {
//         return res.status(400).json({ message: 'Email is required to unsubscribe' });
//     }

//     try {
//         const result = await Subscription.findOneAndDelete({ email: new RegExp('^' + email + '$', 'i') });

//         if (!result) {
//             return res.status(404).json({ message: 'Email not found in subscription list' });
//         }

//         // Redirect to your frontend unsubscribe confirmation page
//         res.redirect(`http://localhost:4200/unsubscribe`);
//         console.log(`Email deleted to ${email}`);
//     } catch (err) {
//         console.error('Unsubscribe error:', err);
//         res.status(500).json({ message: 'Server error while unsubscribing' });
//     }
// });

router.get('/unsubscribe', async (req, res) => {
    const { email } = req.query;
  
    if (!email) {
      return res.status(400).json({ message: 'Email is required to unsubscribe' });
    }
  
    try {
      const result = await Subscription.findOneAndDelete({ email: new RegExp('^' + email + '$', 'i') });
  
      if (!result) {
        return res.status(404).json({ message: 'Email not found in subscription list' });
      }
  
      console.log(`Email unsubscribed: ${email}`);
      return res.status(200).json({ message: 'Successfully unsubscribed' });
    } catch (err) {
      console.error('Unsubscribe error:', err);
      return res.status(500).json({ message: 'Server error while unsubscribing' });
    }
  });



  

module.exports = router;