const adminRoute = require('./admin/admin.route');
const { userRoute, userModel, otpModel } = require('./user');
const { categoryRoute, serviceRoute, categoryModel, serviceModel } = require('./services');
const { providerRoute, providerModel, proServiceModel, availabilityModel } = require('./provider');
const { albumRoute, videoModel, postModel } = require('./posts');
// const { enquiryRoute, enquiryModel } = require("./enquiry");
const { contentRoute } = require("./contents");

// One Category has many service and one service belongs to exactly on category
// ONE-TO-MANY
categoryModel.hasMany(serviceModel, { foreignKey: "categoryId", as: "services" });
serviceModel.belongsTo(categoryModel, { foreignKey: "categoryId", as: "category" });

// provider has many category and category may belongs many provider
// MANY-TO-MANY
providerModel.belongsToMany(categoryModel, { through: "ProviderCategory", foreignKey: "providerId", as: "categories" });
categoryModel.belongsToMany(providerModel, { through: "ProviderCategory", foreignKey: "categoryId", as: "providers" });

// provider has many service and service may belongs many provider
// MANY-TO-MANY
providerModel.belongsToMany(serviceModel, { through: "ProviderService", foreignKey: "providerId", as: "services" });
serviceModel.belongsToMany(providerModel, { through: "ProviderService", foreignKey: "serviceId", as: "providers" });

// service has many providerService and providerService exactly belongs to one service
// ONE-TO-MANY
serviceModel.hasMany(proServiceModel, { foreignKey: "serviceId", as: "proServices" });
proServiceModel.belongsTo(serviceModel, { foreignKey: { name: "serviceId", allowNull: false }, as: "serviceTitle" });

// provider has many providerService and providerService exactly belongs to one provider
// ONE-TO-MANY
providerModel.hasMany(proServiceModel, { foreignKey: "providerId", as: "ownService" });
proServiceModel.belongsTo(providerModel, { foreignKey: { name: "providerId", allowNull: false }, as: "provider" });

providerModel.hasMany(availabilityModel, { foreignKey: "providerId", as: "time" });
availabilityModel.belongsTo(providerModel, { foreignKey: "providerId", as: "provider" });

providerModel.hasMany(postModel, { foreignKey: "providerId", as: "posts" });
postModel.belongsTo(providerModel, { foreignKey: "providerId", as: "provider" });

providerModel.hasOne(videoModel, { foreignKey: { name: "providerId", unique: true }, as: "video" });
videoModel.belongsTo(providerModel, { foreignKey: "providerId", as: "provider" });

providerModel.hasOne(otpModel, { foreignKey: "providerId", as: "otp" });
otpModel.belongsTo(providerModel, { foreignKey: "providerId", as: "provider" });

userModel.hasOne(otpModel, { foreignKey: "userId", as: "otp" });
otpModel.belongsTo(userModel, { foreignKey: "userId", as: "user" });

providerModel.belongsToMany(userModel, { through: "Enquiry", foreignKey: "providerId", as: "enquirer" });
userModel.belongsToMany(providerModel, { through: "Enquiry", foreignKey: "userId", as: "enquiry" });

// userModel.hasOne(enquiryModel, { foreignKey: "userId", as: "enquiry" });
// enquiryModel.belongsTo(userModel, { foreignKey: "userId", as: "user" });

const insertQuery = async () => {
  // create admin
  const admin = await userModel.create({
    email: "umesh.quantumitinnovation@gmail.com",
    password: "password",
    fullname: "Umesh Kumar",
    gender: 'M',
    isVerified: true,
    country_code: "IN",
    role: "Admin",
    profileImage: "https://jeff-truck.s3.amazonaws.com/biz/1710496638163-user-logo.jpg",
    mobile_no: "7667826351"
  });

  // const provider = await providerModel.create({
  //   email: "jnu.umeshkr@gmail.com",
  //   password: "password",
  //   fullname: "Umesh Kumar",
  //   gender: 'M',
  //   isVerified: true,
  //   country_code: "IN",
  //   role: "Provider",
  //   profileImage: "https://jeff-truck.s3.amazonaws.com/biz/1710496638163-user-logo.jpg",
  //   document: "https://jeff-truck.s3.amazonaws.com/biz/1710496638163-user-logo.jpg",
  //   buisness_name: "businame",
  //   buisness_location: "adf",
  //   id_no: 1234567890,
  //   mobile_no: "7667826351"
  // });

  const user = await userModel.create({
    email: "umesh15900951@gmail.com",
    password: "password",
    fullname: "Umesh User",
    gender: 'M',
    isVerified: true,
    country_code: "IN",
    role: "User",
    profileImage: "https://jeff-truck.s3.amazonaws.com/biz/1710496638163-user-logo.jpg",
    mobile_no: "7667826351"
  });
  // console.log({ provider, user, admin })
  // create category and service
  const categories = ["Carpenter Works", "Contructions", "Auto Mobile", "Saloon", "Live Stocks", "Plumbing"];
  for (let categoryName of categories) {
    console.log({ categoryName });
    try {
      const c = await categoryModel.create({ categoryName });
      await serviceModel.create({ title: categoryName, categoryId: c.id, image: "https://imgs.search.brave.com/RXCYuHuwvOlyK2JPJLZuaA99a5m6WQ80V7I7AmUMBGM/rs:fit:500:0:0/g:ce/aHR0cHM6Ly90My5m/dGNkbi5uZXQvanBn/LzAwLzg5LzEwLzY4/LzM2MF9GXzg5MTA2/ODEyX0Q4SjZZN0t6/Z0xyMUZLVGdPWVpL/WVNNNDU4QlhUQ2FY/LmpwZw" });
    }
    catch (err) {
      console.log("Error -->", err.message);
    }
  }

};

// (async () => { await insertQuery(); })();

module.exports = { userRoute, adminRoute, serviceRoute, providerRoute, categoryRoute, serviceRoute, albumRoute, contentRoute };