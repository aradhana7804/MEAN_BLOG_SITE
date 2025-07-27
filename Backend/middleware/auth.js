// const jwt = require('jsonwebtoken');

// const verifyToken = (req, res, next) => {
//     const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];

//     if (!token) {
//         return res.status(401).json({ message: 'Access denied. No token provided.' });
//     }

//     try {
//         const decoded = jwt.verify(token, 'mysecret'); // Replace with your actual secret
//         req.author = decoded; // Attach decoded user data
//         next(); // Continue to the route
//     } catch (error) {
//         console.log("Token:==>",token)
//         res.status(403).json({ message: 'Invalid or expired token.' });
//     }
// };

// module.exports = verifyToken;
