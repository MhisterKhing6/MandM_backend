//handles admin operations

import { CategoriesModel } from "../models/categories.js"
import { ItemModel } from "../models/items.js"
import { subCategoriesModel } from "../models/subCategories.js"
import { UserModel } from "../models/user.js"
import { VerifyIdentityModel } from "../models/verifyIdentity.js"
import { StoreModel } from "../models/stores.js"

class AdminController {
    /*
        upload category
    */
    static uploadCategory = async (req, res) => {
        let details = req.body
        try {
            if (!details.categories || !Array.isArray(details.categories) || details.categories.length === 0)
                return res.status(400).json({ "message": "categories should be given and it must be a list" })
            let categoriesObject = []
            for (const categoryName of details.categories) {
                let savedCate = await CategoriesModel.findOne({ name: categoryName.toLowerCase() }).lean()
                console.log(savedCate)
                if (!savedCate)
                    categoriesObject.push(new CategoriesModel({ name: categoryName.toLowerCase() }).save())
            }
            await Promise.all(categoriesObject)
            return res.status(200).json({ message: "categories saved successfully" })
        } catch (err) {
            console.log(err)
            return res.status(500).json({ message: "internal error" })
        }
    }

    /*
        upload category
    */
    static uploadSubCategories = async (req, res) => {
        let details = req.body
        try {
            if (!(details.categoryId && details.subCategories))
                return res.status(400).json({ "message": "not all fields given" })
            if (!Array.isArray(details.subCategories))
                return res.status(400).json({ "message": "subCategories should be an array, containing categories name, eg:['break fast', 'lunch']" })
            if (details.subCategories.length === 0)
                return res.status(400).json({ "message": "no subCategories names given" })
            let category = await CategoriesModel.findById(details.categoryId)
            if (!category)
                return res.status(400).json({ "message": "no category entry found for category id" })
            let subCategoriesObject = []
            for (const subName of details.subCategories) {
                let savedSub = await subCategoriesModel.findOne({ categoryId: category._id, name: subName.toLowerCase() })
                if (savedSub)
                    continue
                let subCat = new subCategoriesModel({ name: subName, categoryId: category._id })
                category.subCategories.push(subCat)
                subCategoriesObject.push(subCat.save())
            }
            await Promise.all([category.save(), ...subCategoriesObject])
            return res.status(200).json({ message: "sub categories saved successfully" })
        } catch (err) {
            console.log(err)
            return res.status(500).json({ message: "internal error" })
        }
    }

    /*
        toggle category
    */
    static toggleCategory = async (req, res) => {
        let details = req.body
        if (!(details.categoryId && details.status))
            return res.status(400).json({ message: "not all fields given, categoryId and status required" })
        try {
            let category = await CategoriesModel.findById(details.categoryId)
            if (!category)
                return res.status(400).json({ "message": "wrong category id, no category found" })
            category.enable = details.status === "enable"
            if (details.all)
                await ItemModel.updateMany({ categoryId: category._id }, { enable: category.enable })
            await category.save()
            return res.status(200).json({ "message": "category visibility changed" })
        } catch (err) {
            console.log(err)
            return res.status(500).json({ "message": "internal error" })
        }
    }

    /*
      toggle sub  category
       */
    static toggleSubCategory = async (req, res) => {
        let details = req.body
        if (!(details.subCategoryId && details.status))
            return res.status(400).json({ message: "not all fields given, subCategoryId and status required" })
        try {
            let subCategory = await subCategoriesModel.findById(details.subCategoryId)
            if (!subCategory)
                return res.status(400).json({ "message": "wrong subCategory id, no sub category information found" })
            subCategory.enable = details.status === "enable"
            if (details.all)
                await ItemModel.updateMany({ subCategoryId: subCategory._id })
            await category.save()
            return res.status(200).json({ "message": "subCategory visibility changed" })
        } catch (err) {
            console.log(err)
            return res.status(500).json({ "message": "internal error" })
        }
    }

    /*
   delete category
    */
    static deleteCategory = async (req, res) => {
        try {
            let categoryId = req.params.categoryId
            let category = await CategoriesModel.findById(categoryId)
            if (!category)
                return res.status(400).json({ message: "no category entry found, check category id" })
            await Promise.all([CategoriesModel.deleteOne({ _id: categoryId }), subCategoriesModel.deleteMany({ categoryId })])
            return res.status(200).json({ "message": "category deleted" })
        } catch (err) {
            console.log(err)
            return res.status(500).json({ "message": "internal error" })
        }
    }

    /*
      delete sub category
       */
    static deleteSubCategory = async (req, res) => {
        try {
            let subId = req.params.subCategoryId
            await subCategoriesModel.deleteOne({ _id: subId })
            return res.status(200).json({ "message": "subCategory deleted" })
        } catch (err) {
            console.log(err)
            return res.status(500).json({ "message": "internal error" })
        }
    }

    /*
   toggle identity verification
    */
    static toggleVenderIdentityVerification = async (req, res) => {
        try {
            let details = req.body
            if (!details.verificationId && details.status)
                return res.status(400).json({ "message": "not all fields given, verification id and status required" })
            let vendorIdentity = await VerifyIdentityModel.findById(details.verificationId).populate("userId", "-__v -password")
            if (details.status === "enable")
                vendorIdentity.status = "verified"
            else if (details.status === "disable")
                vendorIdentity.status = "disabled"
            await vendorIdentity.save()
            return res.status(200).json({ "message": "vendor changed", user: vendorIdentity.userId })
        } catch (err) {
            console.log(err)
            return res.status(500).json({ "message": "internal error" })
        }
    }

    static getVendorVerificationRequests = async (req, res) => {
        let email = req.query.email
        let type = req.query.type
        let limit = req.query.limit ? req.query.limit : 30
        let page = req.query.page ? req.query.page : 1
        try {
        let user = await UserModel.findOne({ email }).lean()
        let filter = { status: { $ne: "verified" } }
        if (type) {
            if (type === "all")
                filter = {}
            else if (type === "pending")
                filter = { status: "pending" }
            else if (type === "disable")
                filter = { status: "disable" }
        }
        page = page < 1 ? 1 : page
        let offset = (page - 1) * limit
        if (user) {
            filter.userId = user._id
            offset = 0
        } else if (!user && email) {
            return res.status(200).json({ page: 0, limit, items: [] })
        }
        let vendorsVerifications = await VerifyIdentityModel.find(filter).select("-__v").skip(offset).limit(limit).populate("userId", "email name").lean()
        return res.status(200).json({ page, limit, items: vendorsVerifications })
    }catch(err) {
        console.log(err)
        return res.status(500).json({message: "internal error"})
    }
    }

    static viewUserInfo = async (req, res) => {

        let email = req.query.email
        let role = req.params.type
        let users = []
        if (email) {
            users.push(await UserModel.findOne({ email, role }).lean().select("-__v"))
        } else {
            let limit = req.params.limit
            let page = req.params.page
            page = page < 1 ? 1 : page
            let offset = (page - 1) * limit
            let listedUsers = await UserModel.find({ role }).skip(offset).limit(limit).select("-__v").lean()
            users.push(...listedUsers)
        }
        if (role === "vendor") {
            for (let i = 0; i < users.length; i++) {
                let userSTore = await StoreModel.findOne({ userId: users[i]._id }).select("-__v").lean()
                users[i].store = userSTore
                let verificationInfo = await VerifyIdentityModel({ userId: users[i]._id }).lean().select("-__v ")
                users[i].verificationInfo = verificationInfo
            }
        }
        return res.status(200).json({ page, limit, items: users })

    }
}
export { AdminController }