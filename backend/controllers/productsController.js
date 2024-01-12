const Product = require("../models/productModel");
const ErrorHandler = require("../utils/errorHandler");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const ApiFeatures = require("../utils/apiFeatures");

const fs = require("fs");
const cloudinary = require("cloudinary");

const getAllProducts = catchAsyncErrors(async (req, res, next) => {
  const resultPerPage = 5;
  const productCount = await Product.countDocuments();

  const apiFeatures = new ApiFeatures(Product.find(), req.query)
    .search()
    .filter()
    .paginate(resultPerPage);
  const products = await apiFeatures.query;

  res.status(200).json({
    success: true,
    products,
    productCount,
  });
});

const createProduct = catchAsyncErrors(async (req, res, next) => {
  const imagesLinks = [];

  if (req.files !== null) {
    const { images } = req.files;

    const imagesArr = Array.isArray(images) ? images : [images];

    for (av of imagesArr) {
      if (!fs.existsSync("public/products")) {
        fs.mkdirSync("public/products", { recursive: true });
      }

      fs.writeFileSync(`public/products/${av.name}`, av.data);

      const myCloud = await cloudinary.v2.uploader.upload(
        `public/products/${av.name}`,
        {
          folder: "products",
        }
      );

      imagesLinks.push({
        public_id: myCloud.public_id,
        url: myCloud.secure_url,
      });
    }
  }

  req.body.user = req.user.id;
  req.body.images = imagesLinks;

  const product = await new Product(req.body);

  await product.save();

  res.status(201).json({
    success: true,
    message: "Product created sucessfully",
    product,
  });
});

const updateProduct = catchAsyncErrors(async (req, res, next) => {
  let product = await Product.findById(req.params.id);

  if (!product) {
    return next(new ErrorHandler("Product not found", 404));
  }

  const imagesLinks = [];

  if (req.files !== null) {
    console.log("i m here");
    // Deleting Images From Cloudinary
    for (let i = 0; i < product.images.length; i++) {
      await cloudinary.v2.uploader.destroy(product.images[i].public_id);
    }

    const { images } = req.files;

    const imagesArr = Array.isArray(images) ? images : [images];

    for (av of imagesArr) {
      if (!fs.existsSync("public/products")) {
        fs.mkdirSync("public/products", { recursive: true });
      }

      fs.writeFileSync(`public/products/${av.name}`, av.data);

      const myCloud = await cloudinary.v2.uploader.upload(
        `public/products/${av.name}`,
        {
          folder: "products",
        }
      );

      imagesLinks.push({
        public_id: myCloud.public_id,
        url: myCloud.secure_url,
      });
    }
  }

  req.body.images = imagesLinks;

  product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  });

  res.status(200).json({
    success: true,
    message: "Product updated sucessfully",
    product,
  });
});

const deleteProduct = catchAsyncErrors(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(new ErrorHandler("Product not found", 404));
  }

  // Deleting Images From Cloudinary
  for (let i = 0; i < product.images.length; i++) {
    await cloudinary.v2.uploader.destroy(product.images[i].public_id);
  }

  await Product.findByIdAndDelete(req.params.id);
  res.status(200).json({
    success: true,
    message: "Product deleted sucessfully",
  });
});

const getProductDetails = catchAsyncErrors(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(new ErrorHandler("Product not found", 404));
  }
  res.status(200).json({
    success: true,
    message: "Product found sucessfully",
    product,
  });
});

// can create or update user review
const createProductReview = catchAsyncErrors(async (req, res, next) => {
  const { rating, comment } = req.body;

  const review = {
    user: req.user.id,
    name: req.user.name,
    comment,
    rating: Number(rating),
  };

  const product = await Product.findById(req.query.id);

  if (!product) {
    return next(new ErrorHandler("Product not found", 404));
  }

  const isAlreadyReviewed = product.reviews.find(
    (rev) => rev.user.toString() === req.user.id
  );

  if (isAlreadyReviewed) {
    product.reviews.forEach((rev) => {
      if (rev.user.toString() === req.user.id) {
        rev.rating = Number(rating);
        rev.comment = comment;
      }
    });
  } else {
    product.reviews.push(review);
    product.numOfReviews = product.reviews.length;
  }

  let avg = 0;

  product.reviews.forEach((rev) => {
    avg += rev.rating;
  });

  product.ratings = avg / product.reviews.length;

  await product.save({ validateBeforeSave: false });

  res.status(200).json({
    success: true,
  });
});

// Get All Reviews of a product
const getProductReviews = catchAsyncErrors(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(new ErrorHandler("Product not found", 404));
  }

  res.status(200).json({
    success: true,
    reviews: product.reviews,
  });
});

// Delete Review
const deleteReview = catchAsyncErrors(async (req, res, next) => {
  const product = await Product.findById(req.query.productId);

  if (!product) {
    return next(new ErrorHandler("Product not found", 404));
  }

  const reviews = product.reviews.filter(
    (rev) => rev._id.toString() !== req.query.id.toString() // id of review
  );

  let avg = 0;

  reviews.forEach((rev) => {
    avg += rev.rating;
  });

  let ratings = 0;

  if (reviews.length === 0) {
    ratings = 0;
  } else {
    ratings = avg / reviews.length;
  }

  const numOfReviews = reviews.length;

  await Product.findByIdAndUpdate(
    req.query.productId,
    {
      reviews,
      ratings,
      numOfReviews,
    },
    {
      new: true,
      runValidators: true,
      useFindAndModify: false,
    }
  );

  res.status(200).json({
    success: true,
  });
});

module.exports = {
  getAllProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductDetails,
  createProductReview,
  getProductReviews,
  deleteReview,
};
