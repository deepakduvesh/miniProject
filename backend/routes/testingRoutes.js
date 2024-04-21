
// required dependency
const express = require("express");
const router = express.Router();


// importing required controler
// auth controller
const {sendOtp, signup, login, logout, } = require('../controller/Auth');


// profile controler
const {getUserProfileById, updateUserProfileById} = require('../controller/Profile');


// complaint controller
const {createPersonalComplaint, getMyComplaints, getCommonComplaint, markOngoing, markSolved} = require('../controller/Complaint');


//careTaker controller
const {loginCareTaker, getAllComplaints} = require("../controller/CareTaker");


// admin controller
const {createHostel, } = require('../controller/Hostel');
const { createCaretaker } = require("../controller/CareTaker");
const  {createWarden,warden,loginWarden } = require("../controller/Warden");


// fileUpload controller
const {imageUpload, } = require('../controller/fileUpload')

// other controller


// auth routing
router.post('/sendOtp' , sendOtp);
router.post('/signup' , signup);
router.post('/login' , login);
router.get('/logout' , logout);



// profile routing
router.get('/getUserProfileById/:userId', getUserProfileById);
router.put('/updateUserProfileById', updateUserProfileById);


// complaint routing
router.post('/createPersonalComplaint', createPersonalComplaint);
router.get('/getMyComplaints/:userId', getMyComplaints);
router.get('/getCommonComplaint/:userId', getCommonComplaint);
router.post('/markOngoing', markOngoing);
router.post('/markSolved', markSolved);



// careTaker routing
router.post('/loginCareTaker' , loginCareTaker);
router.get('/getAllComplaints/:userId', getAllComplaints);



// admin routing :  creating hostel, caretaker, warden
router.post('/createHostel', createHostel);
router.post('/createCaretaker', createCaretaker);
router.post('/createWarden', createWarden);




// file upload routing
router.post('/imageUpload', imageUpload);


// other routing

// router.get('/caretakerInfo',careTakerInfo);
// router.get('/WardenInfo',WardenInfo);
router.post('/loginWarden',loginWarden)
router.get('/wardenDashboard/:userId',warden);


// export route
module.exports = router; 
