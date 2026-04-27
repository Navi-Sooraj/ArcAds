import express from 'express'
import { getAllCategory, getAllCategories, getAllStaffs, getAllNurses,  getAllPatients, getAllRequests, getAllFeedbacks} from '../controllers/getServices.js'


const router= express.Router()

router.get('/getAllNurses', getAllNurses)
router.get('/getAllCategory', getAllCategory)
router.get('/getAllStaff', getAllStaffs)
router.get('/getAllPatients', getAllPatients)
router.get('/getAllCategories', getAllCategories)
router.get('/getAllRequests', getAllRequests)
router.get('/getAllFeedbacks', getAllFeedbacks)


export default router