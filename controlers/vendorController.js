import { StoreModel } from "../models/stores";
import { VerifyIdentityModel } from "../models/verifyIdentity";
import { generateFileUrl, saveUploadFileDisk } from "../utils/FileHandler";

class VendorController {
  static addStore = async (req, res) => {
    //ensure store owner has verified identity
    //check if store information is accurate
    //check to see if all the details are given

    let storeOwnerIdentity = await VerifyIdentityModel.findOne({
      userId: req.user._id,
    });
    if (storeOwnerIdentity.status !== "verified")
      return res.status(401).json({ message: "vendor identity not verified" });

    let store = req.body;
    if (!(storeInfo.storeName && store.storeAddress && store.storePhone))
      return res.status(400).json({ message: "not all fields given" });
    //save store information
    try {
      let storeInfo = await new StoreModel(store).save();
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

      if (!(identityInfo.idCard && identityInfo.picture))
        return res
          .status(401)
          .json({ message: "not all fields given" });

      let idCard = await saveUploadFileDisk(identityInfo.idCard.fileName,identityInfo.idCard.data, req.user._id, "vId"  )
      let userPic = await saveUploadFileDisk(identityInfo.userPic.fileName,identityInfo.userPic.data, req.user._id, "vId" )
      await VerifyIdentityModel({status: "pending",userId: req.user._id, idCard: generateFileUrl(idCard.filePath), userPic: generateFileUrl(userPic.filePath)})
      return res.status(200).json({ message: "verification in progress, please wait for 2 working days"});
    } catch (err) {
      console.log(err);
      return res.status(501).json({ message: "couldn't add identity" });
    }
  };
}

export {VendorController}