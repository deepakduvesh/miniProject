// model required
const User = require("../models/UserModel");
const Hostel = require("../models/HostelModel");
const Complaint = require("../models/ComplaintModel");
const Caretaker = require("../models/CaretakerModel");
const Warden = require("../models/WardenModel")
const ChiefWarden = require("../models/ChiefWardenModel")

// required for sending mail for verification otp to user mail id 
const mailSender = require("../utils/mailsender");

// dependency required
require("dotenv").config();


// create personal complaint
exports.createPersonalComplaint = async (req, res) => {
  try {
    // step-1 : fetch data from complaint form
    const {
      userId,
      categoryType,
      subCategoryType,
      title,
      currentStatus,
      description,
      image,
    } = req.body;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: `User not found`,
      });
    }

    // console.log("user :: ", user);

    // Step 3: Get the hostelId from the user document
    const hostelId = user.hostel;

    // Step 4: Find the hostel document by hostelId
    const hostel = await Hostel.findById(hostelId);

    if (!hostel) {
      return res.status(404).json({
        success: false,
        message: `Hostel not found`,
      });
    }

    // step-3 : create the complaint
    
    const complaint = await Complaint.create({
      category: {
        categoryType: categoryType,
        subCategoryType: subCategoryType,
      },
      currentStatus : 'pending',
      title: title,
      description: description,
      createdBy: userId,
      receivedBy: hostel.careTaker,
      warden: hostel.warden,
      upvotes:[userId],
      hostel : hostelId,
      createdAt: new Date(),
      image: image,
    });

    // step-4 : save this in the caretaker received complaint
    await Caretaker.findByIdAndUpdate(
      hostel.careTaker,
      { $push: { complaints: complaint._id } },
      { new: true }
    );
    await Warden.findByIdAndUpdate(
      hostel.warden,
      { $push: { complaints: complaint._id } },
      { new: true }
    );

    // Step 5: Save the complaint ID in the user's pending complaints array
    await User.findByIdAndUpdate(
      userId,
      { $push: { pendingComplaints: complaint._id } },
      { new: true }
    );

    // *** after 7 days it will saved into the warden received complaint portal ***

    // step-4 : return response
    res.status(200).json({
      success: true,
      message: `complaint created successfully`,
      complaint,
    });
  } catch (error) {
    console.log("error occured while creating new complaint : ", error);
    return res.status(401).json({
      success: false,
      message: `complaint not created`,
    });
  }
};



exports.getMyComplaints = async (req, res) => {
  const userId = req.params.userId;
  try {
    const user = await User.findById(userId).select("-password").populate({
      path: 'pendingComplaints ongoingComplaints solvedComplaints',
      populate: {
        path: 'createdBy receivedBy warden',
        select: '-password',
      },
    });
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: "User not found" 
      });
    }
    const { pendingComplaints, ongoingComplaints, solvedComplaints } = user;
    const complaints = {
      pending: pendingComplaints,
      ongoing: ongoingComplaints,
      solved: solvedComplaints,
    };
    res.json({ 
      success: true, 
      complaints 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false, 
      message: "Something went wrong while fetching my complaints" 
    });
  }
};




exports.getCommonComplaint = async (req, res) => {
  try {
    const userId = req.params.userId;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: `User not found`,
      });
    }

    // console.log("user :: ", user);

    const hostelId = user.hostel;

    const hostel = await Hostel.findById(hostelId);

    if (!hostel) {
      return res.status(404).json({
        success: false,
        message: `Hostel not found`,
      });
    }

    const complaints = await Complaint.find({ hostel: hostelId });

    res.status(200).json({
      success: true,
      complaints,
    });
  } catch (error) {
    console.log("error occured while fetching all common complaint : ", error);
    return res.status(401).json({
      success: false,
      message: `common complaint not found`,
    });
  }
};


exports.markOngoing = async (req, res) => {
  try {
    const { complaintId, } = req.body;

    const complaint = await Complaint.findByIdAndUpdate(
      complaintId,
      { currentStatus: 'ongoing' },
      { new: true }
    );

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: `complaint not found`,
      });
    }

    const user = await User.findById(complaint.createdBy);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: `User not found for the complaint`,
      });
    }

    user.pendingComplaints.pull(complaintId);
    user.ongoingComplaints.push(complaintId);
    await user.save();

    res.status(200).json({
      success: true,
      message: `complaint marked as ongoing successfully`,
      complaint,
    });
  } catch (error) {
    console.log("error occured while marking complaint as ongoing : ", error);
    return res.status(401).json({
      success: false,
      message: `complaint not marked as ongoing`,
    });
  }
};


exports.markSolved = async (req, res) => {
  try {
    const { complaintId, } = req.body;

    const complaint = await Complaint.findByIdAndUpdate(
      complaintId,
      { currentStatus: 'solved' },
      { new: true }
    );

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: `complaint not found`,
      });
    }

    const user = await User.findById(complaint.createdBy);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: `User not found for the complaint`,
      });
    }

    user.ongoingComplaints.pull(complaintId);
    user.solvedComplaints.push(complaintId);
    await user.save();

    res.status(200).json({
      success: true,
      message: `complaint marked as solved successfully`,
      complaint,
    });
  } catch (error) {
    console.log("error occured while marking complaint as solved : ", error);
    return res.status(401).json({
      success: false,
      message: `complaint not marked as solved`,
    });
  }
};


const sendVerificationMail = async (email, complaint) => {
  try {
    const title = "Complaint rejected";
    const body = `
    <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px; text-align: center;">
      <h1 style="color: #4CAF50; font-size: 28px; margin-bottom: 20px;">MNNIT Complaint Portal</h1>
      <p style="color: #555; font-size: 16px; margin-bottom: 20px;">${complaint}</p>
      <p style="color: #888; font-size: 14px; margin-top: 20px;">MNNIT Complaint Portal Team</p>
    </div>
    `;

    const mailResponse = await mailSender(email, title, body);
    // console.log(`otp send successfully `, mailResponse);
  } catch (error) {
    console.log("otp sending error", error);
    throw error;
  }
};

exports.rejectComplaint = async (req, res) => {
  try {
    const { complaintId, } = req.body;

    const complaint = await Complaint.findByIdAndUpdate(
      complaintId,
      { currentStatus: 'rejected' },
      { new: true }
    );

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: `complaint not found`,
      });
    }

    const user = await User.findById(complaint.createdBy);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: `User not found for the complaint`,
      });
    }

    user.pendingComplaints.pull(complaintId);
    await user.save();

    const mailResp = await sendVerificationMail(user.email, complaint);

    res.status(200).json({
      success: true,
      message: `complaint marked as rejected successfully`,
      complaint,
      mailResp,
    });
  } catch (error) {
    console.log("error occured while marking complaint as rejected : ", error);
    return res.status(401).json({
      success: false,
      message: `complaint not marked as rejected`,
    });
  }
};