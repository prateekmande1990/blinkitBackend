import { Customer, DeliveryPartner } from "../../models/index.js";

export const updateUser = async (req, res) => {
  try {
    const { userId } = req.user;
    const updateData = req.body;

    let user =
      (await Customer.findById(userId)) ||
      (await DeliveryPartner.findById(userId));

    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }

    let UserModel;
    if (user.role === "Customer") {
      UserModel = Customer;
    } else if (user.role === "DeliveryPartner") {
      UserModel = DeliveryPartner;
    } else {
      return res.status(400).send({ message: "Invalid user role" });
    }

    const updatedUser = await UserModel.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).send({ message: "User not found" });
    }

    return res.send({
      message: "User updated Successfully",
      user: updatedUser,
    });
  } catch (error) {
    return res.status(500).send({ message: "Failed to update user", error });
  }
};
