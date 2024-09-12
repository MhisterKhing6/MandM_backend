import { ItemModel } from "../models/items.js";
import { ItemImageModel } from "../models/itemsImages.js";
import { ItemSizesModel } from "../models/itemSizes.js";
import { StoreModel } from "../models/stores.js";
import { VerifyIdentityModel } from "../models/verifyIdentity.js";
import { generateFileUrl, saveUploadFileDisk } from "../utils/FileHandler.js";

class VendorController {
  static addStore = async (req, res) => {
    //ensure store owner has verified identity
    //check if store information is accurate
    //check to see if all the details are given

    let storeOwnerIdentity = await VerifyIdentityModel.findOne({
      userId: req.user._id,
    });
    if (!storeOwnerIdentity || storeOwnerIdentity.status !== "verified")
      return res.status(401).json({ message: "vendor identity not verified" });

    let store = req.body;
    if (
      !(
        store.storeName &&
        store.latitude &&
        store.longitude &&
        store.storePhone
      )
    )
      return res.status(400).json({ message: "not all fields given" });
    //save store information
    try {
      await new StoreModel({ userId: req.user._id, ...store }).save();
      return res.status(200).json({ message: "store successfully added" });
    } catch (err) {
      console.log(err);
      return res.status(501).json({ message: "error adding store info" });
    }
  };

  static storeOwnerIdentityVerification = async (req, res) => {
    //get store owner identify info,
    //the info should have two pics
    //one being the store owner id card
    //second being the store owner picture
    //check if store information is accurate
    //save images and create database entry
    /*
    {
    idCard: {data: "base64Data", fileName: "ama.png"},
    userPic: {data: "base64Data", fileName: "yaw.png"}
    }
    */
    try {
      let identityInfo = req.body;

      if (!(identityInfo.idCard && identityInfo.userPic))
        return res.status(400).json({ message: "not all fields given" });

      let idCard = await saveUploadFileDisk(
        identityInfo.idCard.fileName,
        identityInfo.idCard.data.split("base64,")[1],
        req.user._id,
        "vId"
      );
      let userPic = await saveUploadFileDisk(
        identityInfo.userPic.fileName,
        identityInfo.userPic.data.split("base64,")[1],
        req.user._id,
        "vId"
      );
      await VerifyIdentityModel({
        status: "pending",
        userId: req.user._id,
        idCard: generateFileUrl(idCard.filePath),
        userPic: generateFileUrl(userPic.filePath),
      });
      return res.status(200).json({
        message: "verification in progress, please wait for 2 working days",
      });
    } catch (err) {
      console.log(err);
      return res.status(501).json({ message: "couldn't add identity" });
    }
  };

  static uploadItem = async (req, res) => {
    //ensure store owner has verified identity
    //check if store information is accurate
    //check to see if all the details are given
    //process images as a list update images table
    try {
      let storeOwnerIdentity = await VerifyIdentityModel.findOne({
        userId: req.user._id,
      });
      if (!storeOwnerIdentity || storeOwnerIdentity.status !== "verified")
        return res.status(401).json({ message: "vendor identity not verified" });

      let item = req.body;
      if (
        !(
          item.categoryId &&
          item.subCategoryId &&
          item.name &&
          item.description &&
          item.sizes &&
          item.images
        )
      )
        return res.status(400).json({ message: "not all fields given" });
      //save store information

      //get user store
      let store = await StoreModel.findOne({ userId: req.user._id });
      if (!store)
        return res.status(400).json({ "message": "no store information added" })
      //check to see if item of the same name is presences
      let savedItem = await ItemModel.findOne({storeId:store._id, name:item.name})
      if(savedItem)
          return res.status(400).json({"message": "item already saved"})
      //item object
      let itemObject = new ItemModel({ ...item, images: null, storeId: store._id })
      //process sizes
      let sizesModel = []
      /*
      {name:"64gig", price:"30cedis", quantity: "800"}
      */
      for (const size of item.sizes) {
        sizesModel.push(new ItemSizesModel({...size, itemId:itemObject._id}))
      }
      //process images
      let imagesPromise = []
      for (const image of item.images) {
        if (!(image.data && image.fileName))
          return res.status(400).json({ "message": "image should have have a fileName and data" })
        imagesPromise.push(saveUploadFileDisk(image.fileName, image.data.split("base64,")[1], (itemObject._id.toString() + store._id.toString()), "item"))
      }
      let imagesSaved = await Promise.all(imagesPromise)
      let imagesModel = []
      for (const image of imagesSaved)
        imagesModel.push(new ItemImageModel({ itemId: itemObject._id, url: generateFileUrl(image.urlPath), diskPath: image.filePath }).save())
      //save items and images
      if(item.colors)
        itemObject.colors = item.join(",")
      await Promise.all([itemObject.save(), ...imagesModel, ...sizesModel])
      return res.status(200).json({ message: "item successfully added" });
    } catch (err) {
      console.log(err);
      return res.status(501).json({ message: "error adding store info" });
    }
  };
}
export {VendorController};
