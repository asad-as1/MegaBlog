const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { authenticate } = require('../middlewares/auth'); 
const isAuthenticated = require("../endPoint/auth")

router.post('/register', userController.register);
router.post('/login', userController.login);
router.post('/refresh-token', userController.refreshToken);
router.get('/check-auth', authenticate, isAuthenticated.checkAuth);
router.post('/logout', userController.logout);
router.get('/profile', authenticate, userController.getProfile);
router.get('/profile/:username', authenticate, userController.getUsername);
router.post('/username', userController.getUsernameById);
router.post('/getUserById', userController.getUserById);
router.put('/profile', authenticate, userController.updateProfile);
router.delete('/delete', authenticate, userController.deleteUser);
router.get('/favourites', authenticate, userController.fetchFavourites);
router.get('/favourites/check/:postId', authenticate, userController.isPostInFavourites);
router.post('/favourites/:postId', authenticate, userController.addPostToFavorites);
router.delete('/favourites/:postId', authenticate, userController.RemoveFromFavorites);

router.get('/search', authenticate, userController.searchUsers);
router.post('/follow/:userId', authenticate, userController.followUser);
router.delete('/follow/:userId', authenticate, userController.unfollowUser);
router.get('/:userId/followers', authenticate, userController.getFollowers);
router.get('/:userId/following', authenticate, userController.getFollowing);

module.exports = router;
