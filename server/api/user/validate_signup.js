const Validator = require("validator");
const isEmpty = require("../../helper/is-empty");
module.exports = function validateSignupInput(data) {
  let errors = {};

  data.name = !isEmpty(data.name) ? data.name : "";
  data.username = !isEmpty(data.username) ? data.username : "";
  data.email = !isEmpty(data.email) ? data.email : "";
  data.mobile_no = !isEmpty(data.mobile_no) ? data.mobile_no : "";
  data.password = !isEmpty(data.password) ? data.password : "";


  if (!Validator.isLength(data.password, { min: 5, max: 30 })) {
    errors.error = "Password must be atleast 5 characters";
  }

  if (Validator.isEmpty(data.password)) {
    errors.error = "Password field  is required";
  }

  if (Validator.isEmpty(data.mobile_no)) {
    errors.error = "mobile_no field is required";
  }

  if (!Validator.isEmail(data.email)) {
    errors.error = 'Email is invalid';
  }

  if (Validator.isEmpty(data.email)) {
    errors.error = 'email field is required';
  }

  if (!Validator.isLength(data.username, { min: 3, max: 25 })) {
    errors.error = "username must be between 2 and 50 characters ";
  }

  if (Validator.isEmpty(data.username)) {
    errors.error = "username field is required";
  }
  if (!Validator.isLength(data.name, { min: 2, max: 50 })) {
    errors.error = "name must be between 2 and 50 characters ";
  }
  if (Validator.isEmpty(data.name)) {
    errors.error = "name field is required";
  }


  return {
    errors,
    isValid: isEmpty(errors)
  };
};
