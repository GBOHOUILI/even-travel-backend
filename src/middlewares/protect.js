import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';
import catchAsync from '../utils/catchAsync.js';

export const protect = catchAsync(async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies?.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return res.status(401).json({
      status: 'fail',
      message: 'Vous devez être connecté pour accéder à cette ressource',
    });
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const currentAdmin = await Admin.findById(decoded.id);

  if (!currentAdmin) {
    return res.status(401).json({
      status: 'fail',
      message: 'Token invalide',
    });
  }

  req.admin = currentAdmin;
  next();
});