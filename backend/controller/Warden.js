

const bcrypt = require("bcrypt");


// model required
const User = require("../models/UserModel");
const Hostel = require("../models/HostelModel");
const Caretaker = require("../models/CaretakerModel");
const Warden = require("../models/WardenModel");
const Complaint = require("../models/ComplaintModel");


//

exports.warden = async (req, res) => {
    try {
        // Calculate the date three days ago
        const threeDaysAgo = new Date();
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

        // Query to find complaints created three days ago or earlier
        const complaints = await Complaint.find({ 
            createdAt: { $lte: threeDaysAgo },
            currentStatus: 'pending'
        });

        // Send the complaints as a response 
        // console.log(complaints);
        res.json({ complaints });
        console.log("sent")
    } catch (error) {  
        // Handle errors 
        console.error(error);  
        res.status(500).json({ error: 'Internal server error' });
    }
};



exports.createWarden= async (req, res) => {
  try {
    const { name, contactNo, email, password, hostelName } = req.body;

    const emailAlreadyPresent = await Warden.findOne({ email });

    if (emailAlreadyPresent) {
      return res.status(401).json({
        success: false,
        message: `email already registered`,
      });
    }

    const hostel = await Hostel.findOne({ name: hostelName });

    if (!hostel) {
      return res.status(404).json({
        success: false,
        message: `Hostel '${hostelName}' not found.`,
      });
    }

    // Check if a warden is already assigned to this hostel
    if (hostel.warden) { 
      return res.status(401).json({
        success: false,
        message: `A warden is already assigned to this hostel.`,
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    //  create warden
    const warden = await Warden.create({
        name,
        contactNo,
        email,
        password: hashedPassword,
        hostel: hostel._id,
    });

    // update the hostel, adding warden
    const updatedHostel = await Hostel.findByIdAndUpdate(
      hostel._id,
      { warden : warden._id },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: `Warden created successfully`,
      warden
    });
  } catch (error) {
    console.log("Warden creating error : ", error);
    return res.status(401).json({
      success: false,
      message: `somthing went wrong while creating Warden`,
    });
  }
};
