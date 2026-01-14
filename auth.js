const jwt = require('jsonwebtoken');

const authenticate = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    if (!token) {return res.status(401).json({ error: 'Token missing.' });}
    const decoded = jwt.verify(token, 'lalala1122');
    req.user = decoded; 
    next();
  } 
  catch (error) {
    res.status(401).json({ error: 'Invalid or expired token.' });
  }
};
module.exports = authenticate;