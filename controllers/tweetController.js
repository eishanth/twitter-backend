import { Tweet } from "../models/tweetSchema.js";
import { User } from "../models/userSchema.js";

export const createTweet = async (req, res) => {
    try {
        const { description, id } = req.body;
        if (!description || !id) {
            return res.status(401).json({
                message: "Fields are required.",
                success: false
            });
        };
        const user = await User.findById(id).select("-password");
        await Tweet.create({
            description,
            userId: id,
            userDetails: [{
                userId: user._id,
                name: user.name,
                username: user.username,
                profileImage: user.profileImage || "default1"
            }]
        });
        return res.status(201).json({
            message:"Tweet created successfully.",
            success:true,
        })
    } catch (error) {
        console.error("Create tweet error:", error);
        return res.status(500).json({
            message: "Error creating tweet",
            success: false
        });
    }
}

export const deleteTweet = async (req,res) => {
    try {
        const {id}  = req.params;
        await Tweet.findByIdAndDelete(id);
        return res.status(200).json({
            message:"Tweet deleted successfully.",
            success:true
        })
    } catch (error) {
        console.error("Delete tweet error:", error);
        return res.status(500).json({
            message: "Error deleting tweet",
            success: false
        });
    }
}

export const likeOrDislike = async (req,res) => {
    try {
        const loggedInUserId = req.body.id;
        const tweetId = req.params.id;
        const tweet = await Tweet.findById(tweetId);
        if(tweet.like.includes(loggedInUserId)){
            // dislike
            await Tweet.findByIdAndUpdate(tweetId,{$pull:{like:loggedInUserId}});
            return res.status(200).json({
                message:"User disliked your tweet."
            })
        }else{
            // like
            await Tweet.findByIdAndUpdate(tweetId, {$push:{like:loggedInUserId}});
            return res.status(200).json({
                message:"User liked your tweet."
            })
        }
    } catch (error) {
        console.error("Like/Dislike error:", error);
        return res.status(500).json({
            message: "Error updating like status",
            success: false
        });
    }
};

export const getAllTweets = async (req,res) => {
    try {
        // Get all tweets for "For you" section
        const tweets = await Tweet.find().sort({ createdAt: -1 });
        return res.status(200).json({
            tweets,
            success: true
        });
    } catch (error) {
        console.error("Get all tweets error:", error);
        return res.status(500).json({
            message: "Error fetching tweets",
            success: false
        });
    }
}

export const getFollowingTweets = async (req,res) => {
    try {
        const id = req.params.id;
        const loggedInUser = await User.findById(id); 
        
        if (!loggedInUser) {
            return res.status(404).json({
                message: "User not found",
                success: false
            });
        }
        // Get tweets only from users that the logged-in user follows
        const tweets = await Tweet.find({
            userId: { $in: loggedInUser.following }
        }).sort({ createdAt: -1 });

        return res.status(200).json({
            tweets,
            success: true
        });
    } catch (error) {
        console.error("Get following tweets error:", error);
        return res.status(500).json({
            message: "Error fetching following tweets",
            success: false
        });
    }
}

export const getLikedTweets = async (req, res) => {
    try {
        const { id } = req.params;
        // Find tweets that have the user's ID in their like array
        const likedTweets = await Tweet.find({ like: id }).sort({ createdAt: -1 });
        return res.status(200).json({
            tweets: likedTweets,
            success: true
        });
    } catch (error) {
        console.error("Get liked tweets error:", error);
        return res.status(500).json({
            message: "Error fetching liked tweets",
            success: false
        });
    }
}