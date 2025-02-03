import { User } from "../models/userSchema.js";
import { Tweet } from "../models/tweetSchema.js";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";

export const Register = async (req, res) => {
    try {
        const { name, username, email, password } = req.body;
        // basic validation
        if (!name || !username || !email || !password) {
            return res.status(401).json({
                message: "All fields are required.",
                success: false
            })
        }
        const user = await User.findOne({ email });
        if (user) {
            return res.status(401).json({
                message: "User already exist.",
                success: false
            })
        }
        const hashedPassword = await bcryptjs.hash(password, 16);

        await User.create({
            name,
            username,
            email,
            password: hashedPassword
        });
        return res.status(201).json({
            message: "Account created successfully.",
            success: true
        })

    } catch (error) {
        console.log(error);
    }
}

//chatgpt
export const Login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(401).json({
                message: "All fields are required.",
                success: false
            });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({
                message: "Incorrect email or password.",
                success: false
            });
        }

        const isMatch = await bcryptjs.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({
                message: "Incorrect email or password.",
                success: false
            });
        }

        const tokenData = { userId: user._id };
        const token = jwt.sign(tokenData, process.env.JWT_SECRET, { expiresIn: "1d" });

        return res.status(200).cookie("token", token, {
            expires: new Date(Date.now() + 86400000), 
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // Secure cookies in production
            sameSite: 'Strict'
        }).json({
            message: `Welcome back ${user.name}`,
            user,
            success: true
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: "Internal Server Error. Please try again.",
            success: false
        });
    }
};

export const logout = (req, res) => {
    return res.cookie("token", "", { expiresIn: new Date(Date.now()) }).json({
        message: "user logged out successfully.",
        success: true
    })
}

export const bookmark = async (req, res) => {
    try {
        const loggedInUserId = req.body.id;
        const tweetId = req.params.id;
        const user = await User.findById(loggedInUserId);
        if (user.bookmarks.includes(tweetId)) {
            // remove
            await User.findByIdAndUpdate(loggedInUserId, { $pull: { bookmarks: tweetId } });
            return res.status(200).json({
                message: "Removed from bookmarks."
            });
        } else {
            // bookmark
            await User.findByIdAndUpdate(loggedInUserId, { $push: { bookmarks: tweetId } });
            return res.status(200).json({
                message: "Saved to bookmarks."
            });
        }
    } catch (error) {
        console.log(error);
    }
};
export const getMyProfile = async (req, res) => {
    try {
        const id = req.params.id;
        const user = await User.findById(id).select("-password");
        return res.status(200).json({
            user,
        })
    } catch (error) {
        console.log(error);
    }
};

export const getOtherUsers = async (req,res) =>{ 
    try {
         const {id} = req.params;
         const otherUsers = await User.find({_id:{$ne:id}}).select("-password");
         if(!otherUsers){
            return res.status(401).json({
                message:"Currently do not have any users."
            })
         };
         return res.status(200).json({
            otherUsers
        })
    } catch (error) {
        console.log(error);
    }
}

export const follow = async(req,res)=>{
    try {
        const loggedInUserId = req.body.id; 
        const userId = req.params.id; 
        const loggedInUser = await User.findById(loggedInUserId);//patel
        const user = await User.findById(userId);//keshav
        if(!user.followers.includes(loggedInUserId)){
            await user.updateOne({$push:{followers:loggedInUserId}});
            await loggedInUser.updateOne({$push:{following:userId}});
        }else{
            return res.status(400).json({
                message:`User already followed to ${user.name}`
            })
        };
        return res.status(200).json({
            message:`${loggedInUser.name} just follow to ${user.name}`,
            success:true
        })
    } catch (error) {
        console.log(error);
    }
}
export const unfollow = async (req,res) => {
    try {
        const loggedInUserId = req.body.id; 
        const userId = req.params.id; 
        const loggedInUser = await User.findById(loggedInUserId);//patel
        const user = await User.findById(userId);//keshav
        if(loggedInUser.following.includes(userId)){
            await user.updateOne({$pull:{followers:loggedInUserId}});
            await loggedInUser.updateOne({$pull:{following:userId}});
        }else{
            return res.status(400).json({
                message:`User has not followed yet`
            })
        };
        return res.status(200).json({
            message:`${loggedInUser.name} unfollow to ${user.name}`,
            success:true
        })
    } catch (error) {
        console.log(error);
    }
}

export const editProfile = async (req, res) => {
    try {
        const { name, username, bio, profileImage } = req.body;
        const userId = req.params.id;

        // Input validation
        if (!name || !username) {
            return res.status(400).json({
                message: "Name and username are required.",
                success: false
            });
        }

        // Check if username is already taken by another user
        const existingUser = await User.findOne({ username, _id: { $ne: userId } });
        if (existingUser) {
            return res.status(400).json({
                message: "Username is already taken.",
                success: false
            });
        }

        // Update user profile
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            {
                $set: {
                    name,
                    username,
                    bio: bio || "",
                    profileImage: profileImage || "default1"
                }
            },
            { new: true }
        ).select("-password");

        if (!updatedUser) {
            return res.status(404).json({
                message: "User not found.",
                success: false
            });
        }

        // Update user details in tweets
        await Tweet.updateMany(
            { userId },
            {
                $set: {
                    "userDetails.$[].name": name,
                    "userDetails.$[].username": username,
                    "userDetails.$[].profileImage": profileImage || "default1"
                }
            }
        );

        res.status(200).json({
            message: "Profile updated successfully.",
            success: true,
            user: updatedUser
        });
    } catch (error) {
        console.error("Edit profile error:", error);
        res.status(500).json({
            message: "Internal server error.",
            success: false
        });
    }
};

export const getFollowers = async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({
                message: "User not found",
                success: false
            });
        }

        const followers = await User.find(
            { _id: { $in: user.followers } },
            { password: 0 }
        );

        res.status(200).json({
            message: "Followers fetched successfully",
            success: true,
            users: followers
        });
    } catch (error) {
        console.error("Get followers error:", error);
        res.status(500).json({
            message: "Internal server error",
            success: false
        });
    }
};

export const getFollowing = async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({
                message: "User not found",
                success: false
            });
        }

        const following = await User.find(
            { _id: { $in: user.following } },
            { password: 0 }
        );

        res.status(200).json({
            message: "Following users fetched successfully",
            success: true,
            users: following
        });
    } catch (error) {
        console.error("Get following error:", error);
        res.status(500).json({
            message: "Internal server error",
            success: false
        });
    }
};