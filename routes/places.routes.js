const express = require("express");
const { check } = require("express-validator");
const fileUpload = require("../middlewares/file-upload");
const checkAuth = require("../middlewares/check-auth");

const router = express.Router();
const placesControllers = require("../controllers/places-controller");

router.get("/:pid", placesControllers.getPlacesById);
router.get("/user/:uid", placesControllers.getPlacesByUserId);

router.use(checkAuth)
router.post(
  "/",
  fileUpload.single("image"),
  [
    check("title").not().isEmpty(),
    check("description").isLength({ min: 5 }),
    check("address").not().isEmpty(),
  ],
  placesControllers.createPlace
);
router.patch("/:pid",fileUpload.single("image"),[
    check("title").not().isEmpty(),
    check("description").isLength({ min: 5 })
  ], placesControllers.updatePlace);
router.delete("/:pid", placesControllers.deletePlace);


module.exports = router;
