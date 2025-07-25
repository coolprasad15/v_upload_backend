import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloundinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from 'jsonwebtoken';

const generateAccessAndRefresTokens = async(userid) => {
    try {
        const user = await User.findById(userid)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return {accessToken, refreshToken}
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating refresh and access token!")
    }
}

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


    const {email, username, fullName, password} = req.body
    // console.log("email: ", email);

    // if(fullName === ""){
    //     throw new ApiError(400, "Fullname is required");
    // }

    if ([fullName, email, password, username].some((field) => field?.trim === "")) {
        throw new ApiError(400, "All fields are required!");
    }

    const exsitingUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if(exsitingUser){
        throw new ApiError(409, "User with email & username already exist!")
    }
    // console.log(req.files);
    

    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
        coverImageLocalPath = req.files.coverImage[0].path;
    }

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
        password,
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

const loginUser = asyncHandler(async (req, res) =>{
    // req body -> data
    // username or email
    // find the user
    // password check
    // access and referesh token
    // send cookie

    const {email, username, password} = req.body
    // console.log(email);

    if (!username && !email) {
        throw new ApiError(400, "Username or email is required!")
    }
    
    // Here is an alternative of above code based on logic discussed in video:
    // if (!(username || email)) {
    //     throw new ApiError(400, "username or email is required")
    // }

    const user = await User.findOne({
        $or: [{username}, {email}]
    })

    if (!user) {
        throw new ApiError(404, "User does not exist!")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid user credentials!")
    }

    const {accessToken, refreshToken} = await generateAccessAndRefresTokens(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200, 
            {
                user: loggedInUser, accessToken, refreshToken
            },
            "User logged In Successfully!"
        )
    )

});

const logoutUser = asyncHandler(async(req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $usset:{
                refreshToken: 1 //This removes the field from document
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res.status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out!"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookie.refreshToken || req.body.refreshToken

    if(!incomingRefreshToken){
        throw new ApiError(401, "Unauthorized requiest!");
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
    
        const user = await User.findById(decodedToken?._id)
    
        if(!user){
            throw new ApiError(401, "Invalid refresh token!");
        }
    
        if(incomingRefreshToken !== user?.refreshToken){
            throw new ApiError(401, "Refresh token is expired or used!");
        }
    
        const options = {
            httpOnly: true,
            secure: true
        }
    
        const {accessToken, newRefreshToken} = await generateAccessAndRefresTokens(user._id)
    
        return res.status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(
                200,
                { accessToken, refreshToken: newRefreshToken },
                "Access token refreshed!"
            )
        )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token!")
    }
});

const changeCurrentUser = asyncHandler(async (req, res) => {
    const {oldPassword, newPassword} = req.body

    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if(!isPasswordCorrect){
        throw new ApiError(401, "Old password is incorrect!")
    }

    user.password = newPassword
    user.save({ validateBeforeSave: false })

    return res.status(200)
    .json( new ApiResponse(200, {}, "Password changed successfully!"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
    return res.status(200)
    .json(new ApiResponse(200, {}, "Current user fetched successfully!"));
});

const updateAccountDetails = asyncHandler(async (req, res) => {
    const {fullName, email} = req.body
    if(!fullName || !email){
        throw new ApiError(400, "All fields are required!");
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName,
                email: email
            }
        },
        { new: true }
    ).select("-password")

    return res.status(200)
    .json(new ApiError(200, user, "User details updated successfully!"));
});

const updateUserAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar image is required!");
    }

    // const deleteOldImage = asyncHandler(async (req, res) => {

    // });

    //Assignment delete old image

    const avatar = await uploadOnCloundinary(avatarLocalPath)
    if(!avatar.url){
        throw new ApiError(400, "Error while uploading on avatar!");
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: avatar.url
            }
        },
        {new: true}
    ).select("-password")

    return res.status(200)
    .json(new ApiError(200, user, "Avatar image update successfully!"));
});

const updateUserCoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalPath = req.file?.path

    if(!coverImageLocalPath){
        throw new ApiError(400, "Cover image is required!");
    }

    const coverImage = await uploadOnCloundinary(coverImageLocalPath)

    if(!coverImage.url){
        throw new ApiError(400, "Error while uploading on cover image!");
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage: coverImage.url
            }
        },
        {new: true}   
    ).select("-password")

    return res.status(200)
    .json(new ApiResponse(200, user, "Cover image updated successfully!"));
});

const getUserChannelProfile = asyncHandler(async (req, res) => {
    const {username} = req.params

    if(!username?.trim()){
        throw new ApiError(400, "Username is missing!");
    }

    const channel = await user.aggegate([
        {
            $match: {
                username: username?.toLowerCase()
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "subscriptions", 
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },{
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers"
                },
                channelsSubscribedToCount: {
                    $size: "$subscribedTo"
                },
                isSubscribed: {
                    $cond: {
                        if: {$in: [req.user?._id, "$subscribers.subscriber"]},
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                fullName: 1,
                username: 1,
                subscribersCount: 1,
                channelsSubscribedToCount: 2,
                isSubscribed: 1,
                email: 1,
                avatar: 1,
                coverImage: 1
            }
        }
    ])

    if(!channel?.length){
        throw new ApiError(404, "Channel does not exists!");
    }

    return res.status(200)
    .json(new ApiResponse(200, channel[0], "User Channel fetched successfully!"));
});

const getWatchHistory = asyncHandler(async (req, res) => {
    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        fullName: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            owner: {
                                $frist: "$owner"
                            }
                        }
                    }
                ]
            }
        }
    ]);

    return res.status(200)
    .json(
        new ApiResponse(
            200,
            user[0].getWatchHistory,
            "Watch history fetched successfully!"
        )
    )
});

export { registerUser, loginUser, logoutUser, refreshAccessToken, changeCurrentUser, getCurrentUser,
    updateAccountDetails, updateUserAvatar, updateUserCoverImage, getUserChannelProfile,
    getWatchHistory
 };