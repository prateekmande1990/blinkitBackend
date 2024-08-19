import { Customer, DeliveryPartner } from "../../models/user.js";
import jwt from "jsonwebtoken";
import "dotenv/config";

const generateTokens = (user) => {
  const accessToken = jwt.sign(
    { userId: user._id, role: user.role },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: "1d" }
  );

  const refreshToken = jwt.sign(
    { userId: user._id, role: user.role },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: "1d" }
  );

  return { accessToken, refreshToken };
};

export const loginCustomer = async (req, res) => {
  try {
    const { phone } = req.body;
    let customer = await Customer.findOne({ phone });
    if (!customer) {
      customer = new Customer({
        phone,
        role: "Customer",
        isActivated: true,
      });

      await customer.save();
    }

    const { accessToken, refreshToken } = generateTokens(customer);

    return res.send({
      message: customer
        ? "Login Successfull"
        : "Customer created and logged in",
      accessToken,
      refreshToken,
      customer,
    });
  } catch (error) {
    return res.status(500).send({ message: "An error occoured", error });
  }
};

export const loginDeliveryPartner = async (req, res) => {
  try {
    const { email, password } = req.body;
    const deliveryPartner = await DeliveryPartner.findOne({ email });
    if (!deliveryPartner) {
      return res
        .status(404)
        .send({ message: "Delivery Partner not found", error });
    }
    const isMatch = password === deliveryPartner.password;

    if (!isMatch) {
      res.status(400).send({ message: "Invalid Credentials", error });
    }

    const { accessToken, refreshToken } = generateTokens(deliveryPartner);
    return res.send({
      message: "Login Successfull",
      accessToken,
      refreshToken,
      deliveryPartner,
    });
  } catch (error) {
    return res.status(500).send({ message: "An Error  Occoured", error });
  }
};

export const refreshToken = async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).send({ message: "Refresh Token Required" });
  }
  try {
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    let user;
    if (decoded.role === "Customer") {
      user = await Customer.findById(decoded.userId);
    } else if (decoded.role === "DeliveryPartner") {
      user = await DeliveryPartner.findById(decoded.userId);
    } else {
      return res.status(403).send({ message: "Invalid Role" });
    }

    if (!user) {
      return res.status(403).send({ message: "Invalid refresh token" });
    }

    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user);
    return res.send({
      message: "Token Refreshed",
      accessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    return res.status(403).send({ message: "Invalid Refresh Token" });
  }
};

export const fetchUser = async (req, res) => {
  try {
    const { userId, role } = req.user;
    let user;
    if (role === "Customer") {
      user = await Customer.findById(userId);
    } else if (role === "DeliveryPartner") {
      user = await DeliveryPartner.findById(userId);
    } else {
      return res.status(403).send({ message: "Invalid Role" });
    }

    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }

    return res.send({
      message: "User fetched successfully",
      user,
    });
  } catch (error) {
    return res.status(500).send({ message: "An error occoured", error });
  }
};
