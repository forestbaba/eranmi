const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const LocalStrategy = require('passport-local').Strategy
const mongoose = require('mongoose');
const keys = require('../helper/keys');
const bcrypt = require('bcryptjs')
const Users = require('../api/user/user')


const opts = {};
opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
opts.secretOrKey = keys.secretOrKey;



module.exports = passport => {
    passport.use(new LocalStrategy({ usernameField: 'email' }, (email, password, done) => {
        User.findOne({
          //  email: email, isAdmin: true
          email: email

        }).then(user => {
            if (!user) {
                return done(null, false, { message: 'No user found' })
            }
            bcrypt.compare(password, user.password, (err, isMatch) => {
                if (err) throw err;
                if (isMatch) {
                    //console.log(user)
                    return done(null, user)
                }
                else {
                    return done(null, false, { message: 'Password incorrect' })
                }
            })

        })
    }));

    passport.use(new JwtStrategy(opts, (jwt_payload, done) => {

        User.findById(jwt_payload._id).then(user => {
            if (!user) {

                return done(null, false, { message: ' User not found' })

            }
            else {
                return done(null, user);
            }
            return done(null, false);

        })
            .catch(err => console.log(err));
    }),
    )
    passport.serializeUser(function(user, done) {
        done(null, user.id)
    });
    passport.deserializeUser(function(id, done) {
        User.findById(id).then(user => done(null, user))
        // done(null, user.id)
    });
}
