const express = require("express");
const { check } = require("express-validator");


const router = express.Router();
const usersControllers = require("../controllers/users-controller");
const fileUpload = require("../middlewares/file-upload");

router.get("/", usersControllers.getUsers);
router.post("/login", usersControllers.login);
router.post("/signup",fileUpload.single("image"),[
    check("name").not().isEmpty(),
    check("email").normalizeEmail().isEmail(),
    check("password").isLength({ min: 6 }),
  ], usersControllers.signup);

module.exports = router;