import { ItemModel } from "../models/items.js";
import { ItemImageModel } from "../models/itemsImages.js";
import { ItemSizesModel } from "../models/itemSizes.js";
import { StoreModel } from "../models/stores.js";
import { VerifyIdentityModel } from "../models/verifyIdentity.js";
import { deleteFolder, generateFileUrl, saveUploadFileDisk } from "../utils/FileHandler.js";
import path from "path"
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
    //check if user has store already
    let storeSaved = await StoreModel.findOne({ userId: req.user._id })
    if (storeSaved)
      return res.status(400).json({ message: "user has store saved already, vendors can only have one store" })
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
        idCard: generateFileUrl(idCard.urlPath),
        userPic: generateFileUrl(userPic.urlPath),
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
      let savedItem = await ItemModel.findOne({ storeId: store._id, name: item.name })
      if (savedItem)
        return res.status(400).json({ "message": "item already saved" })
      //item object
      let itemObject = new ItemModel({ ...item, images: null, storeId: store._id })
      //process sizes
      let sizesModel = []
      /*
      {name:"64gig", price:"30cedis", quantity: "800"}
      */
      for (const size of item.sizes) {
        sizesModel.push(new ItemSizesModel({ ...size, itemId: itemObject._id }))
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
      if (item.colors)
        itemObject.colors = item.join(",")
      await Promise.all([itemObject.save(), ...imagesModel, ...sizesModel])
      return res.status(200).json({ message: "item successfully added" });
    } catch (err) {
      console.log(err);
      return res.status(501).json({ message: "error adding store info" });
    }
  };

  static editItem = async (req, res) => {
    //get the item id
    //ensure the  item to edit belongs to the vendor
    //check to see if the vendor own the item
    //check to see if all the details are given
    let acceptedFields = ["sizes", "name", "images", "description", "colors", "categoryId", "subCategoryId", ""]
    let itemDetails = req.body
    if (!itemDetails.itemId)
      return res.status(400).json({ "message": "itemId is required" })
    try {
      let storeOwnerIdentity = await VerifyIdentityModel.findOne({
        userId: req.user._id,
      });
      if (!storeOwnerIdentity || storeOwnerIdentity.status !== "verified")
        return res.status(401).json({ message: "vendor identity not verified" });

      let store = await StoreModel.findOne({ userId: req.user._id })

      if (!store)
        return res.status(400).json({ message: "user doesn't have a store" });
      //check if item exist
      let item = await ItemModel.findById(itemDetails.itemId)
      if (!item)
        return res.status(400).json({ message: "item not found, check item id" })
      //check to see if item belongs to user store
      if (item.storeId.toString() !== store._id.toString())
        return res.status(401).json({ "message": "item doesn't belong to user store" })
      let promiseOperations = []
      //update items with new entry
      for (const key of Object.keys(itemDetails)) {
        if (!acceptedFields.includes(key))
          continue
        //process size
        if (key === "sizes" && itemDetails.sizes.length > 0) {
          //[{sizeId:id, action:['delete', 'add']}]
          //check if action is add
          for (const size of itemDetails.sizes) {
            if (size.action === "add") {
              //check to ensure all fields are given
              if (!(size.price && size.name && size.quantity))
                return res.status(400).json({ message: "to add new sizes, name,price and quantity are required fields" })
              //form size model
              promiseOperations.push(new ItemSizesModel({ itemId: item._id, ...size }).save())
            }
            else if (size.action === "delete") {
              if (!size.sizeId)
                return res.status(400).json({ "message": "sizeId is required to delete the size" })
              let itemSize = await ItemSizesModel.findById(size.sizeId)
              if (itemSize.itemId.toString() !== item.id.toString())
                return res.status(401).json({ "message": "size doesn't belong to user item given." })
              promiseOperations.push(ItemSizesModel.deleteOne({ _id: size.sizeId }))
            } else {
              if (!size.sizeId)
                return res.status(400).json({ "message": "to update item size, sizeId is required" })
              let itemSize = await ItemSizesModel.findById(size.sizeId)
              if (!itemSize)
                return res.status.json({ message: "wrong size id, not size entry found for such id" })
              if (itemSize.itemId.toString() !== item.id.toString())
                return res.status(401).json({ "message": "size doesn't belong to user item given." })
              for (const sizeDetails of Object.keys(size))
                itemSize[sizeDetails] = size[sizeDetails] || itemSize[sizeDetails]
              promiseOperations.push(itemSize.save())
            }
          }

        } else if (key === "images" && itemDetails.images.length > 0) {
          for (const image of itemDetails.images) {
            if (!(image.data && image.fileName))
              return res.status(400).json({ "message": "image should have have a fileName and data" })
            let imageSave = await saveUploadFileDisk(image.fileName, image.data.split("base64,")[1], (item._id.toString() + store._id.toString()), "item")
            promiseOperations.push(new ItemImageModel({ url: generateFileUrl(imageSave.urlPath), itemId: itemDetails.itemId, diskPath: imageSave.filePath }).save())
          }
        } else {
          item[key] = itemDetails[key]
        }
      }
      await Promise.all([item.save(), ...promiseOperations])
      return res.status(200).json({ message: "item updated successfully" });
    } catch (err) {
      console.log(err);
      return res.status(500).json({ message: "error adding store info" });
    }
  };

  static toggleItem = async (req, res) => {
    //ensure item id is given
    //check status to see if is enabled or disabled
    let details = req.body
    if (!(details.itemId && details.status))
      return res.status(400).json({ message: "not all fields given, itemId and status required" })
    try {
      let item = await ItemModel.findById(details.itemId)
      if (!item)
        return res.status(400).json({ "message": "wrong item id, not item found" })
      //check if item belongs to user store
      let store = await StoreModel.findOne({ userId: req.user._id })
      if (store._id.toString() !== item.storeId.toString())
        return res.status(401).json({ "message": "item doesn't belong to user's store" })
      item.enable = details.status === "enable" 
      await item.save()
      return res.status(200).json({ "message": "item visibility changed", item })
    } catch (err) {
      console.log(err)
      return res.status(500).json({ "message": "internal error" })
    }
  }

  static toggleItemSize = async (req, res) => {
    //ensure item id is given
    //check status to see if is enabled or disabled
    let details = req.body
    if (!(details.sizeId && details.status))
      return res.status(400).json({ message: "not all fields given, sizeId and status required" })
    try {
      let size = await ItemSizesModel.findById(details.sizeId)
      if (!size)
        return res.status(400).json({ "message": "wrong size id" })
      //check if item belongs to user store
      let store = await StoreModel.findOne({ userId: req.user._id })
      let item = await ItemModel.findById(size.itemId)
      if (store._id.toString() !== item.storeId.toString())
        return res.status(401).json({ "message": "item doesn't belong to user's store" })
      size.enable = details.status === "enable"
      await size.save()
      return res.status(200).json({ "message": "size visibility changed", size })
    } catch (err) {
      console.log(err)
      return res.status(500).json({ "message": "internal error" })
    }
  }

  static deleteItem = async (req, res) => {
    //ensure item id is given
    //use item id to delete item
    //check if user is verified
    try {
      let storeOwnerIdentity = await VerifyIdentityModel.findOne({
        userId: req.user._id,
      });
      if (!storeOwnerIdentity || storeOwnerIdentity.status !== "verified")
        return res.status(401).json({ message: "vendor identity not verified" });

      let store = await StoreModel.findOne({ userId: req.user._id })
      if (!store)
        return res.status(400).json({ message: "user doesn't have a store" });

      let itemId = req.params.itemId

      let item = await ItemModel.findById(itemId)
      if (!item)
        return res.status(400).json({ message: "no item entry found, check item id" })
      if (item.storeId.toString() !== store._id.toString())
        return res.status(401).json({ message: "item doesn't belong to user's store" })

      await Promise.all([ItemModel.deleteOne({ _id: itemId }), ItemImageModel.deleteMany({ itemId })], ItemSizesModel.deleteMany({ itemId }))
      deleteFolder(path.join(path.resolve("."), "public", "store-items", (req.user._id.toString() + itemId)))
      return res.status(200).json({ "message": "item deleted" })
    } catch (err) {
      console.log(err)
      return res.status(500).json({ "message": "internal error" })
    }
  }

  static deleteItemSize = async (req, res) => {
    //ensure item id is given
    //use item id to delete item
    //check if user is verified
    let storeOwnerIdentity = await VerifyIdentityModel.findOne({
      userId: req.user._id,
    });
    if (!storeOwnerIdentity || storeOwnerIdentity.status !== "verified")
      return res.status(401).json({ message: "vendor identity not verified" });

    let store = await StoreModel.findOne({ userId: req.user._id })
    if (!store)
      return res.status(400).json({ message: "user doesn't have a store" });

    let sizeId = req.params.sizeId
    let itemSize = await ItemSizesModel.findById(sizeId)

    if (!itemSize)
      return res.status(400).json({ message: "wrong size id, no size  entry found" })
    let item = await ItemModel.findById(itemSize.itemId)
    if (item.storeId.toString() !== store._id.toString())
      return res.status(401).json({ message: "item doesn't belong to user's store" })
    try {
      await ItemSizesModel.deleteOne({ _id: sizeId })
      return res.status(200).json({ "message": "size deleted" })
    } catch (err) {
      console.log(err)
      return res.status(500).json({ "message": "internal error" })
    }
  }

  static getStoreItems = async (req, res) => {
    let limit = req.params.limit
    let page = req.params.page
    if (page < 0)
      page = 1
    let offset = (page - 1) * limit


  }



}
export { VendorController };
