const { GoogleGenerativeAI } = require("@google/generative-ai");
const Competition = require("../models/Competition");
const Category = require("../models/Category");

// Store conversation history per user (in-memory for simplicity)
const conversationHistory = new Map();

const SYSTEM_PROMPT = `You are Taakra AI Assistant, a helpful chatbot for the Taakra Competition Platform. 
You help users with:
- Finding and understanding competitions
- Registration processes and deadlines
- Platform navigation and features
- General questions about competition categories and rules

Keep responses concise, friendly, and helpful. Use emojis sparingly. 
If you don't know something specific about a competition, suggest the user check the competition details page.
Always be encouraging about participation in competitions.`;

// @desc    Chat with AI assistant
// @route   POST /api/chatbot/message
// @access  Private
exports.sendMessage = async (req, res) => {
    try {
        const { message } = req.body;
        const userId = req.user._id.toString();

        if (!message || !message.trim()) {
            return res.status(400).json({ success: false, message: "Message is required" });
        }

        // Gather context about available competitions
        let context = "";
        try {
            const activeCompetitions = await Competition.find({ isActive: true })
                .populate("category", "name")
                .select("title description category startDate endDate registrationDeadline registrationCount")
                .limit(10)
                .sort({ createdAt: -1 });

            const categories = await Category.find().select("name description");

            context = `
Current platform data:
- Active competitions: ${activeCompetitions.map(c => `"${c.title}" (${c.category?.name || 'General'}, starts ${c.startDate?.toLocaleDateString()}, deadline ${c.registrationDeadline?.toLocaleDateString()}, ${c.registrationCount} registered)`).join('; ')}
- Categories: ${categories.map(c => c.name).join(', ')}
`;
        } catch (e) {
            context = "Could not fetch current platform data.";
        }

        // Check for Gemini API key
        if (!process.env.GEMINI_API_KEY) {
            // Fallback: rule-based responses when no API key
            const response = getFallbackResponse(message);
            return res.status(200).json({
                success: true,
                response,
                source: "fallback",
            });
        }

        // Initialize Gemini
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        // Get or create conversation history
        if (!conversationHistory.has(userId)) {
            conversationHistory.set(userId, []);
        }
        const history = conversationHistory.get(userId);

        // Build chat
        const chat = model.startChat({
            history: history.map((msg) => ({
                role: msg.role,
                parts: [{ text: msg.content }],
            })),
            systemInstruction: SYSTEM_PROMPT + "\n\n" + context,
        });

        const result = await chat.sendMessage(message);
        const responseText = result.response.text();

        // Update history (keep last 20 messages)
        history.push({ role: "user", content: message });
        history.push({ role: "model", content: responseText });
        if (history.length > 20) {
            history.splice(0, history.length - 20);
        }

        res.status(200).json({
            success: true,
            response: responseText,
            source: "ai",
        });
    } catch (error) {
        console.error("Chatbot error:", error);
        // Fallback on error
        const response = getFallbackResponse(req.body.message);
        res.status(200).json({
            success: true,
            response,
            source: "fallback",
        });
    }
};

// @desc    Clear conversation history
// @route   DELETE /api/chatbot/history
// @access  Private
exports.clearHistory = (req, res) => {
    const userId = req.user._id.toString();
    conversationHistory.delete(userId);
    res.status(200).json({ success: true, message: "Conversation cleared" });
};

// Fallback responses when Gemini API is not available
function getFallbackResponse(message) {
    const msg = message.toLowerCase();

    if (msg.includes("hello") || msg.includes("hi") || msg.includes("hey")) {
        return "👋 Hello! Welcome to Taakra! I'm your AI assistant. I can help you find competitions, understand registration processes, and navigate the platform. What would you like to know?";
    }
    if (msg.includes("competition") && (msg.includes("find") || msg.includes("search") || msg.includes("browse"))) {
        return "🔍 You can browse all competitions from your Dashboard! Use the search bar to find specific competitions, filter by category, or sort by newest/popular/trending. Check out the Calendar view for a timeline perspective!";
    }
    if (msg.includes("register") || msg.includes("sign up") || msg.includes("join")) {
        return "📝 To register for a competition:\n1. Browse competitions from the Dashboard\n2. Click on a competition to view details\n3. Click the 'Register' button\n4. Your registration will be pending until an admin confirms it\n\nMake sure to register before the deadline!";
    }
    if (msg.includes("deadline") || msg.includes("when")) {
        return "⏰ Each competition has its own registration deadline. You can find the exact date on the competition details page. Check the Calendar view for a visual overview of all upcoming deadlines!";
    }
    if (msg.includes("category") || msg.includes("categories")) {
        return "📂 Competitions are organized by categories. You can filter competitions by category using the filter bar on the Dashboard. Categories include various fields and topics!";
    }
    if (msg.includes("help") || msg.includes("support")) {
        return "🆘 I'm here to help! You can:\n• Ask me about competitions and registration\n• Use the Chat feature to talk to support staff\n• Browse the FAQ on the website\n\nWhat specific help do you need?";
    }
    if (msg.includes("profile") || msg.includes("account")) {
        return "👤 You can manage your profile from the Profile page! There you can update your name, avatar, and change your password. Check 'My Competitions' to see all your registrations and their status.";
    }

    return "🤖 I'm Taakra AI Assistant! I can help you with:\n• Finding competitions\n• Registration process\n• Understanding deadlines\n• Platform navigation\n\nPlease ask me a specific question and I'll do my best to help!";
}
