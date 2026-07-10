const Article = require('../models/Article');
const SupportSettings = require('../models/SupportSettings');

// --- ARTICLES ---

// @desc    Get all articles
// @route   GET /api/support/articles
// @access  Public or Admin
const getArticles = async (req, res) => {
  try {
    const articles = await Article.find().sort({ createdAt: -1 });
    res.json(articles);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Add new article
// @route   POST /api/support/articles
// @access  Admin
const addArticle = async (req, res) => {
  try {
    const { title, category, content, status, isPopular } = req.body;

    const article = new Article({
      title,
      category,
      content,
      status: status || 'Published',
      isPopular: isPopular || false
    });

    const savedArticle = await article.save();
    res.status(201).json(savedArticle);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Update article
// @route   PUT /api/support/articles/:id
// @access  Admin
const updateArticle = async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);
    if (article) {
      article.title = req.body.title || article.title;
      article.category = req.body.category || article.category;
      article.content = req.body.content || article.content;
      article.status = req.body.status || article.status;
      
      if (req.body.isPopular !== undefined) {
        article.isPopular = req.body.isPopular;
      }

      const updatedArticle = await article.save();
      res.json(updatedArticle);
    } else {
      res.status(404).json({ message: 'Article not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Delete article
// @route   DELETE /api/support/articles/:id
// @access  Admin
const deleteArticle = async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);
    if (article) {
      await article.deleteOne();
      res.json({ message: 'Article removed' });
    } else {
      res.status(404).json({ message: 'Article not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// --- SETTINGS ---

// @desc    Get support settings
// @route   GET /api/support/settings
// @access  Public or Admin
const getSettings = async (req, res) => {
  try {
    let settings = await SupportSettings.findOne();
    if (!settings) {
      settings = await SupportSettings.create({}); // Create default if missing
    }
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Update support settings
// @route   PUT /api/support/settings
// @access  Admin
const updateSettings = async (req, res) => {
  try {
    let settings = await SupportSettings.findOne();
    if (!settings) {
      settings = new SupportSettings(req.body);
    } else {
      settings.email = req.body.email || settings.email;
      settings.phone = req.body.phone || settings.phone;
      settings.liveChatUrl = req.body.liveChatUrl || settings.liveChatUrl;
      settings.timing = req.body.timing || settings.timing;
    }

    const updatedSettings = await settings.save();
    res.json(updatedSettings);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Chat with AI Support (Google Gemini)
// @route   POST /api/support/chat
// @access  Public
const chatWithSupport = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(200).json({
        success: true,
        reply: "Sorry, the AI support is currently offline (Missing API Key). Please call our helpline."
      });
    }

    const systemPrompt = `You are a helpful customer support assistant for Bharat EV Prime, an electric vehicle charging station network in India. 
Your job is to help users with EV charging queries, app usage, wallet issues, booking issues, and general EV-related questions.
Provide short, friendly, and helpful answers. You can respond in Hindi, English, or Hinglish based on user preference.
Keep replies under 100 words.`;

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`;

    const response = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: systemPrompt + '\n\nUser: ' + message }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 200
        }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Gemini API Error:', data);
      return res.status(500).json({
        success: false,
        reply: "I am having trouble connecting right now. Please try again later."
      });
    }

    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || 
                  "Sorry, I couldn't generate a response. Please try again.";

    res.status(200).json({
      success: true,
      reply: reply.trim()
    });

  } catch (error) {
    console.error('Gemini Chat Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process chat request.',
      reply: "I am having trouble connecting right now. Please try again later."
    });
  }
};

module.exports = {
  getArticles,
  addArticle,
  updateArticle,
  deleteArticle,
  getSettings,
  updateSettings,
  chatWithSupport
};
