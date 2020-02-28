const express = require("express");
const router = express.Router();
const path = require('path')
const bcrypt = require('bcryptjs');
const passport = require('passport');
const User = require("./userModel");
const validateSignUp = require('./validate_signup');
const validateLogin = require('./validate_login');
const validateChangePassword = require('./validate_change_password');
const validateUpdateUserDetails = require('./validate_update_user_details');
const validatePhoneNumber = require('validate-phone-number-node-js');
const jwt = require('jsonwebtoken');
const keys = require('../../helper/keys');
const async = require('async')
const nodemailer = require('nodemailer')
const hbs = require('nodemailer-express-handlebars')
var randomstring = require("randomstring");
const crypto = require('crypto');
const nodeMailer = require('nodemailer');

const uploadfolder = path.join(__dirname, '../../public/document-uploads/images');
const emailpath = path.join(__dirname, '../../views');
const { authenticate } = require('../../helper/middleware')




router.post("/signup", (req, res) => {
    const { errors, isValid } = validateSignUp(req.body);

    if (!isValid) {
        return res.status(400).json(errors);
    }

    User.findOne({ email: req.body.email }).then(user => {
        if (user) {
            return res.status(422).json({ error: "Email already exist" });
        }

        else {
            User.findOne({ mobile_no: req.body.mobile_no }).then(phone => {
                if (phone) {
                    return res.status(422).json({ error: "mobile number already exist" });
                } else {
                    User.findOne({ username: req.body.username })
                        .then(username => {
                            if (username) {
                                res.status(422).json({ error: true, message: 'username already exist' })
                            } else {
                                const newUser = {
                                    apikey: randomstring.generate({ length: 70, charset: 'alphabetic' }),
                                    name: req.body.name,
                                    username: req.body.username,
                                    email: req.body.email,
                                    mobile_no: req.body.mobile_no,
                                    password: req.body.password,
                                    isAdmin: req.body.isAdmin
                                };

                                bcrypt.genSalt(10, (err, salt) => {
                                    bcrypt.hash(newUser.password, salt, (err, hash) => {
                                        if (err) throw err;
                                        newUser.password = hash;
                                        let userInstance = new User(newUser);

                                        userInstance.save().then(() => {
                                            //  return  jwt.sign(userInstance, keys.secretOrKey, { expiresIn: 86400 }, (err, token) => {
                                            //         res.json({
                                            //             success: true,
                                            //             token: 'Bearer ' + token,
                                            //             user: payload
                                            //         })

                                            //     });

                                            // return userInstance.generateAuthToken()
                                            // res.json({ reguser })
                                            res.status(200).json({ error: false, message: 'User registered successfully' })

                                        })
                                            .catch(err => res.status(400).json({ error: err }))
                                    });
                                });
                            }
                        })



                }
            });
        }
    });

})



router.get('/getMe', passport.authenticate('jwt', { session: false }), (req, res) => {
    res.send(req.user)

})
router.get('/current', passport.authenticate('jwt', { session: false }), (req, res) => {
    res.json({
        id: req.user.id,
        email: req.user.email,
        name: req.user.name,
        username: req.user.username,
        mobile_no: req.user.mobile_no,
        date: req.user.date_created,
        followers: req.user.followers,
        following: req.user.following,
         totalNumberOfComments: req.user.totalNumberOfComments,
        totalNumberOfPosts: req.user.totalNumberOfPosts,
        totalNumberOfLikes: req.user.totalNumberOfLikes

    });
})
router.delete('/delete', passport.authenticate('jwt', { session: false }), (req, res) => {
    req.user.removeToken(req.token).then(() => {
        res.status(200).send()
    }).catch(() => {
        res.status(400).send()
    })
})
router.post("/checkUser", (req, res) => {
    const { errors, isValid } = validateSignUp(req.body);
    const { perrors, pisValid } = validPhone(req.body.mobile_no);
    const result = validatePhoneNumber.validate(req.body.mobile_no);

    console.log('Result value: ' + result);

    if (!isValid) {
        return res.status(400).json(errors);
    }


    if (result === false) {
        return res.status(400).json({ error: 'Please provide a valid mobile number' });
    }



    User.findOne({ email: req.body.email }).then(user => {
        if (user) {
            return res.status(422).json({ error: "Email already exist" });
        } else {
            User.findOne({ mobile_no: req.body.mobile_no }).then(phone => {
                if (phone) {
                    return res.status(422).json({ error: "mobile number already exist" });
                } else {
                    res.status(200).json({ error: false, message: 'User does not exist' })
                }
            });
        }
    });

})

router.post("/login", (req, res) => {
    console.log('inside login')

    const errors = {}
    // const { errors, isValid } = validateLogin(req.body);

    // if (!isValid) {
    //     return res.status(400).json(errors);
    // }

    if (req.body.emailorusername === null || req.body.emailorusername === '' || req.body.emailorusername === undefined) {
        return res.status(400).json({ error: true, message: 'emailorusername is required'})
    }
    if (req.body.password === null || req.body.password === '' || req.body.password === undefined) {
        return res.status(400).json({ error: true, message: 'password is required'})
    }

    console.log('The main thing: ', req.body)

    const email = req.body.email;
    const password = req.body.password;

    User.findOne({ email: req.body.emailorusername })
    .then(user => {

           

            if (user) {
                //  console.log('user:  ', user)
                if (user.isActive === true) {
                    bcrypt.compare(password, user.password)
                        .then(isMatch => {
                            // console.log('Email founc')

                            if (isMatch) {
                                User.findOneAndUpdate({ lastlogin: Date.now() })
                                User.findOne({
                                    _id: user.id
                                }).then(user => {
                                    if (user) {
                                        const payload = {
                                            _id: user._id,
                                            name: user.name,
                                            email: user.email,
                                            mobile_no: user.mobile_no,
                                            username: user.username,
                                            following: user.following,
                                            followers: user.followers
                                        }
 
                                        jwt.sign(payload, keys.secretOrKey, { expiresIn: 86400 }, (err, token) => {
                                            res.json({
                                                success: true,
                                                token: 'Bearer ' + token,
                                                user: payload
                                            })

                                        });



                                        // const payload = {
                                        //     id: user.id,
                                        //     email: user.email, 
                                        //     mobile_no: user.mobile_no,
                                        //     first_name: user.first_name,
                                        //     family_name: user.family_name,
                                        //     lastlogin: user.lastlogin,
                                        //     profile_pix: user.profile_pix,
                                        //     apikey: user.apikey
                                        // }
                                        // res.status(200).json({ error: false, user: payload })
                                    }
                                })

                            } else {
                                errors.password = "Email or Password is incorrect";
                                return res.status(400).json(errors);
                            }
                        })
                        .catch(err => console.log(err));
                    console.log("here 2");
                } else {
                    errors.user = "You account is currently not active, contact support for additional information";
                }

            } else {
                return res.status(400).json({error: true, message:'User not found'})
            }
            //else {
            //     User.findOne({ username: req.body.emailorusername })
            //         .then(user => {

            //             if (user) {
            //                 if (user.isActive === true) {
            //                     bcrypt
            //                         .compare(password, user.password)
            //                         .then(isMatch => {
            //                             if (isMatch) {
            //                                 User.findOneAndUpdate({ lastlogin: Date.now() })
            //                                 User.findOne({
            //                                     _id: user.id
            //                                 }).then(user => {
            //                                     if (user) {
            //                                         const payload = {
            //                                             _id: user._id,
            //                                             name: user.name,
            //                                             email: user.email,
            //                                             mobile_no: user.mobile_no,
            //                                             username: user.username,
            //                                             following: user.following,
            //                                             followers: user.followers

            //                                         }

            //                                         jwt.sign(payload, keys.secretOrKey, { expiresIn: 86400 }, (err, token) => {
            //                                             res.json({
            //                                                 success: true,
            //                                                 token: 'Bearer ' + token,
            //                                                 user: payload
            //                                             })

            //                                         });


            //                                     }
            //                                 })
                                            

                                           
            //                             } else {
            //                                 errors.password = "Email or Password is incorrect";
            //                                 return res.status(400).json(errors);
            //                             }
            //                         })
            //                         .catch(err => console.log(err));
            //                     // console.log("here 2");
            //                 } else {
            //                     errors.user = "You account is currently not active, contact support for additional information";
            //                 }

            //             } else {
            //                 res.status(400).json({ error: true, message: 'Either email,username or password is incorrect' })
            //                 // return res.status(400).json(errors)
            //             }
            //         })

            // }
            // }

        })
        .catch(err => res.status(400).json(err))
});

router.post("/adminlogin", (req, res) => {

    const { errors, isValid } = validateLogin(req.body);

    if (!isValid) {
        return res.status(400).json(errors);
    }

    const email = req.body.email;
    const password = req.body.password;

    User.findOne({ email: req.body.email, isAdmin: true })
        .then(user => {
            if (!user) {
                errors.email = "User not found";
                return res.status(400).json(errors)
            }

            bcrypt.compare(password, user.password).then(isMatch => {
                if (isMatch) {
                    User.findOneAndUpdate({ lastlogin: Date.now() })
                    const payload = {
                        id: user.id,
                        email: user.email,
                        mobile_no: user.mobile_no,
                        first_name: user.first_name,
                        family_name: user.family_name,
                        lastlogin: user.lastlogin
                    }
                    jwt.sign(payload, keys.secretOrKey, { expiresIn: 86400 }, (err, token) => {
                        res.json({
                            success: true,
                            token: 'Bearer ' + token
                        })

                    });

                } else {
                    errors.password = "Email or Password is incorrect";
                    return res.status(400).json(errors);
                }
            })
                .catch(err => console.log(err));
            console.log("here 2");
        })
        .catch(err => res.status(400).json(err))
});



router.get('/getAllUsersCount', (req, res) => {
    User.countDocuments({ isAdmin: false }).then(users => {
        if (users) {
            res.status(200).json({ users })
        }
    })
})

router.get('/getAllAdmin', (req, res) => {
    User.find({ isAdmin: true }).then(admins => {
        if (admins) {
            res.status(200).json({ admins })
        }
    })
})


router.post('/sendMessage', (req, res) => {
    const { errors, isValid } = validateSendMessage(req.body);

    if (!isValid) {
        return res.status(400).json(errors);
    }

    User.findOne({
        mobile_no: req.body.mobile_no
    }).then(user => {
        if (user) {
            res.status(401).json({ error: true, message: 'Mobile number already exist' })
        } else {
            messagebird.verify.create(req.body.mobile_no, {
                template: 'Your Verification code is %token'
            }, function (err, response) {
                if (err) {
                    res.status(401).json({ message: err.errors[0].description })
                } else {
                    res.status(200).json({ status: 'success', message: response.id })
                }
            })
        }
    })



})

router.post('/verifysms', function (req, res) {

    messagebird.verify.verify(req.body.smsid, req.body.token, function (err, response) {

        if (err) {
            // res.status(401).json({ status: 'error', message: err.errors[0].description })
            res.status(401).json({ status: 'error', message: err })
        } else {
            console.log('response: ' + response)
            res.status(200).json({ message: 'verification is successful' })
            User.findByIdAndUpdate({
                _id: req.body.userId
            }, { $set: { isMobileNumberVerified: true } }).then(user => {
                if (user) {
                    res.status(200).json({ status: '' })
                }
            })
        }
    })

})


router.delete('/', passport.authenticate('jwt', { session: false }), (req, res) => {


    User.findOneAndRemove({ user: req.user.id })
        .then(() => {
            User.findOneAndRemove({ _id: req.user.id })
                .then(() => res.json({ success: true, message: "User Deleted successfully" }))
        })
});

router.post('/deactivate', passport.authenticate('jwt', { session: false }), (req, res) => {
    User.findOneAndUpdate({ _id: req.user._id }, { $set: { deactivate: true } }, { upsert: true })
})


router.post('/updatePassword', passport.authenticate('jwt', { session: false }), (req, res) => {

    const { errors, isValid } = validateChangePassword(req.body);

    if (!isValid) {
        return res.status(400).json(errors);
    }
    User.findOne({ _id: req.user._id })
        .then(user => {
            if (user) {
                console.log('Old password: ' + user.password)
                bcrypt.compare(req.body.oldpassword, user.password)
                    .then(isMatch => {

                        if (isMatch) {
                            console.log('Password match');


                            bcrypt.genSalt(10, (err, salt) => {
                                bcrypt.hash(req.body.password, salt, (err, hash) => {
                                    console.log('New password: ' + hash)
                                    if (err) throw err;
                                    req.body.password = hash;

                                    User.findOneAndUpdate({ _id: req.user._id },
                                        { $set: { password: hash } }, { upsert: true })
                                        .then(user => res.status(200).json({ error: false, message: 'password update successfully' }))
                                        .catch(err => res.status(400).json({ error: true, message: err }))
                                });
                            });


                        } else {
                            res.status(400).json({ error: true, message: 'old password do not match' })
                        }
                    })
                    .catch(err => res.status(400).json({ error: true, message: "An error occurred" }));
            }
        })
})


router.post('/updateUserDetails', passport.authenticate('jwt', { session: false }), (req, res) => {

    const { errors, isValid } = validateUpdateUserDetails(req.body);

    if (!isValid) {
        return res.status(400).json(errors);
    }
    const userFields = {};
    userFields.first_name || req.body.first_name;
    userFields.family_name = req.body.family_name;
    userFields.mobile_no = req.body.mobile_no;
    userFields.country = req.body.country;


    User.findOneAndUpdate({ _id: req.user.id },
        { $set: userFields }, { upsert: true })
        .then(user => res.status(200).json({ status: 'success', user: user }));



});

router.get('/getAllUsers', (req, res) => {
    User.find({ _id: { "$ne": req.user } }).then(users => {
        if (users) {
            res.status(200).json({ error: false, users })
        }
    })
        .catch(err => res.status(200).json({ error: false, message: err }))
})
router.get('/getTotal', (req, res) => {
    User.find().count().then(count => {
        if (count) {
            res.status(200).json({ error: false, count })
        }
    })
        .catch(err => res.status(200).json({ error: false, message: err }))
})
router.get('/getLastThree', (req, res) => {
    User.find().sort({ _id: -1 }).limit(3)
        .then(users => {
            if (users) {
                res.status(200).json({ error: false, users })
            }
        })
        .catch(err => res.status(402).json({ error: true, message: error }))
})
router.post('/blockUser/:userId', (req, res) => {


    User.findOne({ _id: req.params.userId })
        .then(user => {
            if (user) {

                User.findOneAndUpdate({ _id: req.params.userId },
                    { $set: { isBlocked: true } }, { upsert: true })
                    .then(user => res.status(200).json({ status: 'user blocked successfully', msg: user }))
                    .catch(err => res.status(400).json({ error: err }))

            } else {
                res.status(200).json({ msg: 'Cash not found' })
            }
        }).catch(err => res.send(err))
})

router.get('/mail', (req, res) => {
    User.find({}).select('email')
        .then(user => {
            if (user) {
                user.forEach((use) => {
                    res.status(200).json({ users: use.email })
                })

            }
        })
})

router.post('/send-email', function (req, res) {

    !req.body.to || req.body.to === undefined ? res.status(401).json({ status: 'error', msg: 'to can not be empty' }) : req.body.to

    !req.body.subject || req.body.subject === undefined ? res.status(401).json({ status: 'error', msg: 'subject can not be empty' }) : req.body.subject
    !req.body.mailbody || req.body.mailbody === undefined ? res.status(401).json({ status: 'error', msg: 'mailbody can not be empty' }) : req.body.mailbody

    let transporter = nodeMailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
            user: 'adeoy3@gmail.com',
            pass: '08058741116'
        }
    });
    let mailOptions = {
        from: '"Faniran Olaitan" <xx@gmail.com>', // sender address
        to: req.body.to, // list of receivers
        subject: req.body.subject, // Subject line
        text: req.body.mailbody, // plain text body
        html: '<b>Dag</b>' // html body
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return console.log(error);
        }
        console.log('Message %s sent: %s', info.messageId, info.response);
        //res.render('index');
    });
});


router.get('/getUserViaId/:uId', (req, res) => {
    User.findOne({
        _id: req.params.uId
    })
        .then(user => {
            if (user) {
                res.status(200).json({ error: false, user })
            } else {
                res.status(404).json({ error: true, message: 'User not found' })
            }
        })
        .catch(err => res.status(400).json({ error: true, message: err }))
})

router.get('/suspend_user/:userid/:adminid', (req, res) => {

    User.findOne({
        _id: adminid, isAdmin: true
    }).then(user => {
        if (user) {
            User.findOneAndUpdate(
                { _id: req.params.userid },
                {
                    $set: {
                        isBlocked: {
                            status: true,
                            by: adminid
                        }
                    }
                },
                { upsert: true }).then(user => {
                    if (user) {
                        res.status(200).json({ error: false, message: 'user suspended' })

                    }

                })
        } else {
            res.status(401).json({ error: true, message: 'Its only admin that can do this' })
        }
    })

})
router.get('/unsuspend_user/:userid/:adminid', (req, res) => {

    User.findOne({
        _id: adminid, isAdmin: true
    }).then(user => {
        if (user) {
            User.findOneAndUpdate(
                { _id: req.params.userid },
                {
                    $set: {
                        isBlocked: {
                            status: false,
                            by: adminid
                        }
                    }
                },
                { upsert: true }).then(user => {
                    if (user) {
                        res.status(200).json({ error: false, message: 'user suspended' })

                    }

                })
        } else {
            res.status(401).json({ error: true, message: 'Its only admin that can do this' })
        }
    })

})






router.post("/forgotPassword", (req, res) => {

    if (req.body.email === '') {
        res.status(400).json('email required');
    }
    console.error(req.body.email);
    User.findOne({
        email: req.body.email,
    }).then((user) => {
        if (user === null) {
            console.error('email not found');
            res.status(404).json('email not found');
        } else {
            const token = crypto.randomBytes(20).toString('hex');
            console.log("Token: " + token);
            User.findOneAndUpdate(
                { "email": user.email },
                {
                    $set: {
                        "reset_password_token": token,
                        "reset_password_expires": Date.now() + 360000
                    }
                }
            ).then(theTok => {
                if (theTok) {
                    res.status(200).json({ error: false, message: `Password recovery email has been sent to ${req.body.email}` })
                } else {
                    console.log('failure')
                }
            });



            EmailHelper.sendPasswordReset(user.email, {
                name: user.name,
                username: user.name,
                token: 'http://157.230.229.73/api/users/reset/' + token
            });

            console.log('sending mail');

        }
    });
});



router.post('/forgot', function (req, res, next) {
    async.waterfall([
        function (done) {
            crypto.randomBytes(20, function (err, buf) {
                var token = buf.toString('hex');
                done(err, token);
            });
        },
        function (token, done) {
            User.findOne({ email: req.body.email }, function (err, user) {
                if (!user) {
                    res.status(401).json({ error: true, message: 'email not found' })
                } else {
                    //console.log('???????????' + user)

                    country = user.country;
                    console.log(' Appropriate country: ' + country)
                    user.country = country;
                    user.first_name = user.first_name;
                    user.family_name = user.family_name;
                    user.reset_password_token = token;
                    user.reset_password_expires = Date.now() + 3600000; // 1 hour

                    user.save(function (err) {
                        done(err, token, user);
                    });
                }


            });
        },
        function (token, user, done) {
            var smtpTransport = nodemailer.createTransport({

                host: 'smtp.gmail.com',
                port: 465,
                secure: true,
                auth: {
                    user: 'adeoy3@gmail.com',
                    pass: '08058741116'
                }

            });

            const handlebarOptions = {
                viewEngine: {
                    extName: '.handlebars',
                    partialsDir: path.join(__dirname, '\..\..'),
                    layoutsDir: '../dagdag//views/',
                    // layoutsDir: path.join(__dirname, '..\\..\..\\..'), 
                    defaultLayout: 'mail.handlebars',
                },
                viewPath: path.join(__dirname, 'views'),
                extName: '.handlebars',
            };

            smtpTransport.use('compile', hbs(handlebarOptions))
            var mailOptions = {
                to: user.email,
                from: 'adeoy3@gmail.com',
                subject: 'Request for password reset',
                text: 'Message from dagdag',
                template: 'mail',
                context: {
                    subject: 'Dagdag from dagdag',
                    first_name: user.first_name,
                    family_name: user.family_name,
                    firstrecoveryemail: FIRST_RECOVERY_EMAIL,
                    secondrecoveryemail: SECOND_RECOVERY_EMAIL,
                    recoverylink: LOCAL_URL + token
                    // recoverylink: BASE_URL + token

                }
            };
            smtpTransport.sendMail(mailOptions, function (err) {
                /// req.flash('info', 'An e-mail has been sent to ' + user.email + ' with further instructions.');
                res.status(200).json({ error: false, message: 'Password recovery email has been sent to you. check your email for further instructions' })
                done(err, 'done');
            });
        }
    ], function (err) {
        if (err) return next(err);
        //  res.redirect('/forgot');
    });
});


router.get('/d/reset/:token', function (req, res) {
    User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function (err, user) {
        if (!user) {
            req.flash('error', 'Password reset token is invalid or has expired.');
            return res.redirect('/forgot-password');
        }
        res.render('reset', {
            user: req.user
        });
    });
});

router.get('/getUserStatus', passport.authenticate('jwt', { session: false }), (req, res) => {
    User.findOne({ _id: req.user._id })
        .then(user => {
            if (user) {
                res.status(200).json({ error: false, active: user.isActive })
            }
        })

})

router.get('/getFirstVerify', passport.authenticate('jwt', { session: false }), (req, res) => {
    User.findOne({
        _id: req.user._id
    }).then(user => {
        if (user) {
            res.status(200).json({ error: false, firstverify: user.firstverify })
        }
    })
})

router.post('/deleteDocument', passport.authenticate('jwt', { session: false }), (req, res) => {
    User.findOneAndUpdate({ _id: req.user._id },
        {
            $set: { document_url: '' }
        }).then(dd => res.status(200).json({ error: false, message: 'Document uploaded successfully' }))

})

router.get('/getAllReceipent', passport.authenticate('jwt', { session: false }), (req, res) => {
    Receipent.find({
        user: req.user._id
    }).then(receipent => {
        if (receipent) {
            res.status(200).json({ error: false, receipent: receipent })
        }
    })

})

router.post('/follow/:id', passport.authenticate('jwt', { session: false }), (req, res) => {
    if (req.params.id.toString() === req.user._id.toString()) {
        res.status(400).json({ error: true, message: 'You can not follow yourself' })
    }
    else {
        User.findOne({
            _id: req.params.id
        }).then(user => {
            if (user) {
                User.findByIdAndUpdate({ _id: req.user._id },
                    { $push: { following: { people: req.params.id } } }).then(users => {
                        console.log('1')

                        User.findByIdAndUpdate({ _id: req.user._id },
                            { $inc: { followingCounter: 1 } }).then(() => {
                                console.log('2')

                                User.findByIdAndUpdate({ _id: req.params.id },
                                    { $push: { followers: { people: req.user._id } } }).then(followers => {
                                        console.log('3')

                                        User.findByIdAndUpdate({ _id: req.params.id },
                                            { $inc: { followersCounter: 1 } }).then(() => {
                                                console.log('4')

                                                res.status(200).json({ error: false, message: 'You are now following' })

                                            })
                                    })


                            })
                    })
            }
        })

    }

})

router.post('/unfollow/:id', passport.authenticate('jwt', { session: false }), (req, res) => {
    if (req.params.id.toString() === req.user._id.toString()) {
        res.status(400).json({ error: true, message: 'You can not unfollow yourself' })
    }
    else {
        User.findOne({
            _id: req.params.id
        }).then(user => {
            if (user) {
                User.findByIdAndUpdate({ _id: req.user._id },
                    { $pull: { following: { people: req.params.id } } }).then(users => {
                        User.findByIdAndUpdate({ _id: req.user._id },
                            { $inc: { followingCounter: -1 } }).then(() => {

                                User.findByIdAndUpdate({ _id: req.params.id },
                                    { $pull: { followers: { people: req.user._id } } }).then(followers => {

                                        User.findByIdAndUpdate({ _id: req.params.id },
                                            { $inc: { followersCounter: -1 } }).then(() => {

                                                res.status(200).json({ error: false, message: 'You are now unfollowing' })

                                            })
                                    })


                            })
                    })
            }
        })

    }

})

router.post('/updteMobileNumber', passport.authenticate('jwt', {session: false}), (req, res) => {
    User.findOne({
        mobile_no: req.body.mobile_no
    }).then(user => {
        if (!user) {
            return res.status(400).json({error:true, message:'Mobile number not does not exist'})
            
        } else {
            User.findOneAndUpdate({ mobile_no: req.body.mobile_no }, {
                $set: {
                    mobile_no:req.body.newMobileNo
                }
            }).then(user => {
                return res.status(200).json({error: false, message:'Mobile no updated successfully'})
            })
        }
    })
})
module.exports = router; 