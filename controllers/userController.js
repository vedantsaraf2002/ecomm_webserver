const User = require('../models/user');
const BigPromise = require("../middlewares/bigPromise");
const CustomErorr = require('../utils/customError');
const cookieToken = require('../utils/cookieToken');
const fileUpload = require('express-fileupload');
const cloudinary = require('cloudinary');
const mailHelper = require("../utils/emailHelper");
const crypto = require('crypto');
const CustomError = require('../utils/customError');

exports.signup = BigPromise(async (req,res,next) => {

    // let result;
    if (!req.files) {
        return next(new CustomError("photo is required for signup", 400));
      }

    const {name, email, password} = req.body
    if(!email || !name || !password){
        return next(new CustomErorr('Name, email and password are required', 400));
    }
    let file = req.files.photo;

    const result = await cloudinary.v2.uploader.upload(file.tempFilePath, {
        folder: "users",
        width: 150,
        crop: "scale",
    });

   const user = await User.create({
        name,
        email,
        password,
        photo: {
            id: result.public_id,
            secure_url: result.secure_url,
        }
    });

    cookieToken(user, res);
});

exports.login = BigPromise(async (req,res,next) => {
    const {email, password} = req.body

    // check for presence of email and password
    if (!email || !password){
        return next(new CustomErorr('please provide email and password', 400))
    }
    // get user from DB
    const user = await User.findOne({email}).select("+password")
    // checking the user is registered or not
    if (!user){
        return next(new CustomErorr('User not registered', 400))
    }
    // checks the password is correct or not.
    const isPasswordCorrect = await user.isValidatedPassword(password)
    // case if the password does not matches.
    if (!isPasswordCorrect){
        return next(new CustomErorr('Email or password does not match or exist', 400))
    }
    // after checking all checks . token is send.
    cookieToken(user,res);

});

exports.logout = BigPromise(async (req,res,next) => {
    res.cookie('token',null,{
        expires: new Date(Date.now()),
        httpOnly: true
    });
    res.status(200).json({
        success: true,
        message: "Logout success",
    });
});

exports.forgotPassword = BigPromise(async (req,res,next) => {
    const {email} = req.body

    // checks the user in db
    const user = await User.findOne({email})

    // if user not found
    if (!user){
        return next(new CustomErorr('email not found ', 400))
    }

    // gets the forgot password token from the user model
    const forgotToken = user.getForgotPasswordToken()

    // save user fields in DB
    await user.save({validateBeforeSave: false})
    // create a URL
    const myUrl = `${req.protocol}://${req.get("host")}/password/reset/${forgotToken}`
    // craft a message
    const message = `Copy paste this link in your URL and hit enter \n\n ${myUrl}`

    // attempt to send a mail 
    try {
        await mailHelper({
            email: user.email,
            subject: " Ecomm app - password reset email",
            message,
        });
        // json response if email is success
        res.status(200).json({
            success: true,
            message: "Email sent seccessfully"
        })
        
    } catch (error) {
        user.forgotPasswordToken = undefined
        user.forgotPasswordExpiry = undefined
        await user.save({validateBeforeSave: false})

        return next( new CustomErorr(error.message, 500))
    }





});

exports.passwordReset = BigPromise(async (req,res, next) => {
    // get the token from params
    const token = req.params.token
    // hash the token as db also stores the hashed version
    const encryToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

    const user  = await User.findOne({
        encryToken,
        forgotPasswordExpiry: {$gt: Date.now()}
    })

    if (!user){
        return next(new CustomErorr('Token is invalid or expired', 400))
    }

    if (req.body.password !== req.body.confirmPassword){
        return next(new CustomErorr('Password and confirm password do not match', 400))
    }
    user.password = req.body.password;

    user.forgotPasswordToken = undefined;
    user.forgotPasswordExpiry = undefined;

    await user.save({ validateBeforeSave: false });

    // send a Json response OR send token

    cookieToken(user, res);


});

exports.getLoggedInUserDetails = BigPromise(async (req,res,next) => {
   const user = await User.findById(req.user.id)
   res.status(200).json({
       success: true,
       user, 
   })
});

exports.changePassword = BigPromise(async(req,res,next) => {
    const userId = req.user.id;
    const user = await User.findById(userId).select("+password")

    const isCorrectOldPassword = await user.isValidatedPassword(req.body.oldPassword)

    if(!isCorrectOldPassword){
        return next(new CustomError('old password is incorrect', 400))
    }

    user.password = req.body.password

    await user.save()
    cookieToken(user, res)

});

exports.updateUserDetails = BigPromise(async (req, res, next) => {
    const newData = {
        name: req.body.name,
        email: req.body.email
    }

    if(req.files){
        const user = await User.findById(req.user.id);

        const imageId = user.photo.id;
        // delete the existing user photo on cloudinary
        const resp = await cloudinary.v2.uploader.destroy(imageId);

        //upload the new photo
        const result = await  cloudinary.v2.uploader.upload(req.files.photo.tempFilePath,{
            folder: "users",
            width: 150,
            crop: "scale",
        });
        newData.photo = {
            id: result.public_id,
            secure_url: result.secure_url,
        }

    }

    const user = await User.findByIdAndUpdate(req.user.id, newData,{
        new: true,
        runValidators: true,
        useFindAndModify: false,
    });
    res.status(200).json({
        success: true,
    });

});

exports.adminAllUser = BigPromise(async (req,res,next) => {
    const users = await User.find();
    res.status(200).json({
        success: true,
        users,
    });
});

exports.managerAllUser = BigPromise(async (req,res,next) => {
    const users = await User.find({role: "user"});
    res.status(200).json({
        success: true,
        users,
    });
});

exports.admingetOneUser = BigPromise(async (req,res,next) => {
    const user = await User.findById(req.params.id);
    if(!user){
        next(new CustomErorr("No user found", 400));
    }
    res.status(200).json({
        success:true,
        user,
    });
});

exports.adminUpdateOneUserDetails = BigPromise(async (req, res, next) => {
    const newData = {
        name: req.body.name,
        email: req.body.email,
        role: req.body.role,
    }

    const user = await User.findByIdAndUpdate(req.params.id, newData,{
        new: true,
        runValidators: true,
        useFindAndModify: false,
    });
    res.status(200).json({
        success: true,
    });

});

exports.adminDeleteOneUser = BigPromise(async (req, res, next) => {
   const user = User.findById(req.params.id)

   if(!user){
       return next(new CustomErorr('No such user found', 401))
   }
   const imageId = user.photo.id
   await cloudinary.v2.uploader.destroy(imageId)
   await user.remove()

   res.status(200).jsom({
       success: true
   })

});