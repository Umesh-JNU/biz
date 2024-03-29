const multer = require("multer");
const ErrorHandler = require("../utils/errorHandler");
const e = require("express");

module.exports = (err, req, res, next) => {
	console.log({ err })
	// console.log({ keys: Object.keys(err?.parent) });
	err.message = err.message || "Internal Server Error";

	if (err instanceof multer.MulterError) {
		if (err.code === "LIMIT_FILE_SIZE") {
			err = new ErrorHandler("File size is too large", 400);
		}

		if (err.code === "LIMIT_FILE_COUNT") {
			err = new ErrorHandler("File limit reached", 400);
		}

		if (err.code === "LIMIT_UNEXPECTED_FILE") {
			err = new ErrorHandler("File must be an image", 400);
		}
	}

	if (err.name === "CastError") {
		const msg = `Resource not found. Invalid: ${err.path}`;
		err = new ErrorHandler(msg, 400);
	}

	if (err.name === "SequelizeValidationError") {
		let errors = Object.values(err.errors).map((el) => {
			console.log({ el })
			let e;
			if (el.validatorKey === 'notEmpty' || el.validatorKey === 'notNull' || el.validatorKey === 'is_null') e = el.message;
			else e = el.message;

			const er = JSON.stringify({ [el.path]: e });
			console.log(er);
			return er
		});

		const msg = `Validation Failed. ${errors}`;
		err = new ErrorHandler(msg, 400);
	}

	// sequelize duplicate key error
	if (err.name === "SequelizeUniqueConstraintError") {
		const { path } = err.errors[0];
		const { table } = err?.parent;

		console.log({ path, table })
		switch (path) {
			case "categoryName":
				err = new ErrorHandler("Category already exists. Category name must be unique.", 400);
				break;

			case "title":
				err = new ErrorHandler("Service already exists. Service title must be unqiue.", 400);
				break;

			case "providerId":
				err = new ErrorHandler("Provider Id must be unique", 400);
				break;

			case "userId":
				if (table === 'wishlist')
					err = new ErrorHandler("Enquiry already created.", 400);
				break;

			default:
				break;
		}
	}

	if (err.name === "AggregateError") {
		err = new ErrorHandler(err.errors[0].message.split("\n")[0], 400);
	}

	if (err?.parent?.code === '22P02') {
		err = new ErrorHandler("Invalid Id", 400);
	}

	// wrong jwt error
	if (err.name === "JsonWebTokenError") {
		const message = `Json Web Token is invalid, try again`;
		err = new ErrorHandler(message, 400);
	}

	// JWT expire error
	if (err.name === "TokenExpiredError") {
		const message = `Json Web Token is expired, try again`;
		err = new ErrorHandler(message, 400);
	}

	res.status(err.statusCode || 500).json({
		success: false,
		error: {
			message: err.message,
		},
	});
};
