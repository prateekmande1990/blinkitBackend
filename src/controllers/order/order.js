import Order from "../../models/order.js";
import Branch from "../../models/branch.js";
import { Customer, DeliveryPartner } from "../../models/user.js";

// export const createOrder = async (req, res) => {
//   try {
//     const { userId } = req.user;
//     const { items, branch, totalPrice } = req.body;

//     const cutomerData = await Customer.findById(userId);
//     const branchData = await Branch.findById(branch);
//     console.log("userId", userId);
//     console.log("customer data", cutomerData);
//     console.log("items", items);
//     console.log("branch", branch);
//     console.log("totalPrice", totalPrice);

//     if (!cutomerData) {
//       return res.status(404).send({ message: "Customer not found" });
//     }
//     if (!branchData) {
//       return res.status(404).send({ message: "Branch not found" });
//     }
//     const newOrder = new Order({
//       customer: userId,
//       items: items.map((item) => ({
//         id: item.id,
//         item: item.item,
//         count: item.count,
//       })),
//       branch: branch,
//       totalPrice: totalPrice,
//       deliveryLocation: {
//         latitude: cutomerData?.liveLocation?.latitude,
//         longitude: cutomerData?.liveLocation?.longitude,
//         address: cutomerData?.address || "No Address Available",
//       },
//       pickupLocation: {
//         latitude: branchData?.location?.latitude,
//         longitude: branchData?.location?.longitude,
//         address: branchData?.address || "No Address Available",
//       },
//     });

//     const savedOrder = await newOrder.save();

//     return res.status(201).send(savedOrder);
//   } catch (error) {
//     console.log(error);
//     return res.status(500).send({ message: "Failed to create order", error });
//   }
// };

export const createOrder = async (req, res) => {
  try {
    const { userId } = req.user;
    const { items, branch, totalPrice } = req.body;

    const customerData = await Customer.findById(userId);
    const branchData = await Branch.findById(branch);

    if (!customerData) {
      return res.status(404).send({ message: "Customer not found" });
    }
    if (!branchData) {
      return res.status(404).send({ message: "Branch not found" });
    }

    const newOrder = new Order({
      customer: userId,
      items: items.map((item) => ({
        id: item.id,
        item: item.item,
        count: item.count,
      })),
      branch: branch,
      totalPrice: totalPrice,
      deliveryLocation: {
        latitude: customerData?.liveLocation?.latitude,
        longitude: customerData?.liveLocation?.longitude,
        address: customerData?.address || "No Address Available",
      },
      pickupLocation: {
        latitude: branchData?.location?.latitude,
        longitude: branchData?.location?.longitude,
        address: branchData?.address || "No Address Available",
      },
      deliveryPersonLocation: {
        latitude: customerData?.liveLocation?.latitude,
        longitude: customerData?.liveLocation?.longitude,
        address: customerData?.address || "No Address Available",
      },
    });

    const savedOrder = await newOrder.save();
    return res.status(201).send(savedOrder);
  } catch (error) {
    console.log(error);
    return res.status(500).send({ message: "Failed to create order", error });
  }
};

export const confirmOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { userId } = req.user;
    const { deliveryPersonLocation } = req.body;

    const deliveryPerson = await DeliveryPartner.findById(userId);

    if (!deliveryPerson) {
      return res.status(404).send({ message: "Delivery Person not found" });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).send({ message: "Order not found" });
    }

    if (order.status !== "available") {
      return res.status(400).send({ message: "Order is not available" });
    }
    order.status = "confirmed";

    order.deliveryPartner = userId;
    order.deliveryPersonLocation = {
      latitude: deliveryPersonLocation?.latitude,
      longitude: deliveryPersonLocation?.longitude,
      address: deliveryPersonLocation?.address || "",
    };
    await order.save();

    return res.send(order);
  } catch (error) {
    return res.status(500).send({ message: "Failed to confirm order", error });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, deliveryPersonLocation } = req.body;

    const { userId } = req.user;
    const deliveryPerson = await DeliveryPartner.findById(userId);
    if (!deliveryPerson) {
      return res.status(404).send({ message: "Delivery Person not found" });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).send({ message: "Order not found" });
    }

    if (["cancelled", "delivered"].includes(order.status)) {
      return res.status(400).send({ message: "Order can not be updated" });
    }

    if (order.deliveryPartner.toString() !== userId) {
      return res.status(403).send({ message: "Unauthorized" });
    }
    order.status = status;

    order.deliveryPersonLocation = deliveryPersonLocation;
    await order.save();

    return res.send(order);
  } catch (error) {
    res
      .status(500)
      .send({ message: "Error occoured while updating order status", error });
  }
};

export const getOrders = async (req, res) => {
  try {
    const { status, customerId, deliveryPartnerId, branchId } = req.query;
    let query = {};

    if (status) {
      query.status = status;
    }
    if (customerId) {
      query.customer = customerId;
    }
    if (deliveryPartnerId) {
      query.deliveryPartner = deliveryPartnerId;
      query.branch = branchId;
    }

    const orders = await Order.find(query).populate(
      "customer branch items.item deliveryPartner"
    );

    return res.send(orders);
  } catch (error) {
    return res.status(500).send({ message: "Failed to retrive orders", error });
  }
};

export const getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId).populate(
      "customer branch items.item deliveryPartner"
    );

    if (!order) {
      return res.status(404).send({ message: "Order not found" });
    }

    return res.send(order);
  } catch (error) {
    return res.status(500).send({ message: "Failed to retrive order", error });
  }
};
