const Validator = require("validator");
const isEmpty = require("../../helper/is-empty");
module.exports = function validateSignupInput(data) {
  let errors = {};

  data.first_name = !isEmpty(data.first_name) ? data.first_name : "";
  data.family_name = !isEmpty(data.family_name) ? data.family_name : "";
  data.email = !isEmpty(data.email) ? data.email : "";
  data.mobile_no = !isEmpty(data.mobile_no) ? data.mobile_no : "";
  data.password = !isEmpty(data.password) ? data.password : "";
  data.country = !isEmpty(data.country) ? data.country : "";


  if (Validator.isEmpty(data.country)) {
    errors.error = "country field  is required";
  }

  if (!Validator.isEmail(data.email)) {
    errors.error = 'Email is invalid';
  }

  if (Validator.isEmpty(data.email)) {
    errors.error = 'email field is required';
  }
  if (Validator.isEmpty(data.mobile_no)) {
    errors.error = 'mobile_no field is required';
  }


  if (!Validator.isLength(data.family_name, { min: 3, max: 25 })) {
    errors.error = "family_name must be between 2 and 50 characters ";
  }

  if (Validator.isEmpty(data.family_name)) {
    errors.error = "family_name field is required";
  }
  if (!Validator.isLength(data.first_name, { min: 3, max: 25 })) {
    errors.error = "first_name must be between 2 and 50 characters ";
  }
  if (Validator.isEmpty(data.first_name)) {
    errors.error = "first_name field is required";
  }


  return {
    errors,
    isValid: isEmpty(errors)
  };
};
