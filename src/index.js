const adminRoute = require('./admin/admin.route');
const { userRoute, userModel, otpModel } = require('./user');
const { categoryModel, serviceModel, categoryRoute, serviceRoute } = require('./services');
const { providerRoute, providerModel, proServiceModel } = require('./provider');


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
proServiceModel.belongsTo(serviceModel, { foreignKey: "serviceId", as: "serviceTitle" });

// provider has many providerService and providerService exactly belongs to one provider
// ONE-TO-MANY
providerModel.hasMany(proServiceModel, { foreignKey: "providerId", as: "ownService" });
proServiceModel.belongsTo(providerModel, { foreignKey: "providerId", as: "provider" });


providerModel.hasOne(otpModel, { foreignKey: "providerId", as: "otp" });
otpModel.belongsTo(providerModel, { foreignKey: "providerId", as: "provider" });

userModel.hasOne(otpModel, { foreignKey: "userId", as: "otp" });
otpModel.belongsTo(userModel, { foreignKey: "userId", as: "user" });

const insertQuery = async () => {
  // create admin
  await userModel.create({
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

  // create category and service
  const categories = ["Carpenter Works", "Contructions", "Auto Mobile", "Saloon", "Live Stocks", "Plumbing"];
  for (let categoryName of categories) {
    console.log({ categoryName });
    const c = await categoryModel.create({ categoryName });
    await serviceModel.create({ title: categoryName, categoryId: c.id });
  }

};

(async () => { await insertQuery(); })();

module.exports = { userRoute, adminRoute, serviceRoute, providerRoute, categoryRoute, serviceRoute };