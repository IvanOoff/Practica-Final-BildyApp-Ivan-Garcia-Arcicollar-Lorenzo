// Para verificar JWT -> QUE EL USUARIO ESTÉ LOGUEADO ANTES DE ACCEDER A UNA RUTA.
import User from '../models/User.js';
import { verifyToken } from '../utils/handleJwt.js';
import { AppError } from '../utils/AppError.js';

const authMiddleware = async (req, res, next) => {
  try {
    if (!req.headers.authorization) {
      throw AppError.unauthorized('Token no proporcionado', 'NOT_TOKEN');
    }

    const token = req.headers.authorization.split(' ').pop();
    const dataToken = await verifyToken(token);

    if (!dataToken || !dataToken._id) {
      throw AppError.unauthorized('Token invalido', 'ERROR_ID_TOKEN');
    }

    const user = await User.findById(dataToken._id);

    if (!user) {
      throw AppError.unauthorized('USUARIO NO ENCONTRADO', 'USER_NOT_FOUND');
    }

    if (user.deleted) {
      throw AppError.unauthorized('USUARIO ELIMINADO', 'USER_DELETED');
    }
    req.user = user;

    next(); // tODO correcto.
  } catch (err) {
    next(err);
  }
};

export default authMiddleware;
