const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth");
const {
  getAllCompetitions,
  getCompetitionById,
  registerForCompetition,
  createCompetition,
  updateCompetition,
  deleteCompetition,
  getCompetitionRegistrations,
  updateRegistrationStatus,
} = require("../controllers/competitionController");

/**
 * @swagger
 * components:
 *   schemas:
 *     Competition:
 *       type: object
 *       required:
 *         - title
 *         - description
 *         - category
 *         - startDate
 *         - endDate
 *         - registrationDeadline
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated id of the competition
 *         title:
 *           type: string
 *           description: The title of the competition
 *         description:
 *           type: string
 *           description: The description of the competition
 *         category:
 *           type: string
 *           description: The category ID
 *         rules:
 *           type: string
 *           description: rules of competition
 *         prizes:
 *           type: string
 *           description: prizes details
 *         startDate:
 *           type: string
 *           format: date-time
 *           description: The start date of the competition
 *         endDate:
 *           type: string
 *           format: date-time
 *           description: The end date of the competition
 *         registrationDeadline:
 *           type: string
 *           format: date-time
 *           description: The registration deadline
 *         maxParticipants:
 *           type: number
 *           description: Maximum number of participants
 *         registrationCount:
 *           type: number
 *           description: Number of registered participants
 *         views:
 *           type: number
 *           description: Number of views (for trending)
 *       example:
 *         id: 60d0fe4f5311236168a109cb
 *         title: Coding Challenge
 *         description: A 24-hour coding challenge
 *         category: 60d0fe4f5311236168a109ca
 *         rules: "No cheating"
 *         prizes: "First place: $1000"
 *         startDate: 2023-10-01T10:00:00Z
 *         endDate: 2023-10-02T10:00:00Z
 *         registrationDeadline: 2023-09-30T23:59:59Z
 *         maxParticipants: 100
 *         registrationCount: 15
 *         views: 120
 */

/**
 * @swagger
 * tags:
 *   name: Competitions
 *   description: The competitions managing API
 */

/**
 * @swagger
 * /competitions:
 *   get:
 *     summary: Returns the list of all competitions
 *     tags: [Competitions]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for title or description
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category ID
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [newest, popular, trending]
 *         description: Sort order
 *     responses:
 *       200:
 *         description: The list of competitions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 competitions:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Competition'
 *                 totalPages:
 *                   type: integer
 *                 currentPage:
 *                   type: integer
 *                 totalCompetitions:
 *                   type: integer
 */
router.get("/", getAllCompetitions);

router.post("/", protect, authorize("admin"), createCompetition);

router.get("/:id", getCompetitionById);

router.post("/:id/register", protect, registerForCompetition);

// Admin routes
router.put("/:id", protect, authorize("admin"), updateCompetition);
router.delete("/:id", protect, authorize("admin"), deleteCompetition);
router.get("/:id/registrations", protect, authorize("admin"), getCompetitionRegistrations);
router.patch("/:id/registrations/:userId", protect, authorize("admin"), updateRegistrationStatus);

module.exports = router;
