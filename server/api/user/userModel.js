const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const validator = require('validator')
const jwt = require('jsonwebtoken')

let appSecret = "secret";

const UserSchema = new Schema({

    // first_name: {
    //     type: String,
    //     required: true
    // },
    name: {
        type: String,
       // required: true
    },
    apikey: {
        type: String
    },
    username: {
        type: String
    },
    email: {
        type: String,
        //required: true,
        // trim: true,
        // minlength:1,
        // unique: true,
        // validate:{
        //     validator: validator.isEmail,
        //     message: `${Value} is not a valid email`
        // }
    },
    tokens: [{
        access: {
            type: String,
           // required: true
        },
        token: {
            type: String,
          //  required: true
        }
    }],
    isEmailVerified: {
        type: Boolean, default: false

    },
    password: {
        type: String,
        //required: true
    },
    location: {
        type: String
    },
    bio: {
        type: String
    },


    date_of_birth: {
        type: Date
    }, followersCounter: {
            type: Number,
            default: 0
        },
    followers: [{
       
        people: [{
            type: Schema.Types.ObjectId,
            ref: 'user'
        }],
    }],
    followingCounter: { type: Number, default: 0 },

    following: [{
        people: [{
            type: Schema.Types.ObjectId,
            ref: 'user'
        }],
    }],
    
    mobile_no: {
        type: String
    },

    profile_pix: {
        type: String
    },

    isMobileNumberVerified: {
        type: Boolean,
        default: false
    },

    reset_password_token: { type: String },
    reset_password_expires: { type: Date },

    lastlogin: {
        type: Date, default: Date.now
    },
    password_updated: {
        type: Date
    },
    totalNumberOfComments: {
        type: Number,
        default: 0
    },
    totalNumberOfPosts: {
        type: Number,
        default: 0
    },
    totalNumberOfLikes: {
        type: Number,
        default: 0
    },
    reset_password_expires: {
        type: Date
    },
    isActive: { type: Boolean, default: true },

    isBlocked: [{
        status: { type: Boolean, default: false },
        by: { type: mongoose.Schema.Types.ObjectId, ref: 'user' }
    }],

    likedPost: [{type: mongoose.Schema.Types.ObjectId, ref: 'post'  }],

    isAdmin: {
        type: Boolean, default: false
    },


    date_created: {
        type: Date,
        default: Date.now
    },
    no_of_transaction: {
        type: Number,
        default: 0
    },
    tokens: [{

        access: {
            type: String,
           // required: true
        },
        token: {
            type: String,
          //  required: true
        },
    }],
    deactivate: {
        type: Boolean,
        default: false
    }


})

UserSchema.index({
    name: 1
}
);
// UserSchema.methods.toJSON = function () {
//     var user = this;
//     var userObject = user.toObject()
//     let valuetoReturn = {}
//     valuetoReturn.name = userObject.name;
//     valuetoReturn._id = userObject._id;
//     valuetoReturn.email = userObject.email

//     return valuetoReturn;
// }
// UserSchema.methods.generateAuthToken = function () {
//     /*Atleast for now, Always use function method here. Arrow function does\t
//     work with this keyword*/

//     var user = this;
//     var access = "auth"
//     var token = jwt.sign({ _id: user._id.toHexString(), access }, appSecret).toString()

//     user.name=user.name,
//     user.tokens = user.tokens.concat([{ access, token }])
//     return user.save().then(() => {
//         return token;
//     })

// }

// UserSchema.methods.removeToken = function (token) {
//     var user = this;

//     return user.update({
//         $pull: {
//             tokens: { token }
//         }
//     })
// }



UserSchema.statics.findByToken = function (token) {
    let User = this;
    let decoded;

    try {
        decoded = jwt.verify(token, appSecret)
    } catch (error) {
        // return new Promise((resolve, reject) =>{
        //     reject();
        // })

        return Promise.reject();
    }

    return User.findOne({
        _id: decoded._id,
        'tokens.token': token,
        'tokens.access': 'auth'
   })

}
module.exports = User = mongoose.model('user', UserSchema);
