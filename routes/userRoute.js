import express from "express";
import { Login, Register, bookmark, editProfile, follow, getFollowers, getFollowing, getMyProfile, getOtherUsers, logout, unfollow } from "../controllers/userController.js";
import isAuthenticated from "../config/auth.js";

const router = express.Router();

router.route("/register").post(Register);
router.route("/login").post(Login);
router.route("/logout").get(logout);
router.route("/bookmark/:id").put(isAuthenticated, bookmark)
router.route("/profile/:id").get(isAuthenticated, getMyProfile);
router.route("/otheruser/:id").get(isAuthenticated, getOtherUsers);
router.route("/follow/:id").post(isAuthenticated, follow);
router.route("/unfollow/:id").post(isAuthenticated, unfollow);
router.route("/edit/:id").put(isAuthenticated, editProfile);
router.route("/followers/:id").get(isAuthenticated, getFollowers);
router.route("/following/:id").get(isAuthenticated, getFollowing);

export default router;