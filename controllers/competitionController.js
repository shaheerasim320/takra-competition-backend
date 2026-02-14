const Competition = require("../models/Competition");
const User = require("../models/User");

// @desc    Get all competitions with filtering, sorting, and pagination
// @route   GET /api/competitions
// @access  Public
exports.getAllCompetitions = async (req, res) => {
  try {
    const {
      search,
      category,
      startDate,
      endDate,
      sort, // 'newest', 'popular' (registrations), 'trending' (views)
      page = 1,
      limit = 10,
    } = req.query;

    let query = { isActive: true };

    // Search functionality
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    // Filter by Category
    if (category) {
      query.category = category;
    }

    // Filter by Date (Competitions likely to be active/starting in this range)
    if (startDate || endDate) {
      query.startDate = {};
      if (startDate) query.startDate.$gte = new Date(startDate);
      // Logic adjustment: If filtering by date, we usually mean competitions happening around that time
      // For simplicity, let's filter by start date range
      if (endDate) query.startDate.$lte = new Date(endDate);
    }

    // Sorting
    let sortOption = {};
    if (sort === "popular") {
      sortOption = { registrationCount: -1 };
    } else if (sort === "trending") {
      sortOption = { views: -1 };
    } else {
      // Default to newest
      sortOption = { createdAt: -1 };
    }

    const competitions = await Competition.find(query)
      .populate("category", "name")
      .sort(sortOption)
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Competition.countDocuments(query);

    res.status(200).json({
      competitions,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page),
      totalCompetitions: total,
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// @desc    Get single competition
// @route   GET /api/competitions/:id
// @access  Public
exports.getCompetitionById = async (req, res) => {
  try {
    const competition = await Competition.findById(req.params.id)
      .populate("category", "name description")
      .populate("createdBy", "name"); // Optional: show creator

    if (!competition) {
      return res.status(404).json({ message: "Competition not found" });
    }

    // Increment views for trending logic
    competition.views += 1;
    await competition.save();

    res.status(200).json(competition);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// @desc    Register for a competition
// @route   POST /api/competitions/:id/register
// @access  Private
exports.registerForCompetition = async (req, res) => {
  try {
    const userId = req.user._id;
    const competitionId = req.params.id;

    const competition = await Competition.findById(competitionId);
    if (!competition) {
      return res.status(404).json({ message: "Competition not found" });
    }

    // 1. Check if registration is open
    const now = new Date();
    if (new Date(competition.registrationDeadline) < now) {
      return res.status(400).json({ message: "Registration deadline has passed" });
    }

    // 2. Check max participants
    if (
      competition.maxParticipants &&
      competition.participants.length >= competition.maxParticipants
    ) {
      return res.status(400).json({ message: "Competition is full" });
    }

    // 3. Check if already registered
    const isRegistered = competition.participants.some(
      (p) => p.user.toString() === userId.toString()
    );

    if (isRegistered) {
      return res.status(400).json({ message: "User already registered" });
    }

    // Register user with pending status
    competition.participants.push({ user: userId, status: "pending" });
    competition.registrationCount = competition.participants.length;
    await competition.save();

    // Add to user's registered competitions
    const user = await User.findById(userId);
    if (!user.registeredCompetitions.includes(competitionId)) {
      user.registeredCompetitions.push(competitionId);
      await user.save();
    }

    res.status(200).json({ message: "Registration successful — pending confirmation" });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// @desc    Create a new competition
// @route   POST /api/competitions
// @access  Private (Admin)
exports.createCompetition = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      rules,
      prizes,
      startDate,
      endDate,
      registrationDeadline,
      maxParticipants,
    } = req.body;

    // Basic Validation
    if (!title || !description || !category || !rules || !startDate || !endDate || !registrationDeadline) {
      return res.status(400).json({ message: "Please fill in all required fields" });
    }

    // Date Logic Validation
    const start = new Date(startDate);
    const end = new Date(endDate);
    const deadline = new Date(registrationDeadline);

    if (end <= start) {
      return res.status(400).json({ message: "End date must be after start date" });
    }

    if (deadline >= start) {
      return res.status(400).json({ message: "Registration deadline must be before start date" });
    }

    const competition = await Competition.create({
      title,
      description,
      category,
      rules,
      prizes,
      startDate,
      endDate,
      registrationDeadline,
      maxParticipants,
      createdBy: req.user._id,
    });

    res.status(201).json(competition);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// @desc    Update a competition
// @route   PUT /api/competitions/:id
// @access  Private (Admin)
exports.updateCompetition = async (req, res) => {
  try {
    const competition = await Competition.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate("category", "name");

    if (!competition) {
      return res.status(404).json({ message: "Competition not found" });
    }

    res.status(200).json(competition);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// @desc    Delete a competition
// @route   DELETE /api/competitions/:id
// @access  Private (Admin)
exports.deleteCompetition = async (req, res) => {
  try {
    const competition = await Competition.findByIdAndDelete(req.params.id);
    if (!competition) {
      return res.status(404).json({ message: "Competition not found" });
    }
    res.status(200).json({ message: "Competition deleted" });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// @desc    Get all registrations for a competition
// @route   GET /api/competitions/:id/registrations
// @access  Private (Admin)
exports.getCompetitionRegistrations = async (req, res) => {
  try {
    const competition = await Competition.findById(req.params.id)
      .populate("participants.user", "name email avatar");

    if (!competition) {
      return res.status(404).json({ message: "Competition not found" });
    }

    res.status(200).json({
      competitionTitle: competition.title,
      participants: competition.participants,
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// @desc    Update registration status (confirm/reject)
// @route   PATCH /api/competitions/:id/registrations/:userId
// @access  Private (Admin)
exports.updateRegistrationStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!["pending", "confirmed", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const competition = await Competition.findById(req.params.id);
    if (!competition) {
      return res.status(404).json({ message: "Competition not found" });
    }

    const participant = competition.participants.find(
      (p) => p.user.toString() === req.params.userId
    );

    if (!participant) {
      return res.status(404).json({ message: "Participant not found" });
    }

    participant.status = status;
    await competition.save();

    res.status(200).json({ message: `Registration ${status}`, participant });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};
