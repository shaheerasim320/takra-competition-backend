const express = require("express");
const router = express.Router();
const {
  getAllCompetitions,
  getCompetitionById,
  registerForCompetition,
  createCompetition,
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

/**
 * @swagger
 * /competitions:
 *   post:
 *     summary: Create a new competition
 *     tags: [Competitions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - category
 *               - rules
 *               - startDate
 *               - endDate
 *               - registrationDeadline
 *               - userId
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *                 description: Category ID
 *               rules:
 *                 type: string
 *               prizes:
 *                 type: string
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *               registrationDeadline:
 *                 type: string
 *                 format: date-time
 *               maxParticipants:
 *                 type: number
 *               userId:
 *                 type: string
 *                 description: ID of user creating the competition
 *     responses:
 *       201:
 *         description: Competition created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Competition'
 *       400:
 *         description: Invalid input or date logic error
 *       404:
 *         description: User not found
 */
router.post("/", createCompetition);

/**
 * @swagger
 * /competitions/{id}:
 *   get:
 *     summary: Get a competition by ID
 *     tags: [Competitions]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The competition ID
 *     responses:
 *       200:
 *         description: The competition description by id
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Competition'
 *       404:
 *         description: Competition not found
 */
router.get("/:id", getCompetitionById);

/**
 * @swagger
 * /competitions/{id}/register:
 *   post:
 *     summary: Register for a competition
 *     tags: [Competitions]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The competition ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *             properties:
 *               userId:
 *                 type: string
 *                 description: The ID of the user registering
 *     responses:
 *       200:
 *         description: Registration successful
 *       400:
 *         description: Registration failed (already registered, full, or deadline passed)
 *       404:
 *         description: Competition or User not found
 */
router.post("/:id/register", registerForCompetition);

module.exports = router;
