const jwt = require("jsonwebtoken");
const ErrorHandler = require("../utils/errorHandler");
const { userModel } = require("../src/user/user.model");
const { providerModel } = require("../src/provider/provider.model");

exports.auth = async (req, res, next) => {
  console.log(req.headers.authorization);
  try {
    if (!req.headers.authorization) {
      return res.status(401).send({
        error: {
          message: `Unauthorized. Please Send token in request header`,
        },
      });
    }

    const tokenData = jwt.verify(
      req.headers.authorization,
      process.env.JWT_SECRET
    );
    console.log({ tokenData });

    if ("providerId" in tokenData) {
      req.userId = tokenData.providerId;
    } else {
      req.userId = tokenData.userId;
    }

    next();
  } catch (error) {
    console.log(error);
    return res.status(401).send({ error: { message: `Unauthorized` } });
  }
};

exports.onlyAdmin = async (req, res, next) => {
  try {
    const { userId } = req;
    if(typeof userId !== 'number') {
      return next(new ErrorHandler("Invalid Id", 401));
    }
    
    const user = await userModel.findByPk(userId);
    console.log(user);
    if (!user)
      return next(new ErrorHandler("Invalid token. User not found.", 404));

    console.log(user.role);
    if (user.role !== "Admin") {
      return next(new ErrorHandler("Restricted.", 401));
    }

    next();
  } catch (error) {
    return next(new ErrorHandler(error));
  }
};

exports.onlyProvider = async (req, res, next) => {
  try {
    const { userId } = req;
    const provider = await providerModel.findByPk(userId);
    console.log(provider);
    if (!provider)
      return next(new ErrorHandler("Invalid token. Provider not found.", 404));

    console.log(provider.role);
    if (provider.role !== "Provider") {
      return next(new ErrorHandler("Restricted.", 401));
    }

    next();
  } catch (error) {
    return next(new ErrorHandler(error));
  }
};

exports.authRole = (roles) => async (req, res, next) => {
  try {
    const userId = req.userId;
    const user = await userModel.findByPk(userId, {
      include: [
        {
          model: roleModel,
          as: "userRole",
          attributes: ["role"],
        },
      ],
    });

    console.log(user);
    console.log("inside is admin");
    // , userId, user.dataValues);
    if (!user)
      return next(new ErrorHandler("Invalid token. User not found.", 404));

    if (!roles.includes(user.userRole?.role))
      return next(new ErrorHandler("Restricted.", 401));

    req.user = user;

    next();
  } catch (error) {
    return next(new ErrorHandler(error));
  }
};
