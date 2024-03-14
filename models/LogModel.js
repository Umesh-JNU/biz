var Sequelize = require("sequelize");
const { DataTypes, Model } = require("sequelize");
const {db}= require("../config/config")


const userLogModel= db.define(
    "User Log",
    {
        title:{
            type:DataTypes.STRING,
            allowNull:false
        },
        userId:{
            type:DataTypes.NUMBER,
            allowNull:false
        },
        status:{
            type:DataTypes.BOOLEAN,
            defaultValue:false
        },
        serviceId:{
            type:DataTypes.NUMBER,
            allowNull:false
        }

    },
    {
        timestamps: true,
        paranoid: true,
       
      }
)



module.exports={userLogModel}