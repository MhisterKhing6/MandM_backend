

//import order models

import { ItemSizesModel } from "../models/itemSizes";

const separateOrders = async (orders)=> {
    let separatedOrders = {};
    for(const orderItem of orders) {
        //search the orders in the database
        const orderItemEntry = await ItemSizesModel.findById(orderItem._id).populate("itemId").select("price ").lean();
        if(separatedOrders[orderItemEntry.itemId.storeId]) {
            separatedOrders[orderItemEntry.itemId.storeId].push({...orderItemEntry, ...orderItem});//separated orders
        }else {
            separatedOrders[orderItemEntry.itemId.storeId]  = [orderItemEntry];
        }
    }
    return separatedOrders; //
}

export {separateOrders};