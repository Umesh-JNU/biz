const ErrorHandler = require("../utils/errorHandler");
const catchAsyncError = require("../utils/catchAsyncError");
const {userModel, WishList}=require("../models/userModel")

// postgres://my_biz12_user:zUT6XLKMppDpOqMzk3glqKA3ZDbehrcU@dpg-cn297b0l5elc73eafkng-a.oregon-postgres.render.com/my_biz12 -external
// postgres://my_biz12_user:zUT6XLKMppDpOqMzk3glqKA3ZDbehrcU@dpg-cn297b0l5elc73eafkng-a/my_biz12  internal

exports.getAll=catchAsyncError(async(req,res,next)=>{
     const users=userModel.findAll()
     res.status(200).json(users)
})


exports.verifyProvider=catchAsyncError(async(req,res,next)=>{
    const {providerId}=req.body
    const user= await userModel.findOne({where:{id:providerId}})
    if(!user){
        return next(new ErrorHandler("Provider Do not exist"))
    }
    console.log(user.roleId)
    if(user.roleId!=2){
      return next(new ErrorHandler("Restricted Action"))
    }
    user.isverified=true;
    await user.save()
    res.status(200).json("status updated")

})

exports.activateProider=catchAsyncError(async(req,res,next)=>{
    const {providerId}=req.body
    const user= await userModel.findOne({where:{id:providerId}})
    if(!user){
        return next(new ErrorHandler("Provider Do not exist"))
    }
    console.log(user.roleId)
    if(user.roleId!=2){
      return next(new ErrorHandler("Restricted Action"))
    }
    user.isactivated=true;
    await user.save()
    res.status(200).json("status updated")

})


exports.deleteUser=catchAsyncError(async(req,res,next)=>{
    const {userId}=req.body
    const user =userModel.findByPk(userId)
    if(!user){
        return next(new ErrorHandler("User Do not exist"))
    }
    var role=user.roleId
    if(role==1){
         role="User"
    } 
    else{
         role="Provider"
    }   
    await userModel.destroy({where:{id:userId}})
    res.status(200).json({message:`${role} deleted`})
})

