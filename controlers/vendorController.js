import { ItemModel } from "../models/items.js";
import { ItemImageModel } from "../models/itemsImages.js";
import { ItemSizesModel } from "../models/itemSizes.js";
import { OrderItemModel } from "../models/orderItems.js";
import { OrderModel } from "../models/orders.js";
import { StoreModel } from "../models/stores.js";
import { VerifyIdentityModel } from "../models/verifyIdentity.js";
import {
  deleteFolder,
  generateFileUrl,
  saveUploadFileDisk,
} from "../utils/FileHandler.js";
import path from "path";
import { UserController } from "./userController.js";
import { findAvailableRiders } from "../utils/redisStorage.js";
import { SocketServices } from "../services/notification/socketHandler.js";
import { io } from "../index.js";
import { PaymentVendorModel } from "../models/paymentStore.js";
class VendorController {
  static addStore = async (req, res) => {
    //ensure store owner has verified identity
    //check if store information is accurate
    //check to see if all the details are given

    let storeOwnerIdentity = await VerifyIdentityModel.findOne({
      userId: req.user._id,
    });
    // if (!storeOwnerIdentity || storeOwnerIdentity.status !== "verified")
    //   return res.status(401).json({ message: "vendor identity not verified" });
    //check if user has store already
    let store = req.body;
    if (
      !(
        store.storeName &&
        store.latitude &&
        store.longitude &&
        store.storePhone &&
        store.type
      )
    )
      return res.status(400).json({ message: "not all fields given" });
    //save store information
    try {
      //store payment
      
      const newStore = new StoreModel({
        userId: req.user._id,
        storeName: store.storeName,
        storeAddress: store.storeAddress,
        storePhone: store.storePhone,
        location: {
          type: "Point",
          coordinates: [store.longitude, store.latitude], // [longitude, latitude]
        },
        type: store.type,
      });
      let payment = await new PaymentVendorModel({storeId: newStore._id, amount:0, userId:req.user._id}).save()
      newStore.payment = payment._id;
      await newStore.save();
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
      }).save();
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
        return res
          .status(401)
          .json({ message: "vendor identity not verified" });

      let item = req.body;
      if (
        !(item.categoryId &&
          item.subCategoryId &&
          item.name &&
          item.description &&
          item.sizes &&
          item.images &&
          item.quantity,
        item.storeId)
      )
        return res.status(400).json({ message: "not all fields given" });
      //save store information

      //get user store
      let store = await StoreModel.findById(item.storeId);
      if (!store)
        return res.status(400).json({ message: "no store information added" });
      //check to see if item of the same name is present
      let savedItem = await ItemModel.findOne({
        storeId: store._id,
        name: item.name,
      });
      if (savedItem)
        return res.status(400).json({ message: "item already saved" });
      //item object
      let itemObject = new ItemModel({
        ...item,
        images: [],
        storeId: store._id,
      });
      //process sizes
      let sizesModel = [];
      /*
      {name:"64gig", price:"30cedis", quantity: "800"}
      */
      for (const size of item.sizes) {
        let sizeObj = new ItemSizesModel({ ...size, itemId: itemObject._id });
        itemObject.itemSizes.push(sizeObj);
        sizesModel.push(sizeObj.save());
      }
      //process images
      let imagesPromise = [];
      for (const image of item.images) {
        if (!(image.data && image.fileName))
          return res
            .status(400)
            .json({ message: "image should have have a fileName and data" });
        imagesPromise.push(
          saveUploadFileDisk(
            image.fileName,
            image.data.split("base64,")[1],
            itemObject._id.toString() + store._id.toString(),
            "item"
          )
        );
      }
      let imagesSaved = await Promise.all(imagesPromise);
      let imagesModel = [];
      for (const image of imagesSaved) {
        let imageObj = new ItemImageModel({
          itemId: itemObject._id,
          url: generateFileUrl(image.urlPath),
          diskPath: image.filePath,
        });
        itemObject.images.push(imageObj);
        imagesModel.push(imageObj.save());
      }
      //save items and images
      if (item.colors) itemObject.colors = item.join(",");
      await Promise.all([itemObject.save(), ...imagesModel, ...sizesModel]);
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
    let acceptedFields = [
      "sizes",
      "name",
      "images",
      "description",
      "colors",
      "categoryId",
      "subCategoryId",
      "",
    ];
    let itemDetails = req.body;
    if (!(itemDetails.itemId && itemDetails.storeId))
      return res.status(400).json({ message: "itemId is required" });
    try {
      let storeOwnerIdentity = await VerifyIdentityModel.findOne({
        userId: req.user._id,
      });
      if (!storeOwnerIdentity || storeOwnerIdentity.status !== "verified")
        return res
          .status(401)
          .json({ message: "vendor identity not verified" });

      let store = await StoreModel.findById(itemDetails.storeId);

      if (!store)
        return res.status(400).json({ message: "user doesn't have a store" });
      //check if item exist
      let item = await ItemModel.findById(itemDetails.itemId);
      if (!item)
        return res
          .status(400)
          .json({ message: "item not found, check item id" });
      //check to see if item belongs to user store
      if (item.storeId.toString() !== store._id.toString())
        return res
          .status(401)
          .json({ message: "item doesn't belong to user store" });
      let promiseOperations = [];
      //update items with new entry
      for (const key of Object.keys(itemDetails)) {
        if (!acceptedFields.includes(key)) continue;
        if (key === "attributes") {
          item.attributes = { ...item.attributes, ...itemDetails.attributes };
        }
        //process size
        if (key === "sizes" && itemDetails.sizes.length > 0) {
          //[{sizeId:id, action:['delete', 'add']}]
          //check if action is add
          for (const size of itemDetails.sizes) {
            if (size.action === "add") {
              //check to ensure all fields are given
              if (!(size.price && size.name && size.quantity))
                return res.status(400).json({
                  message:
                    "to add new sizes, name,price and quantity are required fields",
                });
              //form size model
              promiseOperations.push(
                new ItemSizesModel({ itemId: item._id, ...size }).save()
              );
            } else if (size.action === "delete") {
              if (!size.sizeId)
                return res
                  .status(400)
                  .json({ message: "sizeId is required to delete the size" });
              let itemSize = await ItemSizesModel.findById(size.sizeId);
              if (itemSize.itemId.toString() !== item.id.toString())
                return res
                  .status(401)
                  .json({ message: "size doesn't belong to user item given." });
              promiseOperations.push(
                ItemSizesModel.deleteOne({ _id: size.sizeId })
              );
            } else {
              if (!size.sizeId)
                return res
                  .status(400)
                  .json({ message: "to update item size, sizeId is required" });
              let itemSize = await ItemSizesModel.findById(size.sizeId);
              if (!itemSize)
                return res.status.json({
                  message: "wrong size id, not size entry found for such id",
                });
              if (itemSize.itemId.toString() !== item.id.toString())
                return res
                  .status(401)
                  .json({ message: "size doesn't belong to user item given." });
              for (const sizeDetails of Object.keys(size))
                itemSize[sizeDetails] =
                  size[sizeDetails] || itemSize[sizeDetails];
              promiseOperations.push(itemSize.save());
            }
          }
        } else if (key === "images" && itemDetails.images.length > 0) {
          for (const image of itemDetails.images) {
            if (!(image.data && image.fileName))
              return res.status(400).json({
                message: "image should have have a fileName and data",
              });
            let imageSave = await saveUploadFileDisk(
              image.fileName,
              image.data.split("base64,")[1],
              item._id.toString() + store._id.toString(),
              "item"
            );
            promiseOperations.push(
              new ItemImageModel({
                url: generateFileUrl(imageSave.urlPath),
                itemId: itemDetails.itemId,
                diskPath: imageSave.filePath,
              }).save()
            );
          }
        } else {
          item[key] = itemDetails[key];
        }
      }
      await Promise.all([item.save(), ...promiseOperations]);
      return res.status(200).json({ message: "item updated successfully" });
    } catch (err) {
      console.log(err);
      return res.status(500).json({ message: "error adding store info" });
    }
  };

  static toggleItem = async (req, res) => {
    //ensure item id is given
    //check status to see if is enabled or disabled
    let details = req.body;
    if (!(details.itemId && details.status && details.storeId))
      return res
        .status(400)
        .json({ message: "not all fields given, itemId and status required" });
    try {
      let item = await ItemModel.findById(details.itemId);
      if (!item)
        return res
          .status(400)
          .json({ message: "wrong item id, not item found" });
      //check if item belongs to user store
      let store = await StoreModel.findById(details.storeId);
      if (store._id.toString() !== item.storeId.toString())
        return res
          .status(401)
          .json({ message: "item doesn't belong to user's store" });
      item.enable = details.status === "enable";
      await item.save();
      return res.status(200).json({ message: "item visibility changed", item });
    } catch (err) {
      console.log(err);
      return res.status(500).json({ message: "internal error" });
    }
  };

  //update order status
  static updateOrderStatus = async (req, res) => {
    //update the status of an order accepted or rejected
    let orderDetails = req.body;
    if (!(orderDetails.orderId && orderDetails.status))
      //requires order id and status
      return res
        .status(400)
        .json({ message: "status and order id are required" });
    //get the order
    if(!["ACCEPTED", "REJECTED"].includes(orderDetails.status.toUpperCase()))
      return res.status(400).json({message: "The order status can either be ACCEPTED or REJECTED"})
    let order = await OrderModel.findById(orderDetails.orderId);
    //check if order is meant for vendor
    if (order.vendorId.toString() !== req.user._id.toString())
        return res.status(401).json({ message: "vendor not authorized" });
    //updated order status
    if (orderDetails.status.toUpperCase() === "ACCEPTED") {
      //update notification accordingly
      order.vendorStatus = "ACCEPTED"
      order.customerStatus = "APPROVED";
      //Find Rider by algorithm
      let availableRiders = await findAvailableRiders(order.address.coordinates[0], order.address.coordinates[1]);
      if(availableRiders.length === 0) {
        //inform admin
      } else {
        let selectedRider = availableRiders[0];
        SocketServices.sendOrderNotificationRider(io, selectedRider.riderId, {address:order.address, orderId:order._id.toString()})
      }
    } else {
      //notify customer order is rejected
      order.vendorAcceptanceStatus = "REJECTED"
      order.customerStatus = "APPROVED";
    }
    //notify customer
    await order.save();
    return res.status(200).json({ orderId: order._id });
  };

  static toggleItemSize = async (req, res) => {
    //ensure item id is given
    //check status to see if is enabled or disabled
    let details = req.body;
    if (!(details.sizeId && details.status && details.storeId))
      return res
        .status(400)
        .json({ message: "not all fields given, sizeId and status required" });
    try {
      let size = await ItemSizesModel.findById(details.sizeId);
      if (!size) return res.status(400).json({ message: "wrong size id" });
      //check if item belongs to user store
      let store = await StoreModel.findById(details.storeId);
      let item = await ItemModel.findById(size.itemId);
      if (store._id.toString() !== item.storeId.toString())
        return res
          .status(401)
          .json({ message: "item doesn't belong to user's store" });
      size.enable = details.status === "enable";
      await size.save();
      return res.status(200).json({ message: "size visibility changed", size });
    } catch (err) {
      console.log(err);
      return res.status(500).json({ message: "internal error" });
    }
  };

  static deleteItem = async (req, res) => {
    //ensure item id is given
    //use item id to delete item
    //check if user is verified
    try {
      let storeOwnerIdentity = await VerifyIdentityModel.findOne({
        userId: req.user._id,
      });
      if (!storeOwnerIdentity || storeOwnerIdentity.status !== "verified")
        return res
          .status(401)
          .json({ message: "vendor identity not verified" });
      let storeId = req.params.storeId;
      let store = await StoreModel.findById(storeId);
      if (!store)
        return res.status(400).json({ message: "user doesn't have a store" });

      let itemId = req.params.itemId;
      let item = await ItemModel.findById(itemId);
      if (!item)
        return res
          .status(400)
          .json({ message: "no item entry found, check item id" });
      if (item.storeId.toString() !== store._id.toString())
        return res
          .status(401)
          .json({ message: "item doesn't belong to user's store" });
      await Promise.all([
        ItemModel.deleteOne({ _id: itemId }),
        ItemImageModel.deleteMany({ itemId }),
        ItemSizesModel.deleteMany({ itemId }),
      ]);
      deleteFolder(
        path.join(
          path.resolve("."),
          "public",
          "store-items",
          req.user._id.toString() + itemId
        )
      );
      return res.status(200).json({ message: "item deleted" });
    } catch (err) {
      console.log(err);
      return res.status(500).json({ message: "internal error" });
    }
  };

  static getStores = async (req, res) => {
    //returns the stores of the user
    let stores = await StoreModel.find({ userId: req.user._id })
      .populate({ path: "type", select: "name _id" }).populate("payment")
      .lean();
    return res.status(200).json(stores);
  };

  static deleteItemSize = async (req, res) => {
    //ensure item id is given
    //use item id to delete item
    //check if user is verified
    let storeOwnerIdentity = await VerifyIdentityModel.findOne({
      userId: req.user._id,
    });
    if (!storeOwnerIdentity || storeOwnerIdentity.status !== "verified")
      return res.status(401).json({ message: "vendor identity not verified" });
    let storeId = req.params.storeId;
    let store = await StoreModel.findById(storeId);
    if (!store)
      return res.status(400).json({ message: "user doesn't have a store" });
    let sizeId = req.params.sizeId;
    let itemSize = await ItemSizesModel.findById(sizeId);
    if (!itemSize)
      return res
        .status(400)
        .json({ message: "wrong size id, no size  entry found" });
    let item = await ItemModel.findById(itemSize.itemId);
    if (item.storeId.toString() !== store._id.toString())
      return res
        .status(401)
        .json({ message: "item doesn't belong to user's store" });
    try {
      await ItemSizesModel.deleteOne({ _id: sizeId });
      return res.status(200).json({ message: "size deleted" });
    } catch (err) {
      console.log(err);
      return res.status(500).json({ message: "internal error" });
    }
  };

  static getStoreItems = async (req, res) => {
    try {
      let storeId = req.params.storeId;
      let limit = req.query.limit ? req.query.limit : 30;
      let page = req.query.page ? req.query.page : 1;
      if (page < 0) page = 1;
      let offset = (page - 1) * limit;
      let storeOwnerIdentity = await VerifyIdentityModel.findOne({
        userId: req.user._id,
      });
      if (!storeOwnerIdentity || storeOwnerIdentity.status !== "verified")
        return res
          .status(401)
          .json({ message: "vendor identity not verified" });

      let store = await StoreModel.findById(storeId);
      if (!store)
        return res.status(400).json({ message: "no store entry found" });

      let count = await ItemModel.countDocuments({ storeId: store._id });
      let userItems = await ItemModel.find({ storeId: store._id })
        .skip(offset)
        .limit(limit)
        .populate("images", "url")
        .populate("itemSizes", "-__v")
        .populate("categoryId", "-__v")
        .populate("subCategoryId", "-__v")
        .lean();
      return res.status(200).json({ limit, page, count, items: userItems });
    } catch (err) {
      console.log(err);
      return res.status(500).json({ message: "internal error" });
    }
  };

  static getVendorOrders = async (req, res) => {
    try {
      // Ensure the user is authenticated and is a vendor
      const vendorId = req.user._id; // Assuming req.user contains the authenticated vendor's details

      // Fetch orders for the vendor
      const orders = await OrderModel.find({ vendorId })
        .populate("customerId", "name email") // Include customer details (e.g., name and email)
        // .populate("ItemSizes") // Include details about order items
        // .populate("storeId", "name") // Include store name
        .sort({ createdAt: -1 }) // Sort by most recent orders
        .lean();

      if (!orders || orders.length === 0) {
        return res
          .status(404)
          .json({ message: "No orders found for this vendor" });
      }
      const orderIds = orders.map((order) => order._id);
      const orderItems = await OrderItemModel.find({
        orderId: { $in: orderIds },
      })
        .populate({
          path: "itemSizeId",
          select: "name itemId",
          populate: {
            path: "itemId",
            select: "name",
          },
        })
        // .populate("itemSizeId", "name price") // Populate item size details
        .lean();
      // const orderItemsMap = orderItems.reduce((acc, item) => {
      //   acc[item.orderId] = acc[item.orderId] || [];
      //   acc[item.orderId].push(item);
      //   return acc;
      // }, {});

      // const enrichedOrders = orders.map((order) => ({
      //   ...order,
      //   items: orderItemsMap[order._id] || [],
      // }));

      // return res.status(200).json(enrichedOrders);
      const orderItemsMap = orderItems.reduce((acc, item) => {
        acc[item.orderId] = acc[item.orderId] || [];
        acc[item.orderId].push(item);
        return acc;
      }, {});

      const enrichedOrders = orders.map((order) => ({
        ...order,
        items: orderItemsMap[order._id] || [],
      }));

      // Group by date
      const groupedOrders = enrichedOrders.reduce((acc, order) => {
        const date = new Date(order.createdAt).toISOString().split("T")[0]; // Extract date part
        if (!acc[date]) acc[date] = [];
        acc[date].push(order);
        return acc;
      }, {});

      return res.status(200).json(groupedOrders);
      // return res.status(200).json({ orderItems });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Error fetching orders" });
    }
  };

  static getRecentVendorOrders = async (req, res) => {
    try {
      const vendorId = req.user._id; // Assuming req.user contains the authenticated vendor's details

      // Define the number of recent orders to fetch
      const limit = parseInt(req.query.limit, 10) || 5; // Default to 5 if no limit is provided

      // Fetch recent orders for the vendor
      const orders = await OrderModel.find({ vendorId })
        .populate("customerId", "name email") // Include customer details
        .sort({ createdAt: -1 }) // Sort by most recent orders
        .limit(limit) // Limit to the top `n` recent orders
        .lean();

      if (!orders || orders.length === 0) {
        return res
          .status(404)
          .json({ message: "No orders found for this vendor" });
      }

      const orderIds = orders.map((order) => order._id);

      // Fetch items related to the recent orders
      const orderItems = await OrderItemModel.find({
        orderId: { $in: orderIds },
      })
        .populate({
          path: "itemSizeId",
          select: "name itemId",
          populate: {
            path: "itemId",
            select: "name",
          },
        })
        .lean();

      // Map items to their respective orders
      const orderItemsMap = orderItems.reduce((acc, item) => {
        acc[item.orderId] = acc[item.orderId] || [];
        acc[item.orderId].push(item);
        return acc;
      }, {});

      // Enrich orders with their items
      const enrichedOrders = orders.map((order) => ({
        ...order,
        items: orderItemsMap[order._id] || [],
      }));

      return res.status(200).json(enrichedOrders);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Error fetching recent orders" });
    }
  };

  static orderStatus = async (req, res) => {
    //returns the vendor status of an order
      return UserController.getOrderStatus("vendor", req, res)
  }

  //get recent pending orders
  static pendingOrdersRecent = async(req, res) => {
    let pendingOrders = OrderItemModel.find({vendorStatus: "PENDING"}).populate("customerId").limit(10).lean();
    for(order of pendingOrders) {
      let orderItems = await OrderItemModel.find({orderId: order._id}).populate("itemSizeId").select("-_v").lean();
      //find the images and attach
      let images = await ItemImageModel.find({itemId: orderItems.itemSizeId.itemId});
      orderItems.itemSizeId.itemImages = images;
      order.orderItems = orderItems;
    }
    return res.status(200).json(pendingOrders);
  }

  //get payment store 
  static paymentStore = async (req, res) => {
    let storeId = req.params.storeId;
    try {
      let paymentStore = await PaymentVendorModel.findOne({storeId}).lean()
      if(!paymentStore)
          return res.status(400).json({message: "cant find store"})
      return res.status(200).json(paymentStore)
    }catch(err) {
      console.log(err)
      return res.status(500).json({"message": "internal error"})
    }
  }

  //get payment vendorId
  static paymentVendor = async (req, res) => {
    try {
      let vendorId  = req.params.vendorId;
      return await PaymentVendorModel.find({userId:vendorId}).lean();
    } catch(err) {
      console.log(err)
      return res.status(500).json({message: "wrong vendor id"})
    }
  }
}

// Import necessary modules

// Endpoint to fetch nearby stores grouped by category, with items included

export { VendorController };
