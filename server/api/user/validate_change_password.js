const Validator = require("validator");
const isEmpty = require("../../helper/is-empty");
module.exports = function validateChangePassword(data) {
  let errors = {};


  data.oldpassword = !isEmpty(data.oldpassword) ? data.oldpassword : "";
  data.password = !isEmpty(data.password) ? data.password : "";
  
    if (!Validator.isLength(data.password, { min: 6, max: 30 })) {
      errors.error = "Password must be atleast 6 characters";
    }

  if (Validator.isEmpty(data.password)) {
    errors.error = "password field  is required";
  }
  if (Validator.isEmpty(data.oldpassword)) {
    errors.error = "oldpassword field  is required";
  }
  return {
    errors,
    isValid: isEmpty(errors)
  };
};
