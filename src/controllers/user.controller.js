import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import {User} from "../models/user.model.js";
import { uploadOnCloundinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler( async (req, res) => {
    // res.status(200).json({
    //     message: "Ok"
    // })

    // get user details from frontend
    // validation - not empty
    // check if user already exists: username, email
    // check for images, check for avatar
    // upload then to clodinary avatar
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user create
    // return res


    const {email, username, fullName, passwrod} = req.body
    console.log("email: ", email);

    // if(fullName === ""){
    //     throw new ApiError(400, "Fullname is required");
    // }

    if ([fullName, email, passwrod, username].some((field) => field?.trim === "")) {
        throw new ApiError(400, "All fields are required!");
    }

    const exsitingUser = User.findOne({
        $or: [{ username }, { email }]
    })

    if(exsitingUser){
        throw new ApiError(409, "User with email & username already exist!")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar image is required!");
    }
    
    const avatar = await uploadOnCloundinary(avatarLocalPath)
    const coverImage = await uploadOnCloundinary(coverImageLocalPath)

    if(!avatar){
        throw new ApiError(400, "Avatar image is required!");
    }

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        passwrod,
        username: username.toLowerCase()
    })

    const cretaedUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!cretaedUser){
        throw new ApiError(500, "Something went wrong while registering the user!");
    }

    return res.status(201).json(
        new ApiResponse(200, cretaedUser, "User Registed Successfully!")
    )
});

export default registerUser