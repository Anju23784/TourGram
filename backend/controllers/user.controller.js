// import messageModel from "../models/message.model.js";
import { User } from "../models/user.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import getDataUri from "../utils/datauri.js";
import cloudinary from "../utils/cloudinary.js";

export const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(401).json({
        message: "Something is missing, Please check",
        success: false,
      });
    }
    const user = await User.findOne({ email });
    if (user) {
      return res.status(401).json({
        message: "Try different email",
        success: false,
      });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    await User.create({
      username,
      email,
      password: hashedPassword,
    });
    return res.status(201).json({
      message: "Acount created successfully",
      success: true,
    });
  } catch (error) {
    console.log(error);
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(401).json({
        message: "Something is missing, Please check",
        success: false,
      });
    }
    let user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        message: "Incorrect email or password",
        success: false,
      });
    }
    const isPasswordMatch = await bcrypt.compare(password, user.password);
    user = {
      _id: user._id,
      username: user.username,
      email: user.email,
      profilePicture: user.profilePicture,
      bio: user.bio,
      followers: user.followers,
      following: user.following,
      posts: user.posts,
    };

    if (!isPasswordMatch) {
      return res.status(401).json({
        message: "Incorrect email or password",
        success: false,
        // user
      });
    }
    const token = await jwt.sign({ userId: user._id }, process.env.SECRET_KEY, {
      expiresIn: "1d",
    });
    // return res.cookie('token',token, {httpOnly:true, sameSite:'strict', maxAge: 1*24*60*60*1000}).json({
    //     message: `Welcome back ${user.username}`,
    //     success: true,
    //     user
    // })
    return res.status(200).json({
      message: `Welcome back ${user.username}`,
      success: true,
      user,
      token,
    });
  } catch (error) {
    console.log(error);
  }
};

export const logout = async (req, res) => {
  try {
    return res.cookie("token", "", { maxAge: 0 }).json({
      message: "Logged out Successfully",
      success: true,
    });
  } catch (error) {
    console.log(error);
  }
};

export const getProfile = async (req, res) => {
  try {
    const userId = req.params.id;
    let user = await User.findById(userId).select("-password");
    return res.status(200).json({
      user,
      success: true,
    });
  } catch (error) {
    console.log(error);
  }
};

export const editProfile = async (req, res) => {
  try {
    console.log("Received request at /profile/edit");
    console.log("Request Headers:", req.headers);
    console.log("Request Body:", req.body);
    console.log("Uploaded File:", req.file);

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    const userId = req.id;
    const { gender, bio } = req.body;
    const profilePicture = req.file;
    console.log("Profile Picture:", profilePicture);

    let cloudResponse;
    let fileUri;
    if (profilePicture) {
      fileUri = getDataUri(profilePicture);
      cloudResponse = await cloudinary.uploader.upload(fileUri);
    }
    // console.log("File URI:", fileUri);
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        message: "User not found",
        success: false,
      });
    }
    if (bio) user.bio = bio;
    if (gender) user.gender = gender;
    if (profilePicture) user.profilePicture = cloudResponse.secure_url;

    await user.save();

    return res.status(200).json({
      message: "Profile update",
      success: true,
      user,
    });
  } catch (error) {
    console.log(error);
  }
};

export const getSuggestedUsers = async (req, res) => {
  try {
    const suggestedUsers = await User.find({ _id: { $ne: req.id } }).select(
      "-password"
    );

    if (!suggestedUsers) {
      return res.status(400).json({
        message: "Currently do not have any users",
      });
    }
    return res.status(200).json({
      success: true,
      users: suggestedUsers,
    });
  } catch (error) {
    console.log(error);
  }
};

export const followOrUnfollow = async (req, res) => {
  try {
    const follower = req.id;
    const followee = req.params.id;
    if (follower === followee) {
      return res.status(400).json({
        message: "You can;t follow or unfollow yourself",
        success: false,
      });
    }
    const user = await User.findById(follower);
    const targetUser = await User.findById(followee);
    if (!user || !targetUser) {
      return res.status(400).json({
        message: "User not found",
        success: false,
      });
    }

    const isFollowing = user.following.includes(followee);
    if (isFollowing) {
      await Promise.all([
        User.updateOne({ _id: follower }, { $pull: { following: followee } }),
        User.updateOne({ _id: followee }, { $pull: { followers: follower } }),
      ]);
      return res.status(200).json({
        message: "Unfollow Successfully",
        success: true,
      });
    } else {
      await Promise.all([
        User.updateOne({ _id: follower }, { $push: { following: followee } }),
        User.updateOne({ _id: followee }, { $push: { followers: follower } }),
      ]);
      return res.status(200).json({
        message: "Followed Successfully",
        success: true,
      });
    }
  } catch (error) {
    console.log(error);
  }
};
